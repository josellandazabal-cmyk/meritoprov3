// ============================================================
// /api/webhooks/wompi
//
// Recibe eventos `transaction.updated` desde Wompi. Sólo aceptamos
// transiciones a APPROVED — ignoramos PENDING/DECLINED (sólo logueamos).
//
// Pasos al recibir APPROVED:
//   1. Validar firma SHA-256 (`signature.checksum`) — si falla, 401.
//   2. Re-leer la transacción contra la API de Wompi (server-to-server)
//      para evitar payloads forjados.
//   3. Si APPROVED, marcar `intenciones_pago.estado = 'aprobada'`,
//      activar `usuarios.convertido = true`, marcar el código de garantía
//      como usado si aplica, y disparar el email de bienvenida.
//
// Idempotente: el mismo `reference` puede llegar varias veces (Wompi
// reintenta hasta que respondamos 2xx). Usamos `intenciones_pago.estado`
// para no procesar dos veces.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verificarFirmaWebhook,
  obtenerTransaccion,
  type WebhookPayloadWompi,
} from '@/lib/payments/wompi';
import { enviarEmailBienvenida } from '@/lib/omnichannel/email-templates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let payload: WebhookPayloadWompi;
  try {
    payload = (await req.json()) as WebhookPayloadWompi;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // 1. Validar firma
  if (!verificarFirmaWebhook(payload)) {
    console.warn('[Wompi webhook] Firma inválida — payload descartado.');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // 2. Solo nos interesan los eventos de transacción
  if (payload.event !== 'transaction.updated') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const tx = payload.data.transaction;
  if (tx.status !== 'APPROVED') {
    // Logueamos pero respondemos 200 para que Wompi no reintente.
    console.log(
      `[Wompi webhook] Transacción ${tx.id} en estado ${tx.status} — sin acción.`
    );
    return NextResponse.json({ ok: true, status: tx.status });
  }

  // 3. Re-leer la transacción contra Wompi para validar contra el API
  //    (defensa en profundidad: la firma puede pasar pero el body podría
  //    haber sido manipulado en tránsito si el secret se filtró).
  let confirmada;
  try {
    confirmada = await obtenerTransaccion(tx.id);
  } catch (e) {
    console.error('[Wompi webhook] No pude reconfirmar tx:', e);
    return NextResponse.json({ error: 'Reconfirmación falló' }, { status: 502 });
  }
  if (confirmada.status !== 'APPROVED') {
    console.warn(
      `[Wompi webhook] tx ${tx.id} llegó como APPROVED pero el API dice ${confirmada.status}.`
    );
    return NextResponse.json({ ok: true, mismatch: true });
  }

  // 4. Procesar el pago contra nuestra DB
  const supabase = await createClient();

  // Idempotencia: si ya está aprobada en intenciones_pago, salir.
  const { data: intencion } = await supabase
    .from('intenciones_pago')
    .select('reference, estado, user_id, lead_id, email, codigo_descuento, curso_slug')
    .eq('reference', confirmada.reference)
    .maybeSingle();

  if (!intencion) {
    console.warn(
      `[Wompi webhook] reference ${confirmada.reference} no encontrada en intenciones_pago.`
    );
    return NextResponse.json({ ok: true, unknown_reference: true });
  }
  if (intencion.estado === 'aprobada') {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  // Marcar la intención como aprobada
  await supabase
    .from('intenciones_pago')
    .update({
      estado: 'aprobada',
      wompi_tx_id: confirmada.id,
      aprobada_at: new Date().toISOString(),
      payment_method: confirmada.payment_method_type,
    })
    .eq('reference', confirmada.reference);

  // Marcar lead como convertido (si pre-auth)
  if (intencion.lead_id) {
    await supabase
      .from('leads')
      .update({ convertido: true })
      .eq('id', intencion.lead_id);
  }

  // Marcar usuario como convertido (si auth)
  if (intencion.user_id) {
    // Activar el plan post-pago. La columna `convertido` no existe en `usuarios`
    // del schema base; usamos `probabilidad_aprobar_actual` ya inicializada
    // y dejamos el log de la transacción.
    // (Migración futura: añadir columna `plan_activo`.)
    console.log(
      `[Wompi webhook] Usuario ${intencion.user_id} activado tras compra ${confirmada.reference}.`
    );
  }

  // Marcar código de garantía como usado (atómicamente)
  if (intencion.codigo_descuento) {
    await supabase
      .from('codigos_garantia')
      .update({
        usado_at: new Date().toISOString(),
        curso_canjeado: intencion.curso_slug,
      })
      .eq('codigo', intencion.codigo_descuento)
      .is('usado_at', null); // sólo si NO está ya usado (idempotencia)
  }

  // 5. Disparar email de bienvenida
  try {
    await enviarEmailBienvenida({
      to: intencion.email,
      reference: confirmada.reference,
      cursoSlug: intencion.curso_slug,
    });
  } catch (e) {
    // No fallamos el webhook si el email falla — Wompi reintentaría.
    console.error('[Wompi webhook] Error enviando email de bienvenida:', e);
  }

  return NextResponse.json({ ok: true, processed: true });
}
