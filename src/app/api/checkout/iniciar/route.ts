// ============================================================
// POST /api/checkout/iniciar
//
// Crea una preferencia en Mercado Pago y devuelve el init_point
// al que redirigir al usuario para completar el pago.
//
// Prioridad de pasarela: Mercado Pago (primario) → Wompi (fallback si MP no está configurado)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { crearPreferencia, mpConfigurado } from '@/lib/payments/mercadopago'
import { generarSesionWebCheckout, wompiConfigurado } from '@/lib/payments/wompi'

export const runtime = 'nodejs'

const PRECIO_OFERTA_COP  = 309_000   // cubre la comisión ~3.3% de Mercado Pago
const PRECIO_REGULAR_COP = 412_000

const PayloadSchema = z.object({
  lead_id:          z.string().uuid().optional(),
  email:            z.string().email(),
  nombre:           z.string().min(3).max(100),
  curso_slug:       z.string().default('pgn-2026'),
  codigo_descuento: z.string().regex(/^[A-Z0-9]+-[A-Z0-9]+$/i).optional(),
})

export async function POST(req: NextRequest) {
  const usarMP     = mpConfigurado()
  const usarWompi  = wompiConfigurado()

  if (!usarMP && !usarWompi) {
    return NextResponse.json(
      { error: 'Pasarela de pago no configurada.' },
      { status: 503 }
    )
  }

  let payload: z.infer<typeof PayloadSchema>
  try {
    payload = PayloadSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { error: 'Payload inválido', detalle: (e as Error).message },
      { status: 400 }
    )
  }

  // Resolver referenceId: user.id si autenticado, lead_id si no.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let referenceId: string
  if (user) {
    referenceId = user.id
  } else if (payload.lead_id) {
    referenceId = payload.lead_id
  } else {
    return NextResponse.json(
      { error: 'Se requiere lead_id si no hay sesión activa.' },
      { status: 400 }
    )
  }

  // Admin client para todas las escrituras (bypasa RLS — intenciones_pago
  // solo permite INSERT via service role, la policy del usuario es solo SELECT).
  const sb = createAdminClient()

  // Calcular monto server-side
  let monto = PRECIO_OFERTA_COP
  let codigoUsado: string | null = null
  let accesoDirecto = false   // true cuando el descuento es 100%

  if (payload.codigo_descuento) {
    const codigo = payload.codigo_descuento.toUpperCase()
    // Lectura pública (policy anon permite SELECT en codigos_garantia)
    const { data: codigoRow } = await sb
      .from('codigos_garantia')
      .select('codigo, expira_at, usado_at, descuento_pct, requiere_aprobacion, aprobado_at')
      .eq('codigo', codigo)
      .maybeSingle()

    if (!codigoRow)
      return NextResponse.json({ error: 'Código de descuento no existe.' }, { status: 400 })
    if (codigoRow.usado_at)
      return NextResponse.json({ error: 'Código ya usado.' }, { status: 400 })
    if (new Date(codigoRow.expira_at) < new Date())
      return NextResponse.json({ error: 'Código expirado.' }, { status: 400 })
    if (codigoRow.requiere_aprobacion && !codigoRow.aprobado_at)
      return NextResponse.json({ error: 'Este código aún no ha sido autorizado. Contacta a soporte.' }, { status: 400 })

    const pct = codigoRow.descuento_pct ?? 50
    if (pct >= 100) {
      monto = 0
      accesoDirecto = true
    } else {
      monto = Math.round(PRECIO_REGULAR_COP * (1 - pct / 100))
    }
    codigoUsado = codigo
  }

  // ── Acceso directo (código 100 % aprobado — sin pasarela de pago) ──────────
  if (accesoDirecto) {
    const reference = `GRATIS-${referenceId.slice(0, 8)}-${Date.now()}`
    const { error: insertErr } = await sb.from('intenciones_pago').insert({
      reference,
      user_id:          user?.id ?? null,
      lead_id:          payload.lead_id ?? null,
      email:            payload.email,
      monto_cop:        0,
      curso_slug:       payload.curso_slug,
      codigo_descuento: codigoUsado,
      estado:           'aprobada',
      wompi_tx_id:      'CODIGO-100PCT',
      aprobada_at:      new Date().toISOString(),
      payment_method:   'codigo_descuento',
    })
    if (insertErr) {
      console.error('[checkout/iniciar] Error insertando acceso directo:', insertErr.message)
      return NextResponse.json({ error: 'Error activando acceso. Contacta soporte.' }, { status: 500 })
    }
    if (codigoUsado) {
      await sb.from('codigos_garantia')
        .update({ usado_at: new Date().toISOString(), curso_canjeado: payload.curso_slug })
        .eq('codigo', codigoUsado).is('usado_at', null)
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      ?? req.nextUrl.origin
    return NextResponse.json({
      redirectUrl: `${siteUrl}/dashboard/bienvenida`,
      reference,
      monto_cop:  0,
      pasarela:   'codigo_100pct',
    })
  }

  // -------------------------------------------------------------------------
  // Mercado Pago (primario)
  // -------------------------------------------------------------------------
  if (usarMP) {
    const mpResult = await crearPreferencia({
      referenceId,
      email: payload.email,
      nombre: payload.nombre,
      cursoSlug: payload.curso_slug,
      montoCop: monto,
      leadId:  payload.lead_id,
      userId:  user?.id,
      codigoDescuento: codigoUsado ?? undefined,
    })

    if (!mpResult.ok) {
      console.error('[checkout/iniciar] MP error:', mpResult.error)
      return NextResponse.json({ error: `Mercado Pago: ${mpResult.error}` }, { status: 502 })
    }

    const { preferencia } = mpResult
    const isProduction = process.env.NODE_ENV === 'production'
    const redirectUrl = isProduction ? preferencia.init_point : preferencia.sandbox_init_point

    await sb.from('intenciones_pago').insert({
      reference:        preferencia.external_reference,
      user_id:          user?.id ?? null,
      lead_id:          payload.lead_id ?? null,
      email:            payload.email,
      monto_cop:        monto,
      curso_slug:       payload.curso_slug,
      codigo_descuento: codigoUsado,
      estado:           'iniciada',
    })

    return NextResponse.json({
      redirectUrl,
      reference:  preferencia.external_reference,
      monto_cop:  monto,
      pasarela:   'mercadopago',
    })
  }

  // -------------------------------------------------------------------------
  // Wompi (fallback si MP no configurado)
  // -------------------------------------------------------------------------
  const sesion = generarSesionWebCheckout({
    referenceId,
    email: payload.email,
    nombre: payload.nombre,
    cursoSlug: payload.curso_slug,
    montoCop: monto,
    codigoDescuento: codigoUsado ?? undefined,
  })

  await sb.from('intenciones_pago').insert({
    reference:        sesion.reference,
    user_id:          user?.id ?? null,
    lead_id:          payload.lead_id ?? null,
    email:            payload.email,
    monto_cop:        monto,
    curso_slug:       payload.curso_slug,
    codigo_descuento: codigoUsado,
    estado:           'iniciada',
  })

  return NextResponse.json({
    redirectUrl: sesion.redirectUrl,
    reference:   sesion.reference,
    monto_cop:   monto,
    pasarela:    'wompi',
  })
}
