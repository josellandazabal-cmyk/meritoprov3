// ============================================================
// GET /api/cron/remarketing
// Vercel Cron: diario.
// AGENTE 3 — Persuasor: hot leads (score >= 70) no convertidos.
// Máximo 5 emails persuasivos por lead (configurable).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { llamarAgente, parsearRespuestaJSON } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_PERSUASOR_V4 } from '@/lib/ia/prompts';
import { enviarEmail, generarEmailRemarketing } from '@/lib/omnichannel/resend';
import { getConfigNumber } from '@/lib/crm/config';
import { estadoInscripciones } from '@/lib/concurso/datos-oficiales';

interface RemarketingEmailContent {
  asunto: string;
  body: string;
}

interface LeadHot {
  id: string;
  nombre: string;
  email: string;
  cargo_aspira: string;
  lead_score: number;
  persona_tipo: 'carolina' | 'andres' | 'gloria' | null;
  diagnostico_score: { total?: number; modulos?: Record<string, { porcentaje: number }> } | null;
  ultimo_email_enviado_at: string | null;
}

function anguloPersona(personaTipo: LeadHot['persona_tipo']): string {
  switch (personaTipo) {
    case 'andres':
      return 'rigor académico, corpus verificado, velocidad de preparación, sin teoría innecesaria';
    case 'gloria':
      return 'estabilidad permanente, carrera garantizada, método eficiente sin teoría innecesaria';
    case 'carolina':
    default:
      return 'método que elimina los PDFs, sin estudio eterno, énfasis en ROI salarial y aversión a la pérdida';
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Leer máximo de emails persuasor desde configuración
  let emailsPersuasorMax = 5;
  try {
    emailsPersuasorMax = await getConfigNumber('emails_persuasor_max');
  } catch {
    // fallback al valor por defecto
  }

  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // Hot leads: score >= 70, no pagados, sin email en las últimas 24h
  const { data: leads, error: dbError } = await supabase
    .from('leads')
    .select(
      'id, nombre, email, cargo_aspira, lead_score, persona_tipo, diagnostico_score, ultimo_email_enviado_at'
    )
    .in('etapa_crm', ['DIAGNOSTICADO', 'PAYWALL_VISTO'])
    .gte('lead_score', 70)
    .is('pago_completado_at', null)
    .or(`ultimo_email_enviado_at.is.null,ultimo_email_enviado_at.lt.${hace24h}`)
    .limit(50);

  if (dbError) {
    console.error('[Remarketing] DB error:', dbError.message);
    return NextResponse.json({ error: 'DB error', details: dbError.message }, { status: 500 });
  }

  let enviados = 0;
  let omitidos = 0;
  const errores: string[] = [];

  for (const rawLead of leads ?? []) {
    const lead = rawLead as LeadHot;

    try {
      // Contar emails persuasor anteriores
      const { count: emailsAnteriores } = await supabase
        .from('crm_eventos')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('agente', 'persuasor');

      if ((emailsAnteriores ?? 0) >= emailsPersuasorMax) {
        omitidos++;
        continue;
      }

      const urgencia = estadoInscripciones();
      const angulo = anguloPersona(lead.persona_tipo);
      const scoreTotal = lead.diagnostico_score?.total ?? 0;

      const userMessage = `Genera un email de remarketing persuasivo para:
- Nombre: ${lead.nombre}
- Cargo aspirado: ${lead.cargo_aspira}
- Persona tipo: ${lead.persona_tipo ?? 'carolina'}
- Ángulo de comunicación: ${angulo}
- Score diagnóstico: ${scoreTotal}%
- Lead score (interés): ${lead.lead_score}/100
- Estado concurso PGN 2026: ${urgencia.mensajeLargo}

El email debe atacar la aversión a la pérdida y personalizar el ángulo indicado.
JSON: {"asunto": "...", "body": "..."} — máximo 120 palabras en body.`;

      const respuesta = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_PERSUASOR_V4,
        userMessage,
        maxTokens: 512,
      });

      const emailContent = parsearRespuestaJSON<RemarketingEmailContent>(respuesta);
      if (!emailContent?.asunto || !emailContent.body) {
        errores.push(`JSON inválido para lead ${lead.id}`);
        continue;
      }

      const html = generarEmailRemarketing(lead.nombre, emailContent.asunto, emailContent.body);

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

        await supabase.from('crm_eventos').insert({
          lead_id: lead.id,
          tipo: 'email_remarketing_enviado',
          payload: {
            asunto: emailContent.asunto,
            persona_tipo: lead.persona_tipo,
            angulo: angulo,
          },
          agente: 'persuasor',
          canal: 'email',
        });
      } else {
        errores.push(`Email falló para lead ${lead.id}`);
      }
    } catch (err) {
      const msg = `Error lead ${lead.id}: ${String(err)}`;
      console.error('[Remarketing]', msg);
      errores.push(msg);
    }
  }

  console.log(
    `[Remarketing] Procesados: ${(leads ?? []).length}, Enviados: ${enviados}, Omitidos: ${omitidos}, Errores: ${errores.length}`
  );

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    procesados: (leads ?? []).length,
    enviados,
    omitidos_por_limite: omitidos,
    errores: errores.length,
  });
}
