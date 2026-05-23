// ============================================================
// POST /api/webhooks/emails/inbound
// Resend Inbound: recibe emails enviados a soporte@meritoprocol.com
// Crea ticket en soporte_tickets + notifica a director-cliente
// + auto-responde al remitente confirmando recepción.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Resend inbound payload
  const from    = (payload.from    as string) ?? '';
  const subject = (payload.subject as string) ?? '(sin asunto)';
  const text    = (payload.text    as string) ?? '';
  const html    = (payload.html    as string) ?? '';
  const body    = text || html.replace(/<[^>]+>/g, ' ').trim();

  if (!from) return NextResponse.json({ ok: true, skipped: 'no_from' });

  const fromEmail = from.replace(/.*<(.+)>/, '$1').trim().toLowerCase();
  const fromNombre = from.replace(/<.+>/, '').trim().replace(/"/g, '') || fromEmail;

  const sb = createAdminClient();

  // Buscar lead por email
  const { data: lead } = await sb
    .from('leads')
    .select('id, nombre')
    .eq('email', fromEmail)
    .maybeSingle();

  // Detectar categoría por palabras clave en asunto/body
  const texto = `${subject} ${body}`.toLowerCase();
  let categoria: 'tecnico' | 'pedagogico' | 'comercial' | 'garantia' | 'otro' = 'otro';
  if (/garantía|garantia|reembolso|devolución|devolucion/.test(texto)) categoria = 'garantia';
  else if (/pago|cobro|precio|factura|descuento|cupon|cupón/.test(texto))  categoria = 'comercial';
  else if (/error|bug|falla|no carga|no funciona|pantalla/.test(texto))    categoria = 'tecnico';
  else if (/pregunta|tema|materia|módulo|modulo|clase|sesión/.test(texto)) categoria = 'pedagogico';

  // Crear ticket
  const { data: ticket, error: ticketError } = await sb
    .from('soporte_tickets')
    .insert({
      lead_id:          lead?.id ?? null,
      canal:            'email',
      categoria,
      prioridad:        categoria === 'garantia' ? 'alta' : 'normal',
      estado:           'abierto',
      mensaje_original: `De: ${from}\nAsunto: ${subject}\n\n${body.slice(0, 2000)}`,
    })
    .select('id')
    .single();

  if (ticketError) {
    console.error('[Inbound] Error creando ticket:', ticketError.message);
  }

  const ticketId = ticket?.id?.slice(0, 8) ?? 'N/A';

  // Notificar al director-cliente
  await sb.from('agent_mensajes').insert({
    de_agente:           'sistema',
    para_agente:         'director-cliente',
    tipo:                'alerta',
    asunto:              `Nuevo ticket #${ticketId} — ${categoria} — ${fromEmail}`,
    contenido:           `De: ${from}\nAsunto: ${subject}\n\nMensaje:\n${body.slice(0, 800)}`,
    prioridad:           categoria === 'garantia' ? 'alta' : 'normal',
    requiere_aprobacion: false,
    leido:               false,
  });

  // Auto-respuesta al remitente
  const nombreCorto = fromNombre.split(' ')[0] || 'aspirante';
  await resend.emails.send({
    from:    'MéritoPro Soporte <noreply@meritoprocol.com>',
    to:      fromEmail,
    subject: `Re: ${subject} — Recibimos tu mensaje (#${ticketId})`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
<div style="max-width:540px;margin:32px auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

  <div style="background:#1e293b;padding:24px 32px;">
    <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:700;letter-spacing:0.06em;">MÉRITOPRO · SOPORTE</p>
  </div>

  <div style="padding:28px 32px;">
    <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hola <strong>${nombreCorto}</strong>,</p>

    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Recibimos tu mensaje y lo estamos revisando. Te respondemos en menos de <strong>24 horas hábiles</strong>.
    </p>

    <div style="background:#f8fafc;border-left:3px solid #fbbf24;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;color:#64748b;font-size:13px;">Número de ticket: <strong style="color:#1e293b;">#${ticketId}</strong></p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Asunto: ${subject}</p>
    </div>

    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">
      Si tienes información adicional, responde este mismo correo y lo agregaremos a tu caso.
    </p>
  </div>

  <div style="background:#f1f5f9;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MéritoPro · soporte@meritoprocol.com</p>
  </div>
</div>
</body></html>`,
  }).catch(e => console.error('[Inbound] Error auto-respuesta:', e));

  console.log(`[Inbound] Ticket #${ticketId} creado — ${categoria} — ${fromEmail}`);
  return NextResponse.json({ ok: true, ticket_id: ticketId });
}
