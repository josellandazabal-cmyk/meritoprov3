-- ============================================================
-- 0000 · Foundation V3 (bootstrap idempotente)
--
-- Crea las tablas base del modelo de datos V3: leads, usuarios,
-- sm2_repetition y respuestas_preguntas. Espejo del archivo
-- supabase/schema.sql, pero seguro de re-ejecutar gracias a
-- `IF NOT EXISTS` en tablas y `DROP POLICY IF EXISTS` en policies.
--
-- Orden recomendado para un proyecto Supabase desde cero:
--   1. 0000_foundation_v3.sql        ← este archivo
--   2. 0001_corpus_legal_voyage.sql  ← corpus pgvector
--   3. 0002_leads_anon_read.sql      ← lectura anónima por id
-- ============================================================

-- 1. LEADS ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  celular TEXT NOT NULL,
  cargo_aspira TEXT NOT NULL,
  fuente TEXT DEFAULT 'landing'
    CHECK (fuente IN ('landing', 'remarketing', 'referido')),
  diagnostico_id UUID,
  convertido BOOLEAN DEFAULT false,
  remarketing_enviado_hoy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserción anónima de leads" ON public.leads;
CREATE POLICY "Permitir inserción anónima de leads"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leads visibles solo para autenticados" ON public.leads;
CREATE POLICY "Leads visibles solo para autenticados"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. USUARIOS (post-pago) ------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  profesion TEXT DEFAULT '',
  opec_seleccionada TEXT DEFAULT '',
  nivel_cargo TEXT DEFAULT 'profesional' CHECK (nivel_cargo IN (
    'directivo', 'asesor', 'ejecutivo', 'profesional',
    'tecnico', 'administrativo', 'operativo'
  )),
  ejes_asignados TEXT[] DEFAULT '{}',
  telegram_chat_id TEXT,
  fecha_examen TIMESTAMPTZ,
  probabilidad_aprobar_actual FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios editan su propio perfil"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios crean su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios crean su propio perfil"
  ON public.usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. SM2 (repaso espaciado) ----------------------------------
CREATE TABLE IF NOT EXISTS public.sm2_repetition (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  pregunta_id TEXT NOT NULL,
  repetition_count INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 1,
  e_factor FLOAT DEFAULT 2.5 CHECK (e_factor >= 1.3),
  next_review_date TIMESTAMPTZ DEFAULT now(),
  tema_relacionado TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sm2_repetition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SM2 solo lectura propia" ON public.sm2_repetition;
CREATE POLICY "SM2 solo lectura propia"
  ON public.sm2_repetition
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "SM2 solo escritura propia" ON public.sm2_repetition;
CREATE POLICY "SM2 solo escritura propia"
  ON public.sm2_repetition
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "SM2 solo actualización propia" ON public.sm2_repetition;
CREATE POLICY "SM2 solo actualización propia"
  ON public.sm2_repetition
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. RESPUESTAS_PREGUNTAS ------------------------------------
CREATE TABLE IF NOT EXISTS public.respuestas_preguntas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  pregunta_id TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  correcta BOOLEAN,
  tiempo_respuesta_ms INTEGER DEFAULT 0,
  sesion_tipo TEXT DEFAULT 'diagnostico'
    CHECK (sesion_tipo IN ('diagnostico', 'entrenamiento', 'simulacro')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.respuestas_preguntas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Respuestas lectura propia" ON public.respuestas_preguntas;
CREATE POLICY "Respuestas lectura propia"
  ON public.respuestas_preguntas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Respuestas inserción propia" ON public.respuestas_preguntas;
CREATE POLICY "Respuestas inserción propia"
  ON public.respuestas_preguntas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Respuestas inserción anónima diagnóstico"
  ON public.respuestas_preguntas;
CREATE POLICY "Respuestas inserción anónima diagnóstico"
  ON public.respuestas_preguntas
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND lead_id IS NOT NULL);

-- 5. Índices --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sm2_user_review
  ON public.sm2_repetition (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_leads_convertido
  ON public.leads (convertido) WHERE convertido = false;
CREATE INDEX IF NOT EXISTS idx_respuestas_user
  ON public.respuestas_preguntas (user_id, created_at DESC);

-- 6. Hint a PostgREST para refrescar el schema cache ---------
-- Sin esto, el cliente puede seguir reportando "Could not find the table"
-- después de un CREATE TABLE en runtime.
NOTIFY pgrst, 'reload schema';
