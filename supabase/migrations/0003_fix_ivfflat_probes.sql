-- ============================================================
-- MéritoPro V4 · Migración 0003 — Fix IVFFlat probes en match_corpus_legal
--
-- Problema: IVFFlat con lists=100 + probes=1 (default de sesión) sólo escanea
-- el 1% del índice por consulta. Con 7131+ filas, las normas ingresadas después
-- de la creación del índice quedan en clusters sub-representados y el RPC
-- devuelve 0 resultados incluso con match_threshold=0.
--
-- Solución: cambiar match_corpus_legal a plpgsql para poder hacer SET LOCAL
-- ivfflat.probes = 20 antes del query (escanea 20 clusters → ~20% del índice,
-- suficiente recall para corpora legales en español ≤100K filas).
--
-- Alternativa a largo plazo: migrar a índice HNSW (mejor recall, sin parámetro
-- probes). Pendiente en migration 0004 cuando el corpus supere 50K filas.
--
-- Idempotente. Ejecutar en Supabase SQL Editor o via CLI.
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_corpus_legal(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.45,
  match_count     int   DEFAULT 6
)
RETURNS TABLE (
  documento text,
  norma     text,
  articulo  text,
  numeral   text,
  contenido text,
  similitud float
)
-- VOLATILE (default) en lugar de STABLE: el SET LOCAL modifica estado de
-- sesión (GUC ivfflat.probes), y PostgreSQL prohíbe SET en funciones
-- STABLE/IMMUTABLE. La pérdida de optimización de plan es despreciable
-- comparada con el beneficio de tener el recall correcto.
LANGUAGE plpgsql VOLATILE AS $$
BEGIN
  -- Scan 20 of 100 IVFFlat lists per query (default=1 misses 99% of corpus).
  SET LOCAL ivfflat.probes = 20;

  RETURN QUERY
    SELECT
      cl.documento,
      cl.norma,
      cl.articulo,
      cl.numeral,
      cl.contenido,
      (1 - (cl.embedding <=> query_embedding))::float AS similitud
    FROM public.corpus_legal cl
    WHERE 1 - (cl.embedding <=> query_embedding) >= match_threshold
    ORDER BY cl.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Mantener permisos
GRANT EXECUTE ON FUNCTION public.match_corpus_legal(vector, float, int) TO anon, authenticated;

-- ============================================================
-- Verificación rápida:
--   SELECT * FROM match_corpus_legal(
--     (SELECT embedding FROM corpus_legal LIMIT 1),
--     0.45, 6
--   );
--   → debe devolver ≥1 fila con similitud ≥ 0.45
-- ============================================================
