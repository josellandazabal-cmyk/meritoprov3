// ============================================================
// GET /api/cron/scout
// Vercel Cron: diario a las 06:00 UTC.
// Busca nuevas convocatorias de concurso en sitios *.gov.co
// y genera fichas de oportunidad con Claude.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buscarWebVerificado } from '@/lib/rag/tavily';
import { llamarAgente, parsearRespuestaJSON } from '@/lib/ia/anthropic';

interface FichaOportunidad {
  nombre: string;
  entidad: string;
  vacantes_estimadas: number | null;
  fuente_url: string;
  fecha_pruebas_estimada: string | null;
  normas_principales: string[];
  score_oportunidad: number;
  recomendacion: 'GO' | 'WATCH' | 'NO-GO';
  justificacion: string;
  revenue_potencial_cop: number;
}

const QUERIES_SCOUT = [
  'convocatoria concurso mérito vacantes site:cnsc.gov.co',
  'concurso publico empleo carrera administrativa site:funcionpublica.gov.co',
  'concurso vacantes empleos site:contraloria.gov.co',
  'concurso ingreso carrera site:ramajudicial.gov.co',
  'convocatoria concurso site:fiscalia.gov.co',
];

const PROMPT_ANALIZAR_OPORTUNIDAD = `Analiza este resultado de búsqueda sobre una convocatoria de concurso del sector público colombiano y genera una evaluación estructurada.

Considera:
- MéritoPro es una plataforma EdTech de preparación para concursos de méritos en Colombia.
- Score alto si: muchas vacantes, entidad grande, proceso claro, competencia alta.
- Recomendación GO si score >= 70, WATCH si 40-69, NO-GO si < 40.
- revenue_potencial_cop = vacantes_estimadas * 309000 * 0.05 (asumiendo 5% de conversión).

Devuelve SOLO el JSON con esta estructura exacta, sin texto adicional:
{
  "nombre": "string",
  "entidad": "string",
  "vacantes_estimadas": number | null,
  "fuente_url": "string",
  "fecha_pruebas_estimada": "YYYY-MM-DD" | null,
  "normas_principales": ["string"],
  "score_oportunidad": number,
  "recomendacion": "GO" | "WATCH" | "NO-GO",
  "justificacion": "string (2 oraciones máximo)",
  "revenue_potencial_cop": number
}`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const añoActual = new Date().getFullYear();

  let oportunidadesInsertadas = 0;
  let alertasEnviadas = 0;
  const errores: string[] = [];

  for (const query of QUERIES_SCOUT) {
    try {
      const hits = await buscarWebVerificado(query);
      if (hits.length === 0) continue;

      for (const hit of hits) {
        // Extraer entidad del URL para deduplicar
        const entidadEstimada = new URL(hit.url).hostname.split('.')[0];
        const claveDedup = `${entidadEstimada}-${añoActual}`;

        // Verificar si ya existe
        const { data: existente } = await supabase
          .from('oportunidades_concurso')
          .select('id')
          .ilike('fuente_url', `%${entidadEstimada}%`)
          .gte('created_at', `${añoActual}-01-01`)
          .maybeSingle();

        if (existente) continue;

        // Analizar con Claude
        const userMessage = `Resultado de búsqueda:\nTítulo: ${hit.title}\nURL: ${hit.url}\nContenido: ${hit.content.slice(0, 1500)}\n\nClave de deduplicación interna: ${claveDedup}`;

        const respuesta = await llamarAgente({
          systemPrompt: PROMPT_ANALIZAR_OPORTUNIDAD,
          userMessage,
          maxTokens: 512,
        });

        const ficha = parsearRespuestaJSON<FichaOportunidad>(respuesta);
        if (!ficha) {
          errores.push(`JSON inválido para hit: ${hit.url}`);
          continue;
        }

        if (ficha.score_oportunidad <= 40) continue;

        // Insertar oportunidad
        const { data: oportunidad, error: insertError } = await supabase
          .from('oportunidades_concurso')
          .insert({
            nombre: ficha.nombre,
            entidad: ficha.entidad,
            fuente_url: ficha.fuente_url || hit.url,
            score_oportunidad: ficha.score_oportunidad,
            recomendacion: ficha.recomendacion,
            estado: 'pendiente',
            ficha_completa_md: JSON.stringify(ficha, null, 2),
          })
          .select('id')
          .single();

        if (insertError) {
          errores.push(`Error insertando oportunidad ${ficha.entidad}: ${insertError.message}`);
          continue;
        }

        oportunidadesInsertadas++;

        // Si score >= 70, alertar a la CEO
        if (ficha.score_oportunidad >= 70 && oportunidad) {
          await supabase.from('agent_mensajes').insert({
            de_agente: 'director-scout',
            para_agente: 'ceo',
            tipo: 'alerta',
            asunto: `Oportunidad GO detectada: ${ficha.entidad} — Score ${ficha.score_oportunidad}`,
            contenido: `${ficha.nombre}\n\nJustificación: ${ficha.justificacion}\n\nURL: ${ficha.fuente_url || hit.url}\n\nRevenue potencial: $${ficha.revenue_potencial_cop.toLocaleString('es-CO')} COP`,
            prioridad: 'alta',
            requiere_aprobacion: false,
            leido: false,
          });
          alertasEnviadas++;
        }
      }
    } catch (err) {
      const msg = `Error procesando query "${query}": ${String(err)}`;
      console.error('[Scout]', msg);
      errores.push(msg);
    }
  }

  console.log(
    `[Scout] Completado — Oportunidades: ${oportunidadesInsertadas}, Alertas: ${alertasEnviadas}, Errores: ${errores.length}`
  );

  return NextResponse.json({
    ok: true,
    oportunidades_insertadas: oportunidadesInsertadas,
    alertas_enviadas: alertasEnviadas,
    errores: errores.length,
  });
}
