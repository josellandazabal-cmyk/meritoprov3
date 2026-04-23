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

// 0.55 en vez de 0.72: Voyage voyage-3-large con input_type='query' vs
// input_type='document' produce similitudes coseno ~0.50-0.70 en el top-1
// para consultas legales en español. Con 0.72 el RPC devuelve 0 filas
// aunque el corpus tenga 3000+ chunks. Verificado con diag-rag.ts (2026-04).
const UMBRAL_SIMILITUD = 0.55;
const TOP_K_DEFAULT = 6;

/**
 * Genera embedding de la consulta con `voyage-3-large` (Voyage AI, ecosistema
 * Anthropic). Dimensiones: 1024. Multilingual, óptimo para corpus legal en español.
 *
 * Si no hay VOYAGE_API_KEY, devuelve null — el orquestador debe caer al rechazo
 * literal (REGLA 4 de Directivas_Agentes_V4.md).
 *
 * Usamos `input_type: 'query'` porque esta función sirve CONSULTAS. La ingesta
 * de documentos (scripts/ingesta/) debe usar `input_type: 'document'`.
 */
async function generarEmbedding(query: string): Promise<number[] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || apiKey.startsWith('pa-tu-') || apiKey.startsWith('tu-')) {
    console.warn('[RAG] VOYAGE_API_KEY no configurada.');
    return null;
  }

  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: query,
        input_type: 'query',
      }),
    });
    if (!res.ok) {
      console.error('[Embeddings] Voyage HTTP', res.status);
      return null;
    }
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? null;
  } catch (error) {
    console.error('[Embeddings] Voyage error:', error);
    return null;
  }
}

/**
 * Busca en el corpus legal. Devuelve chunks con similitud coseno ≥ UMBRAL_SIMILITUD,
 * ordenados por relevancia. topK defaults to 6; batch generation passes 20 for diversity.
 */
export async function buscarCorpusLegal(
  query: string,
  topK: number = TOP_K_DEFAULT,
): Promise<CorpusChunk[]> {
  const vector = await generarEmbedding(query);
  if (!vector) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('match_corpus_legal', {
      query_embedding: vector,
      match_threshold: UMBRAL_SIMILITUD,
      match_count: topK,
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
