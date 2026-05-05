-- ============================================================
-- Migración 0003 — Resultado del concurso (métrica de éxito interna)
--
-- Permite al usuario reportar si pasó/no pasó el concurso PGN 2026
-- (auto-reporte). Sirve para calcular la tasa de éxito real entre
-- aspirantes que pagaron y entrenaron en la app — métrica north-star
-- a partir de fines de 2026.
--
-- Re-ejecutable: ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- 1. Columna en usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS resultado_concurso TEXT
    CHECK (resultado_concurso IN ('pasa_pruebas', 'no_pasa_pruebas',
                                  'en_lista_elegibles', 'posesionado',
                                  'no_se_inscribio', 'pendiente'));

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS resultado_concurso_fecha TIMESTAMPTZ;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS resultado_concurso_notas TEXT;

COMMENT ON COLUMN public.usuarios.resultado_concurso IS
  'Self-reported. Estados: pasa_pruebas | no_pasa_pruebas | en_lista_elegibles | posesionado | no_se_inscribio | pendiente';

-- 2. Vista para la métrica north-star (solo accesible vía service role)
CREATE OR REPLACE VIEW public.metrica_tasa_exito AS
SELECT
  COUNT(*) FILTER (WHERE resultado_concurso IS NOT NULL
                   AND resultado_concurso != 'pendiente'
                   AND resultado_concurso != 'no_se_inscribio') AS total_reportados,
  COUNT(*) FILTER (WHERE resultado_concurso = 'pasa_pruebas'
                       OR resultado_concurso = 'en_lista_elegibles'
                       OR resultado_concurso = 'posesionado') AS total_aprobados,
  CASE
    WHEN COUNT(*) FILTER (WHERE resultado_concurso IS NOT NULL
                          AND resultado_concurso != 'pendiente'
                          AND resultado_concurso != 'no_se_inscribio') > 0
    THEN ROUND(
      100.0 * COUNT(*) FILTER (WHERE resultado_concurso IN
                              ('pasa_pruebas', 'en_lista_elegibles', 'posesionado'))
            / COUNT(*) FILTER (WHERE resultado_concurso IS NOT NULL
                              AND resultado_concurso != 'pendiente'
                              AND resultado_concurso != 'no_se_inscribio'),
      1
    )
    ELSE 0
  END AS tasa_aprobacion_pct
FROM public.usuarios;

COMMENT ON VIEW public.metrica_tasa_exito IS
  'Métrica north-star: tasa de aprobación entre aspirantes que se inscribieron y reportaron resultado. Solo lectura via service role en /dashboard/admin.';
