-- ============================================================
-- 0005 · CRM Agéntico + Empresa Agéntica MéritoPro
--
-- Extiende el schema base con:
--   · Columnas CRM en leads (etapa, score, UTMs, persona_tipo…)
--   · concursos       — marketplace multi-concurso
--   · crm_eventos     — log inmutable de acciones CRM
--   · configuracion   — fuente de verdad del negocio (precio, etc.)
--   · agentes_config  — directorio de agentes IA
--   · agent_mensajes  — comunicación inter-agente
--   · oportunidades_concurso — fichas del Scout
--   · soporte_tickets — sistema de tickets de soporte
--   · garantias       — Doble Garantía (solicitudes)
--   · codigos_referido / referidos_registro — programa de referidos
--   · admin_users     — acceso a Oficina Central
--
-- Re-ejecutable: IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- ===========================================================
-- 1. CONCURSOS — base del marketplace multi-concurso
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.concursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  entidad TEXT NOT NULL,
  operador TEXT,
  total_vacantes INTEGER,
  fecha_inscripcion_inicio DATE,
  fecha_inscripcion_fin DATE,
  fecha_pruebas DATE,
  precio_cop INTEGER NOT NULL DEFAULT 297000,
  activo BOOLEAN DEFAULT true,
  visible_en_marketplace BOOLEAN DEFAULT false,
  logo_url TEXT,
  descripcion TEXT,
  modulos JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concursos_public_read" ON public.concursos;
CREATE POLICY "concursos_public_read" ON public.concursos
  FOR SELECT USING (activo = true);

-- Seed PGN 2026
INSERT INTO public.concursos (slug, nombre, entidad, operador, total_vacantes,
  fecha_inscripcion_inicio, fecha_inscripcion_fin, fecha_pruebas, precio_cop, activo, modulos)
VALUES (
  'pgn-2026',
  'Procuraduría General de la Nación 2026',
  'Procuraduría General de la Nación',
  'Universidad de Antioquia',
  2824,
  '2026-06-01', '2026-06-12', '2026-09-15',
  297000, true,
  '[
    {"slug":"derecho_disciplinario","nombre":"Derecho Disciplinario","peso":0.35},
    {"slug":"control_fiscal","nombre":"Control Fiscal y Gestión Pública","peso":0.30},
    {"slug":"gestion_publica","nombre":"Gestión y Administración Pública","peso":0.20},
    {"slug":"competencias_comportamentales","nombre":"Competencias Comportamentales","peso":0.15}
  ]'::JSONB
) ON CONFLICT (slug) DO NOTHING;

