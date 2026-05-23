// ============================================================
// POST /api/webhooks/emails/resend
// Procesa eventos de tracking de Resend (opened, clicked).
// Actualiza lead score en Supabase via RPC.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    created_at?: string;
  };
}

/**
 * Verifica la firma del webhook de Resend.
 * Resend usa svix para la verificación. Si svix no está instalado,
 * se acepta el payload (verificación deshabilitada en desarrollo).
 */
async function verificarFirmaResend(
  request: NextRequest,
  rawBody: string
): Promise<boolean> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Sin secret configurado: aceptar (modo desarrollo)
    console.warn('[Resend webhook] RESEND_WEBHOOK_SECRET no configurado — saltando verificación');
    return true;
  }

  // Intentar verificar con svix-compatible headers
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  try {
    // Verificación manual HMAC compatible con svix v1
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const secretBytes = Buffer.from(webhookSecret.replace('whsec_', ''), 'base64');
    const hmac = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    const expectedSig = `v1,${hmac}`;

    // svix-signature puede tener múltiples firmas separadas por espacio
    const signatures = svixSignature.split(' ');
    return signatures.some((sig) => sig === expectedSig);
  } catch (err) {
    console.error('[Resend webhook] Error verificando firma:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const valido = await verificarFirmaResend(request, rawBody);
  if (!valido) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Extraer email del destinatario
  const emailDestinatario = event.data?.to?.[0] ?? '';
  if (!emailDestinatario) {
    return NextResponse.json({ ok: true, skipped: 'no_email' });
  }

  // Buscar el lead por email
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('email', emailDestinatario)
    .maybeSingle();

  if (!lead?.id) {
    return NextResponse.json({ ok: true, skipped: 'lead_not_found' });
  }

  // Procesar evento
  if (event.type === 'email.opened') {
    try {
      await supabase.rpc('incrementar_lead_score', {
        lead_id_param: lead.id,
        puntos: 10,
        factor: 'email_abierto',
      });

      await supabase.from('crm_eventos').insert({
        lead_id: lead.id,
        tipo: 'email_abierto',
        payload: { subject: event.data.subject, email_id: event.data.email_id },
        agente: 'sistema',
        canal: 'email',
      });

      console.log(`[Resend webhook] email.opened para lead ${lead.id} (+10 pts)`);
    } catch (err) {
      console.error('[Resend webhook] Error actualizando score (opened):', err);
    }
  } else if (event.type === 'email.clicked') {
    try {
      await supabase.rpc('incrementar_lead_score', {
        lead_id_param: lead.id,
        puntos: 15,
        factor: 'email_click_cta',
      });

      await supabase.from('crm_eventos').insert({
        lead_id: lead.id,
        tipo: 'email_click_cta',
        payload: { subject: event.data.subject, email_id: event.data.email_id },
        agente: 'sistema',
        canal: 'email',
      });

      console.log(`[Resend webhook] email.clicked para lead ${lead.id} (+15 pts)`);
    } catch (err) {
      console.error('[Resend webhook] Error actualizando score (clicked):', err);
    }
  }

  return NextResponse.json({ ok: true });
}
