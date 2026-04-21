-- ============================================================
-- MéritoPro V3 — Schema SQL para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================

-- 1. Tabla LEADS (Pre-pago — captura ligera)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  celular TEXT NOT NULL,
  cargo_aspira TEXT NOT NULL,
  fuente TEXT DEFAULT 'landing' CHECK (fuente IN ('landing', 'remarketing', 'referido')),
  diagnostico_id UUID,
  convertido BOOLEAN DEFAULT false,
  remarketing_enviado_hoy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Inserción anónima permitida (formulario público)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserción anónima de leads"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Leads visibles solo para autenticados"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Tabla USUARIOS (Post-pago — extiende auth.users)
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

-- RLS: Solo usuario autenticado lee/edita su propio registro
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen su propio perfil"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuarios editan su propio perfil"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios crean su propio perfil"
  ON public.usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Tabla SM2_REPETITION (Motor Cognitivo — Spaced Repetition)
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

-- RLS: Solo el usuario dueño
ALTER TABLE public.sm2_repetition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SM2 solo lectura propia"
  ON public.sm2_repetition
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "SM2 solo escritura propia"
  ON public.sm2_repetition
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "SM2 solo actualización propia"
  ON public.sm2_repetition
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Tabla RESPUESTAS_PREGUNTAS (Historial)
CREATE TABLE IF NOT EXISTS public.respuestas_preguntas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  pregunta_id TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  correcta BOOLEAN,
  tiempo_respuesta_ms INTEGER DEFAULT 0,
  sesion_tipo TEXT DEFAULT 'diagnostico' CHECK (sesion_tipo IN ('diagnostico', 'entrenamiento', 'simulacro')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.respuestas_preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Respuestas lectura propia"
  ON public.respuestas_preguntas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Respuestas inserción propia"
  ON public.respuestas_preguntas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Permitir inserción anónima para diagnóstico (lead sin auth)
CREATE POLICY "Respuestas inserción anónima diagnóstico"
  ON public.respuestas_preguntas
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND lead_id IS NOT NULL);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_sm2_user_review ON public.sm2_repetition (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_leads_convertido ON public.leads (convertido) WHERE convertido = false;
CREATE INDEX IF NOT EXISTS idx_respuestas_user ON public.respuestas_preguntas (user_id, created_at DESC);