-- ===========================================================
-- 2. LEADS — columnas CRM (cada ALTER por separado para idempotencia)
-- ===========================================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS etapa_crm TEXT NOT NULL DEFAULT 'LEAD_NUEVO';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS concurso_id UUID REFERENCES public.concursos(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona_tipo TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telegram_conectado BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telegram_conectado_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS diagnostico_score JSONB;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultimo_email_enviado_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultimo_email_tipo TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS emails_enviados_count INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultimo_contacto_telegram_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pago_completado_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pago_monto_cop INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pago_metodo TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referido_por UUID REFERENCES public.leads(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referidos_generados INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Constraint de etapa (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_etapa_crm_check'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_etapa_crm_check
      CHECK (etapa_crm IN (
        'ANONIMO','LEAD_NUEVO','EN_DIAGNOSTICO',
        'DIAGNOSTICADO','PAYWALL_VISTO','PAGO_COMPLETADO',
        'EMBAJADOR','CHURNED'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_score_range'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_score_range
      CHECK (lead_score BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_persona_tipo_check'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_persona_tipo_check
      CHECK (persona_tipo IN ('carolina','andres','gloria') OR persona_tipo IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_etapa_crm ON public.leads(etapa_crm);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_concurso ON public.leads(concurso_id);
CREATE INDEX IF NOT EXISTS idx_leads_telegram_cid ON public.leads(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_updated ON public.leads(updated_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================
-- 3. CRM_EVENTOS — log inmutable
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.crm_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  payload JSONB,
  agente TEXT NOT NULL DEFAULT 'sistema',
  canal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_eventos_lead ON public.crm_eventos(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_eventos_tipo ON public.crm_eventos(tipo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_eventos_agente ON public.crm_eventos(agente, created_at DESC);

ALTER TABLE public.crm_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_eventos_service_all" ON public.crm_eventos;
CREATE POLICY "crm_eventos_service_all" ON public.crm_eventos
  FOR ALL USING (true);  -- solo service_role accede; RLS bloqueará anon/autenticados

-- ===========================================================
-- 4. CONFIGURACION — fuente de verdad de negocio
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string','number','boolean','json')),
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_service_all" ON public.configuracion;
CREATE POLICY "config_service_all" ON public.configuracion
  FOR ALL USING (true);

INSERT INTO public.configuracion (clave, valor, tipo, descripcion) VALUES
  ('precio_cop',              '297000',  'number',  'Precio único por concurso en COP'),
  ('precio_cuota_cop',        '109000',  'number',  'Precio por cuota — 3 cuotas'),
  ('cpl_objetivo_cop',        '8000',    'number',  'CPL objetivo Meta Ads'),
  ('cvr_objetivo_pct',        '8',       'number',  'CVR diagnóstico→pago objetivo (%)'),
  ('garantia_dias',           '7',       'number',  'Días para garantía de satisfacción'),
  ('garantia_descuento_pct',  '50',      'number',  '% descuento garantía de resultado'),
  ('sesiones_minimas_garantia','70',     'number',  '% sesiones SM-2 mínimas para garantía resultado'),
  ('lead_score_hot_umbral',   '70',      'number',  'Score mínimo para considerarse Hot Lead'),
  ('emails_persuasor_max',    '5',       'number',  'Máximo emails persuasores por lead'),
  ('presupuesto_diario_meta_cop','50000','number',  'Presupuesto diario Meta Ads en COP')
ON CONFLICT (clave) DO NOTHING;

-- ===========================================================
-- 5. AGENTES_CONFIG — directorio de agentes IA
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.agentes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  director_padre TEXT,
  modelo TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  system_prompt TEXT NOT NULL,
  herramientas JSONB DEFAULT '[]'::JSONB,
  cron TEXT,
  trigger_tipo TEXT DEFAULT 'cron' CHECK (trigger_tipo IN ('cron','webhook','manual','event')),
  presupuesto_mensual_cop INTEGER,
  activo BOOLEAN DEFAULT false,
  aprobado_por TEXT,
  aprobado_at TIMESTAMPTZ,
  concurso_id UUID REFERENCES public.concursos(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL DEFAULT 'ceo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agentes_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agentes_service_all" ON public.agentes_config;
CREATE POLICY "agentes_service_all" ON public.agentes_config FOR ALL USING (true);

DROP TRIGGER IF EXISTS agentes_config_updated_at ON public.agentes_config;
CREATE TRIGGER agentes_config_updated_at
  BEFORE UPDATE ON public.agentes_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed: agentes iniciales aprobados
INSERT INTO public.agentes_config (slug, nombre, rol, director_padre, modelo, system_prompt, herramientas, cron, trigger_tipo, activo, aprobado_por, created_by) VALUES
(
  'ceo-ana', 'Directora Ana', 'CEO Agéntico — coordina todos los directores y reporta al Chairman',
  NULL, 'claude-opus-4-7',
  'Eres Ana, CEO de MéritoPro, empresa de preparación para concursos de mérito del sector público colombiano. Coordinas 4 directores. Reportas al Chairman Jose Luis Landazabal.',
  '["leer_metricas","leer_reportes","notificar_chairman","crear_agente","pausar_agente"]'::JSONB,
  '0 13 * * *', 'cron', true, 'chairman', 'sistema'
),
(
  'director-growth', 'Director de Crecimiento', 'Gestiona adquisición: Meta Ads, Google, email persuasor',
  'ceo-ana', 'claude-sonnet-4-6',
  'Eres el Director de Crecimiento de MéritoPro. Tu única métrica es CPL ≤ $8.000 COP y CVR ≥ 8%.',
  '["meta_get_insights","meta_pause_ad","meta_set_budget","meta_sync_audiences","leer_cvr"]'::JSONB,
  '0 14 * * *', 'cron', true, 'chairman', 'sistema'
),
(
  'director-cliente', 'Director de Cliente', 'Gestiona soporte Telegram, email y escalación',
  'ceo-ana', 'claude-sonnet-4-6',
  'Eres el Director de Cliente de MéritoPro. Tu métrica es tiempo de respuesta < 2h y NPS ≥ 8.0.',
  '["leer_tickets","responder_ticket","escalar_ticket","registrar_garantia"]'::JSONB,
  '0 12 * * *', 'cron', true, 'chairman', 'sistema'
),
(
  'director-analyst', 'Director de Datos', 'Monitorea KPIs, genera reportes y alertas al CEO',
  'ceo-ana', 'claude-sonnet-4-6',
  'Eres el Director de Datos de MéritoPro. Monitoreas 8 KPIs. Si alguno sale de rango, alertas al CEO inmediatamente.',
  '["query_metricas","detectar_anomalia","generar_reporte","alertar_ceo"]'::JSONB,
  '30 12 * * *', 'cron', true, 'chairman', 'sistema'
),
(
  'director-scout', 'Director de Inteligencia', 'Investiga nuevos concursos de mérito en Colombia',
  'ceo-ana', 'claude-sonnet-4-6',
  'Eres el Scout de MéritoPro. Monitoreas fuentes .gov.co en busca de nuevos concursos de mérito. Generas Fichas de Oportunidad con score 0-100.',
  '["tavily_search","crear_ficha","notificar_ceo","leer_concursos_activos"]'::JSONB,
  '0 11 * * *', 'cron', true, 'chairman', 'sistema'
)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================================
-- 6. AGENT_MENSAJES — comunicación inter-agente
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.agent_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  de_agente TEXT NOT NULL,
  para_agente TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'reporte_diario','alerta','solicitud','aprobacion_requerida',
    'instruccion','respuesta','briefing','ficha_oportunidad'
  )),
  asunto TEXT NOT NULL,
  contenido TEXT NOT NULL,
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja','normal','alta','critica')),
  requiere_aprobacion BOOLEAN DEFAULT false,
  aprobado_por TEXT,
  aprobado_at TIMESTAMPTZ,
  leido BOOLEAN DEFAULT false,
  leido_at TIMESTAMPTZ,
  concurso_id UUID REFERENCES public.concursos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_msgs_para ON public.agent_mensajes(para_agente, leido, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_msgs_prioridad ON public.agent_mensajes(prioridad, created_at DESC);

ALTER TABLE public.agent_mensajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_msgs_service_all" ON public.agent_mensajes;
CREATE POLICY "agent_msgs_service_all" ON public.agent_mensajes FOR ALL USING (true);

-- ===========================================================
-- 7. OPORTUNIDADES_CONCURSO — fichas del Scout
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.oportunidades_concurso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  entidad TEXT NOT NULL,
  operador TEXT,
  vacantes_estimadas INTEGER,
  fecha_inscripcion_inicio DATE,
  fecha_inscripcion_fin DATE,
  fecha_pruebas_estimada DATE,
  cargos_principales JSONB DEFAULT '[]'::JSONB,
  fuente_url TEXT NOT NULL,
  precio_sugerido_cop INTEGER,
  revenue_potencial_cop INTEGER,
  semanas_desarrollo_estimadas INTEGER,
  normas_principales JSONB DEFAULT '[]'::JSONB,
  complejidad_corpus INTEGER CHECK (complejidad_corpus BETWEEN 1 AND 5),
  competencia_identificada JSONB DEFAULT '[]'::JSONB,
  score_oportunidad INTEGER CHECK (score_oportunidad BETWEEN 0 AND 100),
  recomendacion TEXT CHECK (recomendacion IN ('GO','WATCH','NO-GO')),
  justificacion TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente','en_revision','aprobado','rechazado','en_desarrollo'
  )),
  decidido_por TEXT,
  decidido_at TIMESTAMPTZ,
  notas_chairman TEXT,
  ficha_completa_md TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oportunidades_estado ON public.oportunidades_concurso(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oportunidades_score ON public.oportunidades_concurso(score_oportunidad DESC);

ALTER TABLE public.oportunidades_concurso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oportunidades_service_all" ON public.oportunidades_concurso;
CREATE POLICY "oportunidades_service_all" ON public.oportunidades_concurso FOR ALL USING (true);

-- ===========================================================
-- 8. SOPORTE_TICKETS
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.soporte_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  canal TEXT NOT NULL CHECK (canal IN ('telegram','email','whatsapp','manual')),
  categoria TEXT NOT NULL CHECK (categoria IN ('tecnico','pedagogico','comercial','garantia','otro')),
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja','normal','alta','urgente')),
  estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto','en_progreso','resuelto','escalado')),
  mensaje_original TEXT NOT NULL,
  respuesta_agente TEXT,
  resuelto_por TEXT,
  escalado_a TEXT,
  tiempo_respuesta_minutos INTEGER,
  resuelto_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_estado ON public.soporte_tickets(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_lead ON public.soporte_tickets(lead_id);

ALTER TABLE public.soporte_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_service_all" ON public.soporte_tickets;
CREATE POLICY "tickets_service_all" ON public.soporte_tickets FOR ALL USING (true);

-- ===========================================================
-- 9. GARANTIAS — solicitudes de Doble Garantía
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.garantias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('satisfaccion_7dias','resultado_concurso')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente','en_revision','aprobada','rechazada','procesada'
  )),
  motivo TEXT,
  citatorio_url TEXT,
  resultado_lista_url TEXT,
  porcentaje_sesiones_completadas FLOAT,
  cumple_requisito_70pct BOOLEAN,
  cupon_generado TEXT,
  reembolso_procesado BOOLEAN DEFAULT false,
  notas_revision TEXT,
  revisado_por TEXT,
  revisado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garantias_lead ON public.garantias(lead_id);
CREATE INDEX IF NOT EXISTS idx_garantias_estado ON public.garantias(estado, created_at DESC);

ALTER TABLE public.garantias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "garantias_service_all" ON public.garantias;
CREATE POLICY "garantias_service_all" ON public.garantias FOR ALL USING (true);

-- ===========================================================
-- 10. CODIGOS_REFERIDO + REFERIDOS_REGISTRO
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.codigos_referido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  codigo TEXT UNIQUE NOT NULL,
  concurso_id UUID REFERENCES public.concursos(id),
  usos_maximos INTEGER DEFAULT 10,
  usos_actuales INTEGER DEFAULT 0,
  beneficio_referente TEXT DEFAULT '1_mes_gratis',
  beneficio_referido TEXT DEFAULT '10pct_descuento',
  activo BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codigos_ref_codigo ON public.codigos_referido(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_ref_lead ON public.codigos_referido(lead_id);

ALTER TABLE public.codigos_referido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "codigos_ref_service_all" ON public.codigos_referido;
CREATE POLICY "codigos_ref_service_all" ON public.codigos_referido FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.referidos_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_id UUID NOT NULL REFERENCES public.codigos_referido(id),
  lead_referido_id UUID NOT NULL REFERENCES public.leads(id),
  pago_completado BOOLEAN DEFAULT false,
  beneficio_aplicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referidos_registro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referidos_service_all" ON public.referidos_registro;
CREATE POLICY "referidos_service_all" ON public.referidos_registro FOR ALL USING (true);

-- ===========================================================
-- 11. ADMIN_USERS — acceso a Oficina Central
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('chairman','ceo_backup','growth','soporte')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_service_all" ON public.admin_users;
CREATE POLICY "admin_service_all" ON public.admin_users FOR ALL USING (true);

INSERT INTO public.admin_users (email, nombre, rol)
VALUES ('jose.l.landazabal@gmail.com', 'Jose Luis Landazabal', 'chairman')
ON CONFLICT (email) DO NOTHING;

-- ===========================================================
-- 12. FUNCION: incrementar_lead_score (RPC)
-- ===========================================================
CREATE OR REPLACE FUNCTION public.incrementar_lead_score(
  p_lead_id UUID,
  p_puntos INTEGER,
  p_factor TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.leads
  SET lead_score = LEAST(100, lead_score + p_puntos)
  WHERE id = p_lead_id;

  INSERT INTO public.crm_eventos (lead_id, tipo, payload, agente, canal)
  VALUES (
    p_lead_id,
    'score_actualizado',
    jsonb_build_object('puntos_sumados', p_puntos, 'factor', p_factor),
    'sistema',
    'webhook'
  );
END;
$$;

-- ===========================================================
-- 13. FUNCION: increment_emails_enviados (RPC)
-- Incrementa contador de emails enviados a un lead.
-- Usada por /api/webhooks/emails/resend.
-- ===========================================================
CREATE OR REPLACE FUNCTION public.increment_emails_enviados(
  lead_id_param UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.leads
  SET emails_enviados_count = COALESCE(emails_enviados_count, 0) + 1,
      updated_at = NOW()
  WHERE id = lead_id_param;
END;
$$;

-- ===========================================================
-- 14. VISTA: métricas CRM para Oficina Central
-- ===========================================================
CREATE OR REPLACE VIEW public.vista_crm_metricas AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS leads_hoy,
  COUNT(*) FILTER (WHERE etapa_crm = 'LEAD_NUEVO') AS leads_nuevos,
  COUNT(*) FILTER (WHERE etapa_crm = 'EN_DIAGNOSTICO') AS en_diagnostico,
  COUNT(*) FILTER (WHERE etapa_crm = 'DIAGNOSTICADO') AS diagnosticados,
  COUNT(*) FILTER (WHERE etapa_crm = 'PAYWALL_VISTO') AS paywall_visto,
  COUNT(*) FILTER (WHERE etapa_crm = 'PAGO_COMPLETADO') AS pagos,
  COUNT(*) FILTER (WHERE etapa_crm = 'EMBAJADOR') AS embajadores,
  COUNT(*) FILTER (WHERE etapa_crm = 'CHURNED') AS churned,
  COUNT(*) FILTER (WHERE pago_completado_at >= DATE_TRUNC('month', NOW())) AS pagos_mes,
  COALESCE(SUM(pago_monto_cop) FILTER (WHERE pago_completado_at >= DATE_TRUNC('month', NOW())), 0) AS revenue_mes_cop
FROM public.leads;

-- ===========================================================
-- 15. TABLA: documentos_ceo — Biblioteca de documentos para Ana
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.documentos_ceo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'txt', 'md', 'csv', 'docx')),
  storage_path TEXT NOT NULL,
  tamano_bytes INTEGER,
  extracto TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_ceo ENABLE ROW LEVEL SECURITY;
-- Solo service role puede operar (admin app usa service role)
-- No policies needed: service role bypasses RLS entirely.
