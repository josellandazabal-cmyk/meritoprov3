'use server';

import { createClient } from '@/lib/supabase/server';
import { buscarCorpusLegal } from '@/lib/rag/corpus';

// ============================================================
// Server action — Respuestas rápidas a las brechas del aspirante
//
// Para cada tema en `progreso_sm2.brechas` (top-N), trae el chunk del
// corpus legal con mayor similitud y lo devuelve como una "tarjeta de
// repaso" — el aspirante lee el contenido + cita normativa de un
// vistazo, sin necesidad de abrir una sesión completa.
//
// Si el usuario no tiene brechas detectadas, devuelve [] y el componente
// no se renderiza (no inventamos contenido sin base SM-2).
// ============================================================

export interface RespuestaRapida {
  tema: string;
  documento: string;
  norma: string;
  articulo: string | null;
  numeral: string | null;
  contenido: string;
  similitud: number;
}

const MAX_TARJETAS = 5;
const PREVIEW_CHARS = 320;

export async function obtenerRespuestasRapidas(): Promise<RespuestaRapida[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return [];

    // 1. Identificar brechas: temas con e_factor bajo o pocas repeticiones.
    const { data: sm2 } = await supabase
      .from('sm2_repetition')
      .select('tema_relacionado, e_factor, repetition_count, updated_at')
      .eq('user_id', user.id)
      .order('e_factor', { ascending: true })
      .limit(20);

    if (!sm2 || sm2.length === 0) return [];

    // 2. Filtrar y dedup por tema.
    const brechas: string[] = [];
    const vistos = new Set<string>();
    for (const row of sm2 as Array<{
      tema_relacionado: string | null;
      e_factor: number;
      repetition_count: number;
    }>) {
      if (!row.tema_relacionado) continue;
      const esBrecha = row.e_factor < 1.8 || row.repetition_count < 2;
      if (!esBrecha) continue;
      const tema = row.tema_relacionado.includes('/')
        ? row.tema_relacionado.split('/').slice(1).join('/')
        : row.tema_relacionado;
      const key = tema.toLowerCase().trim();
      if (vistos.has(key)) continue;
      vistos.add(key);
      brechas.push(tema);
      if (brechas.length >= MAX_TARJETAS) break;
    }

    if (brechas.length === 0) return [];

    // 3. Para cada brecha, top-1 chunk del corpus.
    const chunks = await Promise.all(
      brechas.map(async (tema): Promise<RespuestaRapida | null> => {
        try {
          const resultado = await buscarCorpusLegal(tema, 1);
          if (!resultado || resultado.length === 0) return null;
          const chunk = resultado[0];
          const contenido =
            chunk.contenido.length > PREVIEW_CHARS
              ? chunk.contenido.slice(0, PREVIEW_CHARS).trimEnd() + '…'
              : chunk.contenido;
          return {
            tema,
            documento: chunk.documento,
            norma: chunk.norma,
            articulo: chunk.articulo,
            numeral: chunk.numeral,
            contenido,
            similitud: chunk.similitud,
          };
        } catch (e) {
          console.warn('[Respuestas rápidas] RAG falló para', tema, e);
          return null;
        }
      })
    );

    return chunks.filter((c): c is RespuestaRapida => c !== null);
  } catch (error) {
    console.warn('[Respuestas rápidas] Falla general:', error);
    return [];
  }
}
