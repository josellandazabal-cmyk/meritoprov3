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
import { crearPreferencia, mpConfigurado } from '@/lib/payments/mercadopago'
import { generarSesionWebCheckout, wompiConfigurado } from '@/lib/payments/wompi'

export const runtime = 'nodejs'

const PRECIO_BETA_COP = 297_000
const PRECIO_REGULAR_COP = 397_000

const PayloadSchema = z.object({
  lead_id:          z.string().uuid().optional(),
  email:            z.string().email(),
  nombre:           z.string().min(3).max(100),
  curso_slug:       z.string().default('pgn-2026'),
  codigo_descuento: z.string().regex(/^MERITO50-[A-Z0-9]+$/i).optional(),
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

  // Calcular monto server-side
  let monto = PRECIO_BETA_COP
  let codigoUsado: string | null = null

  if (payload.codigo_descuento) {
    const codigo = payload.codigo_descuento.toUpperCase()
    const { data: codigoRow } = await supabase
      .from('codigos_garantia')
      .select('codigo, expira_at, usado_at')
      .eq('codigo', codigo)
      .maybeSingle()

    if (!codigoRow)                        return NextResponse.json({ error: 'Código de descuento no existe.' }, { status: 400 })
    if (codigoRow.usado_at)                return NextResponse.json({ error: 'Código ya usado.' }, { status: 400 })
    if (new Date(codigoRow.expira_at) < new Date()) return NextResponse.json({ error: 'Código expirado.' }, { status: 400 })

    monto = Math.round(PRECIO_REGULAR_COP * 0.5)
    codigoUsado = codigo
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

    await supabase.from('intenciones_pago').insert({
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

  await supabase.from('intenciones_pago').insert({
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
