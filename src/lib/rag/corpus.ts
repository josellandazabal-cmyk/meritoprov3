// ============================================================
// MéritoPro V4 — Consulta al corpus legal (pgvector)
// Fuente primaria: /Documentacion conocimiento base/
// Tabla: public.corpus_legal  · Función: match_corpus_legal
// Ver Directivas_Agentes_V4.md §1 y §2.
// ============================================================

import { createClient } from '@/lib/supabase/server';

export interface CorpusChunk {
  documento: string;
  norma: string;
  articulo: string | null;
  numeral: string | null;
  contenido: string;
  similitud: number;
}

const UMBRAL_SIMILITUD = 0.72;
const TOP_K = 6;

/**
 * Genera embedding de la consulta con text-embedding-3-small (OpenAI).
 * Si no hay OPENAI_API_KEY, devuelve null — el orquestador debe caer al rechazo literal.
 */
async function generarEmbedding(query: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-tu-')) {
    console.warn('[RAG] OPENAI_API_KEY no configurada.');
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });
    if (!res.ok) {
      console.error('[Embeddings] HTTP', res.status);
      return null;
    }
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? null;
  } catch (error) {
    console.error('[Embeddings] Error:', error);
    return null;
  }
}

/**
 * Busca en el corpus legal. Devuelve chunks con similitud coseno ≥ 0.72,
 * ordenados por relevancia, top 6.
 */
export async function buscarCorpusLegal(query: string): Promise<CorpusChunk[]> {
  const vector = await generarEmbedding(query);
  if (!vector) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('match_corpus_legal', {
      query_embedding: vector,
      match_threshold: UMBRAL_SIMILITUD,
      match_count: TOP_K,
    });

    if (error) {
      console.error('[RAG] Supabase error:', error.message);
      return [];
    }
    return (data ?? []) as CorpusChunk[];
  } catch (error) {
    console.error('[RAG] Unexpected:', error);
    return [];
  }
}

/**
 * Formatea los chunks para inyección como segundo bloque del system prompt
 * (cacheable si el conjunto de chunks supera ~1024 tokens y se repite entre turnos).
 */
export function formatearChunksParaContexto(chunks: CorpusChunk[]): string {
  if (chunks.length === 0) return '';
  const lineas = chunks.map((c, i) => {
    const cita = [c.norma, c.articulo, c.numeral].filter(Boolean).join(', ');
    return `[chunk_${i + 1}] (similitud ${c.similitud.toFixed(2)})
Documento: ${c.documento}
Norma citable: ${cita}
Contenido: ${c.contenido}
---`;
  });
  return `FRAGMENTOS DEL CORPUS LEGAL AUTORIZADO (única fuente permitida):

${lineas.join('\n')}`;
}

/**
 * Construye la cita en el formato exacto del §2 Regla 3 de Directivas V4:
 *   [Norma], Art. [N], [Numeral si aplica]
 */
export function construirCitaCanonica(chunk: CorpusChunk): string {
  const partes = [chunk.norma];
  if (chunk.articulo) partes.push(chunk.articulo);
  if (chunk.numeral) partes.push(chunk.numeral);
  return partes.join(', ');
}

export const RECHAZO_LITERAL =
  'No se encuentra jurisprudencia o norma verificada para esta consulta. No puedo especular.';
