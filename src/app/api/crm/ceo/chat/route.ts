// ============================================================
// POST /api/crm/ceo/chat
// Chat Chairman ↔ CEO (Directora Ana) en Oficina Central.
// Claude Opus lee métricas recientes y mensajes de directores.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAnthropicClient } from '@/lib/ia/anthropic';

const BodySchema = z.object({
  mensaje: z.string().min(1).max(2000),
  contexto: z.string().optional(),
});

const SYSTEM_PROMPT_CEO = `Eres Ana, CEO de MéritoPro. Respondes directamente al Chairman Jose Luis Landazabal.

Tu rol: interpretar las métricas del negocio, los reportes de tus directores y las oportunidades detectadas para dar respuestas ejecutivas, directas y accionables.

REGLAS:
- Tono ejecutivo. Sin adornos. Sin frases de relleno.
- Máximo 250 palabras por respuesta de chat.
- Si algo es urgente, dilo explícitamente con "ALERTA:".
- Si necesitas más datos para decidir, pídelos con precisión.
- Nunca inventes métricas. Si no tienes el dato, dilo.
- Cita los datos recientes del contexto si están disponibles.

No eres un chatbot genérico. Eres la CEO de una startup EdTech en crecimiento con un concurso público de alto impacto en puerta.`;

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

  // Leer mensajes recientes de los directores (últimas 24h)
  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: mensajesDirectores } = await supabase
    .from('agent_mensajes')
    .select('de_agente, tipo, asunto, contenido, created_at')
    .in('de_agente', ['director-growth', 'director-analyst', 'director-cliente', 'director-scout'])
    .gte('created_at', hace24h)
    .order('created_at', { ascending: false })
    .limit(10);

  // Leer métricas del CRM si la vista existe
  const { data: metricas } = await supabase
    .from('vista_crm_metricas')
    .select('*')
    .limit(1)
    .maybeSingle();

  // Construir contexto
  const contextoParts: string[] = [];

  if (metricas) {
    contextoParts.push(`MÉTRICAS ACTUALES:\n${JSON.stringify(metricas, null, 2)}`);
  }

  if (mensajesDirectores && mensajesDirectores.length > 0) {
    const resumen = mensajesDirectores
      .map(
        (m) =>
          `[${m.de_agente}] ${m.asunto ?? m.tipo}: ${String(m.contenido).slice(0, 200)}`
      )
      .join('\n');
    contextoParts.push(`REPORTES DIRECTORES (últimas 24h):\n${resumen}`);
  }

  if (body.contexto) {
    contextoParts.push(`CONTEXTO ADICIONAL:\n${body.contexto}`);
  }

  const contextoStr = contextoParts.join('\n\n---\n\n');

  // Registrar mensaje del Chairman
  const { error: insertChairmanError } = await supabase.from('agent_mensajes').insert({
    de_agente: 'chairman',
    para_agente: 'ceo',
    tipo: 'solicitud',
    asunto: `Chat: ${body.mensaje.slice(0, 80)}`,
    contenido: body.mensaje,
    prioridad: 'normal',
    requiere_aprobacion: false,
    leido: false,
  });

  if (insertChairmanError) {
    console.warn('[CEO chat] No se pudo guardar mensaje chairman:', insertChairmanError.message);
  }

  // Llamar a Claude Opus
  let respuesta: string;
  let tokensUsados = 0;

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT_CEO,
      messages: [
        {
          role: 'user',
          content: contextoStr
            ? `CONTEXTO:\n${contextoStr}\n\n---\n\nMENSAJE DEL CHAIRMAN:\n${body.mensaje}`
            : body.mensaje,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    respuesta = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    tokensUsados =
      (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
  } catch (err) {
    console.error('[CEO chat] Error llamando Claude Opus:', err);
    return NextResponse.json(
      { error: 'Error generando respuesta CEO' },
      { status: 500 }
    );
  }

  // Guardar respuesta de la CEO
  const { error: insertRespError } = await supabase.from('agent_mensajes').insert({
    de_agente: 'ceo',
    para_agente: 'chairman',
    tipo: 'respuesta',
    asunto: `Respuesta: ${body.mensaje.slice(0, 80)}`,
    contenido: respuesta,
    prioridad: 'normal',
    requiere_aprobacion: false,
    leido: false,
  });

  if (insertRespError) {
    console.warn('[CEO chat] No se pudo guardar respuesta CEO:', insertRespError.message);
  }

  return NextResponse.json({ respuesta, tokens_usados: tokensUsados });
}
