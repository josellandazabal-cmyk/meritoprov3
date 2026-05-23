// ============================================================
// GET /api/cron/nutricion
// Vercel Cron: diario a las 12:00 UTC (07:00 COL).
// Envía emails educativos a leads en fase de nutrición (score 20-69).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { llamarAgente, parsearRespuestaJSON } from '@/lib/ia/anthropic';
import { enviarEmail, generarEmailRemarketing } from '@/lib/omnichannel/resend';
import { emailDelDia, TipoEmail } from '@/lib/crm/email-secuencias';

interface NutricionEmailContent {
  asunto: string;
  preheader: string;
  body_html: string;
}

interface LeadNutricion {
  id: string;
  nombre: string;
  email: string;
  cargo_aspira: string;
  lead_score: number;
  diagnostico_score: {
    total?: number;
    modulos?: Record<string, { porcentaje: number }>;
  } | null;
  etapa_crm: string;
  ultimo_email_enviado_at: string | null;
  created_at: string;
}

const SYSTEM_PROMPT_NUTRITOR = `Eres el Nutritor educativo de MéritoPro. Tono: tutor universitario experto, sin jerga de ventas.
REGLA ANTI-ALUCINACIÓN: Solo cita normativa si está explícita en el contexto. Nunca inventes normas.
LENGUAJE PROHIBIDO: "quiz", "juego", "puntos". Usa "evaluación", "diagnóstico", "nivel de dominio".
Responde SOLO con el JSON indicado, sin texto adicional.`;

function obtenerModuloDebil(
  diagnosticoScore: LeadNutricion['diagnostico_score']
): string {
  if (!diagnosticoScore?.modulos) return 'derecho disciplinario';
  const entries = Object.entries(diagnosticoScore.modulos);
  if (entries.length === 0) return 'derecho disciplinario';
  const minEntry = entries.reduce((min, curr) =>
    curr[1].porcentaje < min[1].porcentaje ? curr : min
  );
  return minEntry[0];
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hace48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  // Leads en fase nutrición: score 20-69, diagnósticados, sin email reciente
  const { data: leads, error: dbError } = await supabase
    .from('leads')
    .select(
      'id, nombre, email, cargo_aspira, lead_score, diagnostico_score, etapa_crm, ultimo_email_enviado_at, created_at'
    )
    .eq('etapa_crm', 'DIAGNOSTICADO')
    .gte('lead_score', 20)
    .lte('lead_score', 69)
    .or(`ultimo_email_enviado_at.is.null,ultimo_email_enviado_at.lt.${hace48h}`)
    .limit(100);

  if (dbError) {
    console.error('[Nutricion] DB error:', dbError.message);
    return NextResponse.json({ error: 'DB error', details: dbError.message }, { status: 500 });
  }

  let enviados = 0;
  const errores: string[] = [];

  for (const rawLead of leads ?? []) {
    const lead = rawLead as LeadNutricion;

    try {
      // Calcular días desde el diagnóstico (desde created_at como proxy)
      const diasDesdeDiagnostico = Math.floor(
        (Date.now() - new Date(lead.created_at).getTime()) / (24 * 3600 * 1000)
      );

      const tipoEmail: TipoEmail | null = emailDelDia(diasDesdeDiagnostico, lead.lead_score);
      if (!tipoEmail) continue;

      const moduloDebil = obtenerModuloDebil(lead.diagnostico_score);
      const scoreTotal = lead.diagnostico_score?.total ?? 0;

      const userMessage = `Lead: ${lead.nombre}, cargo: ${lead.cargo_aspira}, score diagnóstico: ${scoreTotal}%, módulo débil: ${moduloDebil}.
Genera email tipo "${tipoEmail}". Máximo 200 palabras en el body.
JSON: {"asunto": "...", "preheader": "...", "body_html": "..."}`;

      const respuesta = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_NUTRITOR,
        userMessage,
        maxTokens: 600,
      });

      const emailContent = parsearRespuestaJSON<NutricionEmailContent>(respuesta);
      if (!emailContent?.asunto || !emailContent.body_html) {
        errores.push(`JSON inválido para lead ${lead.id}`);
        continue;
      }

      const html = generarEmailRemarketing(lead.nombre, emailContent.asunto, emailContent.body_html);

      const ok = await enviarEmail({
        to: lead.email,
        subject: emailContent.asunto,
        html,
      });

      if (ok) {
        enviados++;

        await supabase
          .from('leads')
          .update({
            ultimo_email_enviado_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        // Incrementar contador de emails via RPC
        await supabase.rpc('increment_emails_enviados', { lead_id_param: lead.id });

        await supabase.from('crm_eventos').insert({
          lead_id: lead.id,
          tipo: 'email_nutricion_enviado',
          payload: { tipo_email: tipoEmail, asunto: emailContent.asunto },
          agente: 'nutritor',
          canal: 'email',
        });
      } else {
        errores.push(`Email falló para lead ${lead.id}`);
      }
    } catch (err) {
      const msg = `Error lead ${lead.id}: ${String(err)}`;
      console.error('[Nutricion]', msg);
      errores.push(msg);
    }
  }

  console.log(
    `[Nutricion] Procesados: ${(leads ?? []).length}, Enviados: ${enviados}, Errores: ${errores.length}`
  );

  return NextResponse.json({
    ok: true,
    procesados: (leads ?? []).length,
    enviados,
    errores: errores.length,
  });
}
