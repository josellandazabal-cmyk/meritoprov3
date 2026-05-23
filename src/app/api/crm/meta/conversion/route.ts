// ============================================================
// POST /api/crm/meta/conversion
// Dispara evento de conversión (Purchase) al Conversion API de Meta
// y mueve el lead entre audiencias personalizadas.
// Llamado después de confirmar pago.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ejecutarToolMeta } from '@/lib/meta/mcp-server';

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  pago_id: z.string().optional(),
  monto_cop: z.number().positive(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: 'Payload inválido', details: String(err) },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const errores: string[] = [];

  // 1. Enviar evento Purchase a CAPI
  try {
    await ejecutarToolMeta('meta_send_capi_event', {
      event_name: 'Purchase',
      email: body.email,
      valor_cop: body.monto_cop,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.lead_id,
    });
  } catch (err) {
    const msg = `CAPI error: ${String(err)}`;
    console.error('[Meta conversion]', msg);
    errores.push(msg);
  }

  // 2. Remover de audiencia HOT
  const audienceHot = process.env.META_AUDIENCE_HOT;
  if (audienceHot) {
    try {
      await ejecutarToolMeta('meta_update_custom_audience', {
        audience_id: audienceHot,
        emails: JSON.stringify([body.email]),
        accion: 'REMOVE',
      });
    } catch (err) {
      const msg = `Remove HOT error: ${String(err)}`;
      console.warn('[Meta conversion]', msg);
      errores.push(msg);
    }
  }

  // 3. Agregar a audiencia PAGADOS
  const audiencePagados = process.env.META_AUDIENCE_PAGADOS;
  if (audiencePagados) {
    try {
      await ejecutarToolMeta('meta_update_custom_audience', {
        audience_id: audiencePagados,
        emails: JSON.stringify([body.email]),
        accion: 'ADD',
      });
    } catch (err) {
      const msg = `Add PAGADOS error: ${String(err)}`;
      console.warn('[Meta conversion]', msg);
      errores.push(msg);
    }
  }

  // 4. Registrar evento CRM
  const { error: eventoError } = await supabase.from('crm_eventos').insert({
    lead_id: body.lead_id,
    tipo: 'meta_capi_enviado',
    payload: {
      pago_id: body.pago_id ?? null,
      monto_cop: body.monto_cop,
      errores: errores.length > 0 ? errores : null,
    },
    agente: 'meta_ads',
    canal: 'meta',
  });

  if (eventoError) {
    console.warn('[Meta conversion] No se pudo registrar evento:', eventoError.message);
  }

  return NextResponse.json({ ok: true, errores: errores.length > 0 ? errores : undefined });
}
