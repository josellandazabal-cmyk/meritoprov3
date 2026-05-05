-- ============================================================
-- Migración 0004 — Tablas de pagos (Wompi)
--
-- Crea las dos tablas que la integración con Wompi ya espera:
--   · intenciones_pago — log de cada checkout iniciado.
--   · codigos_garantia — códigos de descuento canjeables (50% off).
--
-- También agrega columna `convertido` a `leads` para marcar leads que
-- llegaron al pago aprobado (usado por el webhook /api/webhooks/wompi).
--
-- Re-ejecutable: CREATE TABLE IF NOT EXISTS + ALTER ... ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- ===========================================================
-- 1. INTENCIONES DE PAGO — log de cada checkout iniciado
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.intenciones_pago (
  reference TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  monto_cop INTEGER NOT NULL CHECK (monto_cop > 0),
  curso_slug TEXT NOT NULL DEFAULT 'pgn-2026',
  codigo_descuento TEXT,
  estado TEXT NOT NULL DEFAULT 'iniciada'
    CHECK (estado IN ('iniciada', 'aprobada', 'rechazada', 'expirada')),
  -- Datos del webhook al aprobarse:
  wompi_tx_id TEXT,
  payment_method TEXT,
  aprobada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intenciones_user ON public.intenciones_pago(user_id);
CREATE INDEX IF NOT EXISTS idx_intenciones_lead ON public.intenciones_pago(lead_id);
CREATE INDEX IF NOT EXISTS idx_intenciones_estado ON public.intenciones_pago(estado);

ALTER TABLE public.intenciones_pago ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede leer su propia intención (post-checkout view).
DROP POLICY IF EXISTS "Usuario lee sus propias intenciones" ON public.intenciones_pago;
CREATE POLICY "Usuario lee sus propias intenciones"
  ON public.intenciones_pago
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE solo via service role (webhook + checkout server-side).
-- NO creamos policies para insert/update — bloqueado por RLS por defecto.

COMMENT ON TABLE public.intenciones_pago IS
  'Log de cada checkout iniciado en /api/checkout/iniciar. Estado se actualiza por el webhook /api/webhooks/wompi. RLS: solo lectura por dueño; INSERT/UPDATE solo via service role.';

-- ===========================================================
-- 2. CÓDIGOS DE GARANTÍA — descuentos canjeables 50% off
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.codigos_garantia (
  codigo TEXT PRIMARY KEY,
  -- A quién se le entregó (puede ser un lead pre-pago o un usuario).
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  -- Curso para el que aplica (típicamente 'pgn-2026').
  curso_aplicable TEXT NOT NULL DEFAULT 'pgn-2026',
  -- Vigencia
  expira_at TIMESTAMPTZ NOT NULL,
  -- Quemado / canje
  usado_at TIMESTAMPTZ,
  curso_canjeado TEXT,
  -- Metadatos
  motivo TEXT, -- ej: 'garantia-7-dias', 'lead-decision-pendiente', 'remarketing-sem-3'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_codigos_user ON public.codigos_garantia(user_id);
CREATE INDEX IF NOT EXISTS idx_codigos_lead ON public.codigos_garantia(lead_id);
CREATE INDEX IF NOT EXISTS idx_codigos_expira ON public.codigos_garantia(expira_at);

ALTER TABLE public.codigos_garantia ENABLE ROW LEVEL SECURITY;

-- Lectura: el dueño puede ver sus códigos.
DROP POLICY IF EXISTS "Usuario lee sus codigos de garantia" ON public.codigos_garantia;
CREATE POLICY "Usuario lee sus codigos de garantia"
  ON public.codigos_garantia
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Lectura anónima por código (necesario para validar en /api/checkout/iniciar
-- antes de crear el usuario). Limitada al campo del propio código consultado.
DROP POLICY IF EXISTS "Validacion anonima de codigo" ON public.codigos_garantia;
CREATE POLICY "Validacion anonima de codigo"
  ON public.codigos_garantia
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE solo via service role.

COMMENT ON TABLE public.codigos_garantia IS
  'Códigos de descuento 50% off canjeables. Generados manualmente o por el webhook de Wompi (ej. extender garantía si la PGN suspende el concurso).';

-- ===========================================================
-- 3. LEADS — columna convertido (usada por el webhook)
-- ===========================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS convertido BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_convertido ON public.leads(convertido);

COMMENT ON COLUMN public.leads.convertido IS
  'true cuando el lead pagó vía Wompi. Marcado por el webhook /api/webhooks/wompi.';

-- ===========================================================
-- 4. VISTA: tasa de conversión (métrica interna)
-- ===========================================================
CREATE OR REPLACE VIEW public.metrica_conversion_pago AS
SELECT
  COUNT(*) FILTER (WHERE estado = 'iniciada') AS checkouts_iniciados,
  COUNT(*) FILTER (WHERE estado = 'aprobada') AS pagos_aprobados,
  COUNT(*) FILTER (WHERE estado = 'rechazada') AS pagos_rechazados,
  CASE
    WHEN COUNT(*) FILTER (WHERE estado IN ('iniciada', 'aprobada', 'rechazada')) > 0
    THEN ROUND(
      100.0 * COUNT(*) FILTER (WHERE estado = 'aprobada')
            / COUNT(*) FILTER (WHERE estado IN ('iniciada', 'aprobada', 'rechazada')),
      1
    )
    ELSE 0
  END AS tasa_aprobacion_pct,
  COALESCE(SUM(monto_cop) FILTER (WHERE estado = 'aprobada'), 0) AS ingresos_cop_total
FROM public.intenciones_pago;

COMMENT ON VIEW public.metrica_conversion_pago IS
  'Métricas de conversión de pago: checkouts iniciados vs aprobados, ingresos totales. Solo lectura via service role en panel admin.';
