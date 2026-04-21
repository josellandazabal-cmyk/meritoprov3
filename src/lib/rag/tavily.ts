// ============================================================
// MéritoPro V4 — Fallback Tavily (web search verificada)
// Restringido a whitelist de dominios gubernamentales colombianos.
// Ver Directivas_Agentes_V4.md §3.
//
// Usa el SDK oficial @tavily/core. Se activa SOLO cuando la consulta
// al corpus local (pgvector) devuelve 0 chunks.
// ============================================================

import { tavily } from '@tavily/core';

// Whitelist canónica (alineada con CLAUDE.md y fullstack-nextjs-supabase).
const WHITELIST_GOV_CO = [
  'gov.co',
  'funcionpublica.gov.co',
  'procuraduria.gov.co',
  'suin-juriscol.gov.co',
  'corteconstitucional.gov.co',
  'ramajudicial.gov.co',
  'secretariasenado.gov.co',
];

export interface TavilyHit {
  title: string;
  url: string;
  content: string;
  score: number;
}

let client: ReturnType<typeof tavily> | null = null;

function getTavilyClient(): ReturnType<typeof tavily> | null {
  if (client) return client;
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.startsWith('tvly-tu-')) {
    console.warn('[Tavily] TAVILY_API_KEY no configurada — fallback deshabilitado.');
    return null;
  }
  client = tavily({ apiKey });
  return client;
}

/**
 * Busca online restringido a *.gov.co. Devuelve arreglo vacío si no hay API key
 * o si la respuesta falla — el llamador debe interpretar eso como "rechazo literal".
 */
export async function buscarWebVerificado(query: string): Promise<TavilyHit[]> {
  const tavilyClient = getTavilyClient();
  if (!tavilyClient) return [];

  try {
    const response = await tavilyClient.search(query, {
      searchDepth: 'advanced',
      includeDomains: WHITELIST_GOV_CO,
      includeAnswer: false,
      maxResults: 5,
    });

    const resultados = (response.results ?? []) as Array<{
      title?: string;
      url?: string;
      content?: string;
      score?: number;
    }>;

    // Defensa extra: filtrar por si Tavily devuelve algo fuera de la whitelist.
    return resultados
      .filter((r) => r.url && WHITELIST_GOV_CO.some((d) => r.url!.includes(d)))
      .map((r) => ({
        title: r.title ?? '',
        url: r.url!,
        content: r.content ?? '',
        score: r.score ?? 0,
      }));
  } catch (error) {
    console.error('[Tavily] Error:', error);
    return [];
  }
}

/**
 * Convierte los hits de Tavily en un bloque de contexto legible para inyección
 * como segundo bloque del system prompt.
 */
export function formatearTavilyParaContexto(hits: TavilyHit[]): string {
  if (hits.length === 0) return '';
  const lineas = hits.map(
    (h, i) => `[fuente_web_${i + 1}]
URL: ${h.url}
Título: ${h.title}
Extracto: ${h.content}
---`
  );
  return `FUENTES WEB VERIFICADAS (solo *.gov.co):\n\n${lineas.join('\n')}`;
}
