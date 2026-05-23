// ============================================================
// GET /api/cron/briefing-ceo
// Vercel Cron: diario a las 08:00 COL (13:00 UTC).
// CEO Ana genera el briefing diario para el Chairman.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAnthropicClient } from '@/lib/ia/anthropic';

const SYSTEM_PROMPT_CEO_BRIEFING = `Eres Ana, CEO de MéritoPro. Recibes los reportes de tus 4 directores y generas el briefing diario para el Chairman Jose Luis Landazabal.

Formato OBLIGATORIO:
## Briefing Diario — [fecha]

**Estado del negocio (vs ayer)**
- Leads: [N] ([cambio %])
- Pagos: [N] | Revenue mes: $[N] COP
- CVR: [N]%

**Alerta prioritaria** (si existe — solo si hay algo urgente)
[texto o "Sin alertas"]

**3 acciones de hoy**
1. [acción concreta]
2. [acción concreta]
3. [acción concreta]

**Oportunidades detectadas** (si las hay)
[texto o "Sin novedades"]

Tono: ejecutivo, directo, sin adornos. Máximo 300 palabras.`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // 1. Leer métricas
  const { data: metricas } = await supabase
    .from('vista_crm_metricas')
    .select('*')
    .limit(1)
    .maybeSingle();

  // 2. Leer mensajes de directores últimas 24h
  const { data: mensajesDirectores } = await supabase
    .from('agent_mensajes')
    .select('de_agente, tipo, asunto, contenido, created_at')
    .in('de_agente', ['director-growth', 'director-analyst', 'director-cliente', 'director-scout'])
    .gte('created_at', hace24h)
    .order('created_at', { ascending: false })
    .limit(20);

  // 3. Oportunidades pendientes con score alto
  const { data: oportunidades } = await supabase
    .from('oportunidades_concurso')
    .select('nombre, entidad, score_oportunidad, recomendacion, created_at')
    .eq('estado', 'pendiente')
    .gte('score_oportunidad', 70)
    .order('score_oportunidad', { ascending: false })
    .limit(5);

  // 4. Construir contexto para la CEO
  const partes: string[] = [`FECHA: ${fechaStr}`];

  if (metricas) {
    partes.push(`MÉTRICAS CRM:\n${JSON.stringify(metricas, null, 2)}`);
  } else {
    partes.push('MÉTRICAS CRM: No disponibles (vista_crm_metricas no existe aún)');
  }

  if (mensajesDirectores && mensajesDirectores.length > 0) {
    const resumen = mensajesDirectores
      .map((m) => `[${m.de_agente} | ${m.tipo}] ${m.asunto ?? ''}: ${String(m.contenido).slice(0, 300)}`)
      .join('\n\n');
    partes.push(`REPORTES DE DIRECTORES:\n${resumen}`);
  } else {
    partes.push('REPORTES DE DIRECTORES: Sin mensajes en las últimas 24h');
  }

  if (oportunidades && oportunidades.length > 0) {
    const resOport = oportunidades
      .map((o) => `- ${o.nombre} (${o.entidad}) — Score: ${o.score_oportunidad} — ${o.recomendacion}`)
      .join('\n');
    partes.push(`OPORTUNIDADES DETECTADAS (score ≥ 70):\n${resOport}`);
  }

  const contexto = partes.join('\n\n---\n\n');

  // 5. Generar briefing con Claude Opus
  let briefingTexto: string;
  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT_CEO_BRIEFING,
      messages: [{ role: 'user', content: contexto }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    briefingTexto = textBlock && textBlock.type === 'text' ? textBlock.text : 'Error generando briefing.';
  } catch (err) {
    console.error('[Briefing CEO] Error Claude Opus:', err);
    return NextResponse.json({ error: 'Error generando briefing' }, { status: 500 });
  }

  // 6. Insertar en agent_mensajes
  const { error: insertError } = await supabase.from('agent_mensajes').insert({
    de_agente: 'ceo',
    para_agente: 'chairman',
    tipo: 'briefing',
    asunto: `Briefing diario ${fechaStr}`,
    contenido: briefingTexto,
    prioridad: 'normal',
    requiere_aprobacion: false,
    leido: false,
  });

  if (insertError) {
    console.error('[Briefing CEO] Error insertando mensajes:', insertError.message);
  }

  console.log(`[Briefing CEO] Generado para ${fechaStr} — ${briefingTexto.length} chars`);

  return NextResponse.json({
    ok: true,
    briefing_preview: briefingTexto.slice(0, 200),
  });
}
