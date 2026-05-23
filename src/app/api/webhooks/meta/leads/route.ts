// ============================================================
// GET  /api/webhooks/meta/leads — Verificación del webhook de Meta
// POST /api/webhooks/meta/leads — Importación de leads de Lead Ads
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// GET — Meta webhook verification (hub challenge)
// ---------------------------------------------------------------------------
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge ?? '', { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// ---------------------------------------------------------------------------
// Tipos de payload de Meta Lead Ads
// ---------------------------------------------------------------------------
interface MetaLeadFieldData {
  name: string;
  values: string[];
}

interface MetaLeadgenChange {
  leadgen_id: string;
  form_id: string;
  page_id: string;
}

interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    field: string;
    value: MetaLeadgenChange;
  }>;
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

// ---------------------------------------------------------------------------
// POST — Importar leads desde Meta Lead Ads
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verificar firma HMAC-SHA256
  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const appSecret = process.env.META_APP_SECRET;

  if (appSecret) {
    const expectedSignature =
      'sha256=' +
      createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.object !== 'page') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createAdminClient();
  const accessToken = process.env.META_ACCESS_TOKEN;
  let leadsCaptados = 0;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue;

      const { leadgen_id, form_id } = change.value;
      if (!leadgen_id) continue;

      try {
        // Fetch lead data from Meta Graph API
        const metaRes = await fetch(
          `https://graph.facebook.com/v20.0/${leadgen_id}?fields=field_data&access_token=${accessToken}`
        );
        const leadData = await metaRes.json() as { field_data?: MetaLeadFieldData[] };

        if (!leadData.field_data) continue;

        // Mapear campos
        const campos: Record<string, string> = {};
        for (const field of leadData.field_data) {
          campos[field.name] = field.values[0] ?? '';
        }

        const nombre = campos['full_name'] ?? campos['nombre'] ?? '';
        const email = campos['email'] ?? '';
        const celular = campos['phone_number'] ?? campos['celular'] ?? '';
        const cargoAspira = campos['cargo_aspira'] ?? campos['cargo'] ?? 'Por definir';

        if (!email) continue;

        // Insertar lead
        const { error: insertError } = await supabase.from('leads').upsert(
          {
            nombre,
            email,
            celular: celular || null,
            cargo_aspira: cargoAspira,
            etapa_crm: 'LEAD_NUEVO',
            lead_score: 0,
            utm_source: 'meta',
            utm_medium: 'lead_ads',
            utm_campaign: form_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email', ignoreDuplicates: false }
        );

        if (insertError) {
          console.error('[Meta Leads webhook] Error insertando lead:', insertError.message);
          continue;
        }

        // Registrar evento CRM
        const { data: leadRow } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email)
          .single();

        if (leadRow?.id) {
          await supabase.from('crm_eventos').insert({
            lead_id: leadRow.id,
            tipo: 'lead_captado_meta',
            payload: {
              leadgen_id,
              form_id,
              nombre,
              cargo_aspira: cargoAspira,
            },
            agente: 'meta_ads',
            canal: 'meta',
          });
        }

        leadsCaptados++;
      } catch (err) {
        console.error('[Meta Leads webhook] Error procesando leadgen_id', leadgen_id, ':', err);
      }
    }
  }

  console.log(`[Meta Leads webhook] Leads captados: ${leadsCaptados}`);
  return NextResponse.json({ ok: true, leads_captados: leadsCaptados });
}
