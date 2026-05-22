// ============================================================
// POST /api/webhooks/mercadopago
//
// Recibe notificaciones de pago de Mercado Pago.
// Solo procesa eventos type="payment" con action="payment.updated".
//
// Flujo al recibir pago aprobado:
//   1. Verificar firma x-signature (HMAC-SHA256)
//   2. Obtener detalle del pago via API (evitar payloads forjados)
//   3. Si status="approved": marcar intenciones_pago, activar lead, email
//
// Idempotente: usa external_reference para no procesar dos veces.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  verificarFirmaMP,
  obtenerPago,
  type WebhookPayloadMP,
} from '@/lib/payments/mercadopago'
import { enviarEmailBienvenida } from '@/lib/omnichannel/email-templates'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let payload: WebhookPayloadMP
  const rawBody = await req.text()

  try {
    payload = JSON.parse(rawBody) as WebhookPayloadMP
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Ignorar eventos que no sean de pago
  if (payload.type !== 'payment') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  // 1. Verificar firma
  const reqCopy = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: rawBody,
  })
  const firmaOk = await verificarFirmaMP(reqCopy, payload)
  if (!firmaOk) {
    console.warn('[MP webhook] Firma inválida — payload descartado.')
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  // 2. Obtener detalle real del pago desde MP
  const pagoResult = await obtenerPago(payload.data.id)
  if (!pagoResult.ok) {
    console.error('[MP webhook] No pude obtener pago:', pagoResult.error)
    return NextResponse.json({ error: 'No se pudo verificar el pago' }, { status: 502 })
  }

  const pago = pagoResult.pago

  if (pago.status !== 'approved') {
    console.log(`[MP webhook] Pago ${pago.id} estado=${pago.status} — sin acción.`)
    return NextResponse.json({ ok: true, status: pago.status })
  }

  // 3. Buscar la intención de pago por external_reference
  const supabase = await createClient()
  const { data: intencion } = await supabase
    .from('intenciones_pago')
    .select('reference, estado, user_id, lead_id, email, codigo_descuento, curso_slug')
    .eq('reference', pago.external_reference)
    .maybeSingle()

  if (!intencion) {
    console.warn(`[MP webhook] reference ${pago.external_reference} no encontrada.`)
    return NextResponse.json({ ok: true, unknown_reference: true })
  }

  if (intencion.estado === 'aprobada') {
    return NextResponse.json({ ok: true, already_processed: true })
  }

  // 4. Marcar como aprobada
  await supabase
    .from('intenciones_pago')
    .update({
      estado: 'aprobada',
      wompi_tx_id: String(pago.id),       // reusa la columna existente para el MP payment ID
      aprobada_at: pago.date_approved ?? new Date().toISOString(),
      payment_method: pago.payment_type_id,
    })
    .eq('reference', pago.external_reference)

  // 5. Activar lead si es pre-auth
  if (intencion.lead_id) {
    await supabase
      .from('leads')
      .update({ convertido: true })
      .eq('id', intencion.lead_id)
  }

  // 6. Marcar código de garantía usado
  if (intencion.codigo_descuento) {
    await supabase
      .from('codigos_garantia')
      .update({
        usado_at: new Date().toISOString(),
        curso_canjeado: intencion.curso_slug,
      })
      .eq('codigo', intencion.codigo_descuento)
      .is('usado_at', null)
  }

  // 7. Email de bienvenida
  try {
    await enviarEmailBienvenida({
      to: intencion.email ?? pago.payer.email,
      reference: pago.external_reference,
      cursoSlug: intencion.curso_slug ?? 'pgn-2026',
    })
  } catch (e) {
    console.error('[MP webhook] Error email bienvenida:', e)
  }

  console.log(`[MP webhook] Pago ${pago.id} procesado — ref: ${pago.external_reference}`)
  return NextResponse.json({ ok: true, processed: true })
}
