// ============================================================
// POST /api/crm/calificar
// Califica el diagnóstico de un lead: scores por módulo, lead score,
// persona_tipo. Se llama justo después de completar el diagnóstico.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { clasificarPersona } from '@/lib/crm/persona-tipo';
import { calcularLeadScore } from '@/lib/crm/lead-score';

const RespuestaSchema = z.object({
  modulo: z.string().min(1),
  es_correcta: z.boolean(),
});

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  respuestas: z.array(RespuestaSchema).min(1),
  concurso_id: z.string().uuid().optional(),
});

type ScoresPorModulo = Record<string, { correctas: number; total: number; porcentaje: number }>;

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

  // 1. Recuperar datos del lead para hiper-personalización
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, nombre, cargo_aspira, utm_source, utm_medium')
    .eq('id', body.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  // 2. Calcular scores por módulo
  const scoresPorModulo: ScoresPorModulo = {};

  for (const r of body.respuestas) {
    if (!scoresPorModulo[r.modulo]) {
      scoresPorModulo[r.modulo] = { correctas: 0, total: 0, porcentaje: 0 };
    }
    scoresPorModulo[r.modulo].total++;
    if (r.es_correcta) scoresPorModulo[r.modulo].correctas++;
  }

  for (const modulo of Object.keys(scoresPorModulo)) {
    const m = scoresPorModulo[modulo];
    m.porcentaje = Math.round((m.correctas / m.total) * 100);
  }

  // 3. Score total ponderado (promedio simple de módulos)
  const modulos = Object.values(scoresPorModulo);
  const scoreTotal =
    modulos.length > 0
      ? Math.round(
          modulos.reduce((acc, m) => acc + m.porcentaje, 0) / modulos.length
        )
      : 0;

  // Módulo más débil
  const moduloDebilEntry = modulos.reduce(
    (min, m) => (m.porcentaje < min.porcentaje ? m : min),
    modulos[0]
  );
  const scoreModuloDebil = moduloDebilEntry?.porcentaje ?? 100;

  // 4. Clasificar persona_tipo
  const personaTipo = clasificarPersona({
    cargo_aspira: lead.cargo_aspira ?? '',
    utm_source: lead.utm_source ?? undefined,
    utm_medium: lead.utm_medium ?? undefined,
    diagnostico_score_total: scoreTotal,
  });

  // 5. Calcular lead score
  const leadScore = calcularLeadScore({
    completoDiagnostico: true,
    abrioPrimerEmail: false,
    visitoPaywall: false,
    scoreModuloDebil,
    respondioTelegram: false,
    diasSinAbrirEmail: 0,
    utm_source: lead.utm_source ?? undefined,
  });

  // 6. Actualizar lead
  const diagnosticoScore = {
    total: scoreTotal,
    modulos: scoresPorModulo,
    generado_at: new Date().toISOString(),
  };

  const updatePayload: Record<string, unknown> = {
    etapa_crm: 'DIAGNOSTICADO',
    diagnostico_score: diagnosticoScore,
    lead_score: leadScore,
    persona_tipo: personaTipo,
    updated_at: new Date().toISOString(),
  };
  if (body.concurso_id) updatePayload.concurso_id = body.concurso_id;

  const { error: updateError } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', body.lead_id);

  if (updateError) {
    console.error('[CRM calificar] Error actualizando lead:', updateError.message);
    return NextResponse.json(
      { error: 'Error actualizando lead', details: updateError.message },
      { status: 500 }
    );
  }

  // 7. Registrar evento CRM
  const { error: eventoError } = await supabase.from('crm_eventos').insert({
    lead_id: body.lead_id,
    tipo: 'diagnostico_completado',
    payload: {
      score_total: scoreTotal,
      persona_tipo: personaTipo,
      lead_score: leadScore,
      scores_por_modulo: scoresPorModulo,
    },
    agente: 'calificador',
    canal: 'web',
  });

  if (eventoError) {
    console.warn('[CRM calificar] No se pudo registrar evento:', eventoError.message);
  }

  return NextResponse.json({
    leadScore,
    scoreTotal,
    scoresPorModulo,
    personaTipo,
  });
}
