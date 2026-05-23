// ============================================================
// GET /api/cron/meta-sync-audiencias
// Vercel Cron: diario a las 07:00 UTC.
// Sincroniza leads de Supabase con audiencias personalizadas de Meta Ads.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ejecutarToolMeta } from '@/lib/meta/mcp-server';

interface AudienciaConfig {
  nombre: string;
  envVar: string;
  filtro: Record<string, unknown>;
}

const AUDIENCIAS: AudienciaConfig[] = [
  {
    nombre: 'HOT',
    envVar: 'META_AUDIENCE_HOT',
    filtro: { etapa_crm: 'DIAGNOSTICADO', lead_score_min: 70, no_pagados: true },
  },
  {
    nombre: 'WARM',
    envVar: 'META_AUDIENCE_WARM',
    filtro: { etapa_crm: 'DIAGNOSTICADO', lead_score_min: 40, lead_score_max: 69 },
  },
  {
    nombre: 'LEADS_NUEVOS',
    envVar: 'META_AUDIENCE_LEADS_NUEVOS',
    filtro: { etapa_crm: 'LEAD_NUEVO' },
  },
  {
    nombre: 'PAGADOS',
    envVar: 'META_AUDIENCE_PAGADOS',
    filtro: { etapa_crm: 'PAGO_COMPLETADO' },
  },
  {
    nombre: 'CHURNED',
    envVar: 'META_AUDIENCE_CHURNED',
    filtro: { etapa_crm: 'CHURNED' },
  },
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resultados: Record<string, { emails: number; ok: boolean; error?: string }> = {};

  for (const audiencia of AUDIENCIAS) {
    const audienceId = process.env[audiencia.envVar];
    if (!audienceId) {
      resultados[audiencia.nombre] = {
        emails: 0,
        ok: false,
        error: `Env var ${audiencia.envVar} no configurada`,
      };
      continue;
    }

    try {
      // Construir query según filtro
      let query = supabase.from('leads').select('email').not('email', 'is', null);

      const f = audiencia.filtro;

      if (f.etapa_crm) {
        query = query.eq('etapa_crm', f.etapa_crm as string);
      }
      if (f.lead_score_min !== undefined) {
        query = query.gte('lead_score', f.lead_score_min as number);
      }
      if (f.lead_score_max !== undefined) {
        query = query.lte('lead_score', f.lead_score_max as number);
      }
      if (f.no_pagados) {
        query = query.is('pago_completado_at', null);
      }

      const { data: leadsData, error: queryError } = await query.limit(500);

      if (queryError) {
        resultados[audiencia.nombre] = {
          emails: 0,
          ok: false,
          error: queryError.message,
        };
        continue;
      }

      const emails = (leadsData ?? []).map((l: { email: string }) => l.email).filter(Boolean);

      if (emails.length === 0) {
        resultados[audiencia.nombre] = { emails: 0, ok: true };
        continue;
      }

      await ejecutarToolMeta('meta_update_custom_audience', {
        audience_id: audienceId,
        emails: JSON.stringify(emails),
        accion: 'ADD',
      });

      resultados[audiencia.nombre] = { emails: emails.length, ok: true };

      // Log en agent_mensajes (crm_eventos requiere lead_id NOT NULL)
      await supabase.from('agent_mensajes').insert({
        de_agente: 'meta_ads',
        para_agente: 'director-growth',
        tipo: 'reporte_diario',
        asunto: `Audiencia ${audiencia.nombre} sincronizada`,
        contenido: `${emails.length} emails enviados a Meta Custom Audience ${audienceId}`,
        prioridad: 'baja',
        requiere_aprobacion: false,
        leido: false,
      });
    } catch (err) {
      resultados[audiencia.nombre] = {
        emails: 0,
        ok: false,
        error: String(err),
      };
    }
  }

  // Notificar a director-growth con resumen
  const resumen = Object.entries(resultados)
    .map(([nombre, r]) => `- ${nombre}: ${r.ok ? `${r.emails} emails` : `ERROR — ${r.error}`}`)
    .join('\n');

  await supabase.from('agent_mensajes').insert({
    de_agente: 'meta_ads',
    para_agente: 'director-growth',
    tipo: 'reporte_diario',
    asunto: `Sync audiencias Meta — ${new Date().toLocaleDateString('es-CO')}`,
    contenido: `Sincronización completada:\n${resumen}`,
    prioridad: 'normal',
    requiere_aprobacion: false,
    leido: false,
  });

  console.log('[Meta sync audiencias] Completado:', resumen);

  return NextResponse.json({ ok: true, resultados });
}
