# Plan Maestro — CRM Agéntico MéritoPro
**Versión:** 1.0 | **Fecha:** Mayo 2026 | **Owner:** Jose Luis Landazabal  
**Stack:** Next.js 14 · Supabase · Claude 3.5 Sonnet · Voyage AI · Tavily · Resend · Telegraf · PostHog

---

## 0. Contexto Estratégico y Visión

### 0.1 Qué es MéritoPro
Plataforma EdTech de preparación para **concursos de mérito del sector público colombiano**. El modelo de negocio es SaaS de pago único por convocatoria. El primer mercado es la convocatoria de la Procuraduría General de la Nación (PGN) 2026, con 2.824 vacantes y operada por la Universidad de Antioquia.

**La visión a mediano plazo es un marketplace nacional:** MéritoPro como la plataforma donde cada entidad pública que convoca un concurso (DIAN, Contraloría General, Función Pública, Alcaldías, Gobernaciones, Rama Judicial, etc.) ofrece su ruta de preparación. El CRM Agéntico es la infraestructura de relación con leads y usuarios que escala horizontalmente a todos esos concursos.

### 0.2 Por qué un CRM Agéntico (y no un CRM tradicional)
Un CRM tradicional registra datos. Un CRM Agéntico **actúa de manera autónoma** sobre cada lead basado en su comportamiento, debilidades detectadas y posición en el funnel. Los agentes de MéritoPro ya existen (Tutor, Motivador, Persuasor). El CRM Agéntico es la **capa de orquestación** que decide cuándo y cómo cada agente interviene sobre cada lead/usuario.

### 0.3 Horizontes de tiempo
| Horizonte | Concursos Activos | Meta Leads/mes | Meta Conversión |
|---|---|---|---|
| **Corto (0-6 meses)** | Solo PGN 2026 | 500 leads/mes | 8% → 40 pagos |
| **Mediano (6-18 meses)** | PGN + 3 concursos nacionales | 2.000 leads/mes | 10% → 200 pagos |
| **Largo (18-36 meses)** | Marketplace abierto (10+ entidades) | 10.000 leads/mes | 12% → 1.200 pagos |

---

## 1. Arquitectura del CRM — Visión General

```
                        FUENTES DE CAPTACIÓN
                 Landing · Telegram · Ads · Referidos
                              │
                              ▼
┌────────────────────── PIPELINE DE LEADS ──────────────────────────┐
│  ANÓNIMO → LEAD → DIAGNOSTICADO → TRIAL → PAGO → EMBAJADOR        │
│               ↑         ↑            ↑       ↑       ↑            │
│          [etapa_crm]  [score]   [módulos]  [$197k] [NPS≥9]        │
└───────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   AGENTES CRM IA   │
                    │                    │
                    │ • Calificador       │  ← llama diagnóstico
                    │ • Nutritor          │  ← Telegram + email
                    │ • Persuasor         │  ← remarketing
                    │ • Router multi-     │  ← concurso asignado
                    │   concurso          │
                    └─────────┬──────────┘
                              │
                    ┌─────────┴──────────┐
                    │  CANALES DE SALIDA  │
                    │                    │
                    │ • Email (Resend)    │
                    │ • Telegram bot     │
                    │ • Push web         │
                    │ • Dashboard notif. │
                    └────────────────────┘
```

### 1.1 Estados del Lead (FSM — Máquina de Estado Finito)

Cada lead tiene un campo `etapa_crm` que evoluciona de forma unidireccional. Los agentes actúan diferente según el estado.

```
ANÓNIMO
  │ (submit formulario landing)
  ▼
LEAD_NUEVO          → trigger: email bienvenida + Telegram invite
  │ (inicia diagnóstico)
  ▼
EN_DIAGNOSTICO      → trigger: ping a los 10 min si no termina
  │ (completa 40 preguntas)
  ▼
DIAGNOSTICADO       → trigger: email con resultado + SMS score
  │ (ve el paywall / inicia trial)
  ▼
TRIAL               → trigger: 3 emails nutrición (día 1, 3, 7)
  │ (completa pago)
  ▼
PAGO_COMPLETADO     → trigger: onboarding Telegram + acceso total
  │ (usa plataforma ≥ 14 días + NPS ≥ 9)
  ▼
EMBAJADOR           → trigger: solicitud referido automática
  │
  ▼ (si abandona en cualquier punto)
CHURNED             → trigger: secuencia de reactivación (día 1, 7, 30)
```

### 1.2 Lead Score (0-100)
El score determina la urgencia de intervención del Persuasor.

| Factor | Puntos | Lógica |
|---|---|---|
| Completó diagnóstico | +30 | Indica intención real |
| Abrió email de resultado | +10 | Leyó su score |
| Visitó `/dashboard` (paywall) | +15 | Vio el producto |
| Tiene módulo con score < 40% | +20 | Dolor identificado |
| Cargo aspirado tiene salario > $5M COP | +15 | ROI alto |
| Respondió a Telegram | +10 | Canal activo |
| No ha abierto ningún email en 7 días | -20 | Frío |

**Score ≥ 70 = Hot Lead** → el Persuasor interviene con remarketing agresivo.  
**Score 40-69 = Warm Lead** → nutrición educativa.  
**Score < 40 = Cold Lead** → secuencia de reactivación lenta.

---

## 2. Base de Datos — Schema Completo CRM

### 2.1 Tabla `leads` (extender la existente)

```sql
-- Agregar columnas CRM a la tabla leads existente
ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  etapa_crm TEXT NOT NULL DEFAULT 'LEAD_NUEVO'
    CHECK (etapa_crm IN (
      'ANONIMO','LEAD_NUEVO','EN_DIAGNOSTICO',
      'DIAGNOSTICADO','TRIAL','PAGO_COMPLETADO',
      'EMBAJADOR','CHURNED'
    ));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  concurso_id UUID REFERENCES concursos(id);  -- multi-concurso

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  telegram_chat_id BIGINT UNIQUE,
  telegram_conectado BOOLEAN DEFAULT false,
  telegram_conectado_at TIMESTAMPTZ;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  diagnostico_score JSONB,
  -- Ejemplo: {"total": 62, "derecho_disciplinario": 45, "control_fiscal": 78, "gestion_publica": 55}

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  ultimo_email_enviado_at TIMESTAMPTZ,
  ultimo_email_tipo TEXT,
  emails_enviados_count INTEGER DEFAULT 0,

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  ultimo_contacto_telegram_at TIMESTAMPTZ,

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  pago_completado_at TIMESTAMPTZ,
  pago_monto_cop INTEGER,
  pago_metodo TEXT,

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  referido_por UUID REFERENCES leads(id),
  referidos_generados INTEGER DEFAULT 0,

ALTER TABLE leads ADD COLUMN IF NOT EXISTS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices críticos para performance
CREATE INDEX IF NOT EXISTS idx_leads_etapa_crm ON leads(etapa_crm);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_concurso ON leads(concurso_id);
CREATE INDEX IF NOT EXISTS idx_leads_telegram ON leads(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();
```

### 2.2 Tabla `concursos` (nueva — base del marketplace)

```sql
CREATE TABLE concursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'pgn-2026', 'dian-2027', etc.
  nombre TEXT NOT NULL,               -- 'Procuraduría General de la Nación 2026'
  entidad TEXT NOT NULL,              -- 'Procuraduría General de la Nación'
  operador TEXT,                      -- 'Universidad de Antioquia'
  total_vacantes INTEGER,
  fecha_inscripcion_inicio DATE,
  fecha_inscripcion_fin DATE,
  fecha_pruebas DATE,
  precio_cop INTEGER NOT NULL DEFAULT 197000,
  activo BOOLEAN DEFAULT true,
  visible_en_marketplace BOOLEAN DEFAULT false,
  logo_url TEXT,
  descripcion TEXT,
  modulos JSONB,
  -- Ejemplo: [{"slug":"derecho_disciplinario","nombre":"Derecho Disciplinario","peso":0.35}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: lectura pública para concursos activos
ALTER TABLE concursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concursos_public_read" ON concursos
  FOR SELECT USING (activo = true);

CREATE POLICY "concursos_admin_all" ON concursos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin')
  );
```

### 2.3 Tabla `crm_eventos` (log inmutable de acciones CRM)

```sql
CREATE TABLE crm_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  -- 'email_enviado' | 'email_abierto' | 'telegram_enviado' | 'telegram_respondido'
  -- 'etapa_cambiada' | 'score_actualizado' | 'pago_iniciado' | 'pago_completado'
  -- 'diagnostico_iniciado' | 'diagnostico_completado' | 'agente_intervencion'
  payload JSONB,
  -- Para emails: {asunto, tipo_email, resend_id}
  -- Para etapa: {etapa_anterior, etapa_nueva}
  -- Para score: {score_anterior, score_nuevo, factor}
  agente TEXT,
  -- 'sistema' | 'persuasor' | 'nutritor' | 'motivador' | 'calificador'
  canal TEXT,
  -- 'email' | 'telegram' | 'web' | 'cron'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_eventos_lead ON crm_eventos(lead_id, created_at DESC);
CREATE INDEX idx_crm_eventos_tipo ON crm_eventos(tipo, created_at DESC);

-- RLS: solo el usuario autenticado ve sus propios eventos
ALTER TABLE crm_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_eventos_user_read" ON crm_eventos
  FOR SELECT USING (
    lead_id IN (
      SELECT lead_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "crm_eventos_service_insert" ON crm_eventos
  FOR INSERT WITH CHECK (true);  -- service_role bypasses RLS
```

### 2.4 Tabla `secuencias_email` (plantillas por etapa y concurso)

```sql
CREATE TABLE secuencias_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso_id UUID REFERENCES concursos(id),  -- NULL = aplica a todos
  etapa_crm TEXT NOT NULL,
  orden INTEGER NOT NULL,          -- 1, 2, 3... dentro de la secuencia
  delay_horas INTEGER NOT NULL,    -- horas después del trigger de etapa
  tipo TEXT NOT NULL,
  -- 'bienvenida' | 'resultado_diagnostico' | 'nutricion_1' | 'nutricion_2'
  -- 'remarketing_urgencia' | 'remarketing_social_proof' | 'reactivacion'
  -- 'onboarding_pago' | 'recordatorio_estudiar' | 'nps'
  asunto_template TEXT NOT NULL,   -- Supports {{nombre}}, {{score}}, {{modulo_debil}}
  body_template TEXT NOT NULL,     -- HTML con variables
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Tabla `pagos` (registro de transacciones)

```sql
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  concurso_id UUID NOT NULL REFERENCES concursos(id),
  monto_cop INTEGER NOT NULL,
  metodo TEXT NOT NULL,   -- 'wompi' | 'bold' | 'mercadopago' | 'transferencia'
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','completado','fallido','reembolsado')),
  referencia_externa TEXT,  -- ID de la pasarela
  wompi_signature TEXT,
  payload_webhook JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completado_at TIMESTAMPTZ
);

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_user_read" ON pagos
  FOR SELECT USING (
    lead_id IN (SELECT lead_id FROM users WHERE id = auth.uid())
  );
```

---

## 3. Los 4 Agentes del CRM Agéntico

### 3.1 Agente Calificador (nuevo)

**Rol:** Analiza el resultado del diagnóstico y asigna score inicial + etapa CRM.  
**Se ejecuta:** Inmediatamente después de `POST /api/orquestador/completar-diagnostico`.  
**Archivo:** `src/app/api/crm/calificar/route.ts`

**Lógica:**
```typescript
// Inputs que recibe
interface InputCalificador {
  lead_id: string
  respuestas: RespuestaDiagnostico[]
  cargo_aspira: string
  nivel_educativo: string
  concurso_id: string
}

// Outputs que produce
interface OutputCalificador {
  lead_score: number           // 0-100
  diagnostico_score: Record<string, number>  // por módulo
  etapa_crm: 'DIAGNOSTICADO'
  modulo_mas_debil: string
  modulo_mas_fuerte: string
  perfil_riesgo: 'ALTO' | 'MEDIO' | 'BAJO'
  recomendacion_estudio: string  // texto para email de resultado
}
```

**System prompt Claude:**
```
Eres el Calificador del CRM de MéritoPro.
Tu única función es analizar resultados de diagnóstico y devolver JSON estructurado.
NO inventes normas. NO especules. Solo analiza los datos numéricos dados.

Reglas de scoring:
- Score por módulo = (correctas / total_modulo) * 100
- Score total = promedio ponderado según pesos del concurso
- Módulo débil = score más bajo
- Perfil ALTO = score_total < 40 O tiene módulo < 30
- Perfil MEDIO = score_total 40-65
- Perfil BAJO = score_total > 65

Devuelve SOLO JSON válido con la estructura OutputCalificador.
```

### 3.2 Agente Nutritor (email educativo)

**Rol:** Envía emails de valor educativo según la debilidad detectada. No vende — enseña.  
**Se ejecuta:** Cron diario a las 07:00 Colombia (`America/Bogota`).  
**Archivo:** `src/app/api/cron/nutricion/route.ts`

**Criterios de disparo:**
```typescript
// Leads que reciben nutrición HOY
const leads = await supabase
  .from('leads')
  .select('*')
  .eq('etapa_crm', 'DIAGNOSTICADO')
  .lte('lead_score', 69)  // Hot leads van al Persuasor
  .gte('lead_score', 20)  // Cold leads van a reactivación
  .or(`ultimo_email_enviado_at.is.null,ultimo_email_enviado_at.lt.${hace48Horas}`)
  .limit(100)
```

**Tipos de email por día en el funnel:**
| Día desde diagnóstico | Tipo | Subject template |
|---|---|---|
| 0 (inmediato) | `resultado_diagnostico` | `{{nombre}}, tu diagnóstico PGN: {{score_total}}% — aquí está tu plan` |
| 1 | `nutricion_modulo_debil` | `El error más común en {{modulo_debil}} (y cómo evitarlo)` |
| 3 | `caso_real_norma` | `Caso real: ¿Qué dice la Ley 1952/2019 sobre esto?` |
| 7 | `social_proof` | `Cómo Carolina pasó de 48% a 81% en 3 semanas` |
| 14 | `urgencia_fechas` | `Faltan {{dias_para_pruebas}} días. ¿Tienes tu plan de estudio?` |

**System prompt Claude (Nutritor):**
```
Eres el Nutritor educativo de MéritoPro para el concurso {{concurso_nombre}}.
Tu tono es el de un tutor universitario experto: claro, directo, sin jerga de ventas.

REGLA ANTI-ALUCINACIÓN: Si el email incluye normativa, cita EXACTAMENTE así:
"Ley [número]/[año], Art. [N]".
Si no tienes la norma en el contexto, NO la menciones.

El lead se llama {{nombre}}, tiene {{score_total}}% en diagnóstico.
Su módulo más débil es {{modulo_debil}} con {{score_modulo}}%.

Genera el email tipo {{tipo_email}} con máximo 200 palabras.
Devuelve JSON: {"asunto": "...", "preheader": "...", "body_html": "..."}
El body_html debe ser HTML simple, sin CSS inline complejo.
```

### 3.3 Agente Persuasor (remarketing con urgencia)

**Rol:** Convierte leads Hot (score ≥ 70) que no han pagado. Ataca aversión a la pérdida.  
**Se ejecuta:** Cron diario a las 19:30 Colombia.  
**Archivo:** `src/app/api/cron/remarketing/route.ts`

**Criterios de disparo:**
```typescript
const leadsHot = await supabase
  .from('leads')
  .select('*')
  .in('etapa_crm', ['DIAGNOSTICADO', 'TRIAL'])
  .gte('lead_score', 70)
  .is('pago_completado_at', null)
  .or(`ultimo_email_enviado_at.is.null,ultimo_email_enviado_at.lt.${hace24Horas}`)
  .limit(50)
```

**Secuencia Persuasor (máximo 5 emails, luego pausa 30 días):**
| # | Ángulo | Asunto template |
|---|---|---|
| 1 | ROI salarial | `{{nombre}}: un grado en PGN = ${{salario_cargo}} COP/mes. ¿Cuánto vale prepararse bien?` |
| 2 | Social proof específico | `97 personas de tu cargo ya entrenaron hoy. ¿Tú también?` |
| 3 | Urgencia fechas | `Quedan {{dias}} días para inscribirte. El que no se prepara, no pasa.` |
| 4 | Pérdida concreta | `Sin preparación, el 78% reprueba en el primer intento. Tu diagnóstico dice {{score_total}}%.` |
| 5 | Última oportunidad | `{{nombre}}, esta es la última vez que te escribo sobre el concurso PGN.` |

**System prompt Claude (Persuasor):**
```
Eres el Persuasor de MéritoPro. Tu única métrica es conversión a pago.
Tono: adulto, institucional, directo. CERO emojis. CERO lenguaje de "quiz".

DATOS DEL LEAD:
- Nombre: {{nombre}}
- Cargo aspirado: {{cargo_aspira}}
- Salario del cargo (PGN 2026): {{salario_cop}} COP/mes
- Score diagnóstico: {{score_total}}%
- Módulo más débil: {{modulo_debil}} ({{score_modulo}}%)
- Días para fecha de pruebas: {{dias_para_pruebas}}
- Emails anteriores enviados: {{emails_count}}

TÉCNICA A USAR: {{tecnica}} (aversion_perdida | roi_salarial | social_proof | urgencia_escasez)

Genera el email persuasivo email #{{numero}}.
Máximo 150 palabras. Incluye UNA llamada a la acción: el link al paywall.
JSON: {"asunto": "...", "preheader": "...", "body_html": "..."}

REGLA: No menciones normativa legal. Enfócate en el ROI económico y la fecha límite.
```

### 3.4 Agente Router Multi-Concurso (futuro — Fase Marketplace)

**Rol:** Cuando un lead llega a la landing sin concurso específico, analiza su perfil y lo asigna al concurso más relevante activo en el marketplace.  
**Se ejecuta:** En el submit del formulario de landing.  
**Archivo:** `src/app/api/crm/router-concurso/route.ts`

**Lógica de asignación:**
```typescript
interface InputRouter {
  cargo_aspira: string
  nivel_educativo: string
  departamento: string  // campo nuevo en el formulario
  utm_campaign?: string
}

// El router devuelve el concurso_id más adecuado
// basado en coincidencia cargo → concurso activo
// Si hay ambigüedad → muestra selector al usuario
```

---

## 4. Flujos de Automatización por Etapa

### 4.1 Flujo: Lead Nuevo → Diagnosticado

```
T+0:   Submit formulario landing
       → INSERT leads (etapa_crm='LEAD_NUEVO')
       → Redirect a /diagnostico/[lead_id]
       → Trigger: Email "bienvenida" (Resend, inmediato)
       → PostHog event: 'lead_captado' {concurso, cargo, utm_source}

T+10min: Cron check (cada 5 min)
       → Si lead.etapa_crm = 'LEAD_NUEVO' Y created_at > 10 min
       → Enviar Telegram: "Hola {{nombre}}, tu diagnóstico te espera →"
       → PostHog event: 'ping_diagnostico_enviado'

T+0:   Inicia diagnóstico
       → UPDATE leads SET etapa_crm='EN_DIAGNOSTICO'
       → PostHog event: 'diagnostico_iniciado'

T+variable: Completa las 40 preguntas
       → POST /api/orquestador/completar-diagnostico
       → Agente Calificador → calcula score + módulos
       → UPDATE leads SET etapa_crm='DIAGNOSTICADO', diagnostico_score=..., lead_score=...
       → INSERT crm_eventos (tipo='diagnostico_completado')
       → Inmediato: Resend email "resultado_diagnostico"
       → PostHog event: 'diagnostico_completado' {score_total, modulo_debil, perfil_riesgo}
```

### 4.2 Flujo: Diagnosticado → Pago

```
T+0h  (inmediato): Email resultado diagnóstico con score y módulos
T+24h: Email nutrición 1 (módulo débil educativo)
T+72h: Email nutrición 2 (caso real + norma)
T+7d:  Email social proof
T+14d: Si no pagó: Lead score re-evaluado
       → Si score ≥ 70: Persuasor toma el control (5 emails en 10 días)
       → Si score 40-69: Continúa nutrición
       → Si score < 40: Pausa 30 días → Reactivación

Telegram (paralelo):
  → Si telegram_conectado = true:
     Día 1: Píldora de la debilidad detectada (pregunta práctica)
     Día 3: Recordatorio con fecha de cierre de inscripciones
     Día 7: Caso de éxito + link a plataforma
```

### 4.3 Flujo: Pago Completado

```
T+0:   Webhook pasarela → POST /api/webhooks/pagos/[metodo]
       → Verificar firma del webhook
       → UPDATE leads SET etapa_crm='PAGO_COMPLETADO', pago_completado_at=NOW()
       → UPDATE leads SET lead_score=100
       → INSERT crm_eventos (tipo='pago_completado')
       → Crear user en auth.users + tabla users
       → Activar acceso completo a /dashboard/[concurso_slug]
       → Resend: Email "onboarding" (bienvenida al curso completo)
       → Telegram: Mensaje de bienvenida + comandos disponibles
       → PostHog event: 'pago_completado' {monto, metodo, concurso, cargo}

T+1h:  Onboarding secuencia Telegram:
       "🎯 Aquí está tu plan de estudio de 30 días para el concurso PGN"

T+7d:  Check de actividad:
       → Si usuario no ha completado ninguna sesión SM-2:
         Email "reactivación onboarding" + Telegram nudge

T+30d: Solicitud NPS + solicitud de referido
       → Si NPS ≥ 9: UPDATE etapa_crm='EMBAJADOR'
       → Enviar link de referido único
```

### 4.4 Flujo: Reactivación de Churned

```
Criterio CHURNED:
  → Lead en 'DIAGNOSTICADO' sin actividad por 30 días
  → Lead en 'TRIAL' sin actividad por 14 días
  → Pago_completado sin login por 21 días

Secuencia reactivación (3 emails en 2 semanas):
  Día 1:  "{{nombre}}, ¿todo bien? Tu plan de estudio te espera"
  Día 7:  "Actualización concurso PGN: nueva información que necesitas"
  Día 14: "Última oportunidad — las inscripciones cierran en {{dias}} días"

Si no reacciona tras 3 emails: estado CHURNED permanente.
Reactivación futura solo por nuevo ciclo de concurso o campaña de ads.
```

---

## 5. API Routes del CRM

### 5.1 Mapa completo de endpoints CRM

```
POST  /api/crm/calificar                → Calificador post-diagnóstico
POST  /api/crm/actualizar-score         → Recalcular score de un lead
POST  /api/crm/cambiar-etapa            → Cambio manual de etapa (admin)

GET   /api/cron/nutricion               → Envío diario emails educativos (07:00)
GET   /api/cron/remarketing             → Envío diario emails persuasión (19:30)
GET   /api/cron/reactivacion            → Check leads inactivos (lunes 08:00)
GET   /api/cron/score-actualizar        → Recalcular scores masivo (03:00 diario)

POST  /api/webhooks/pagos/wompi         → Webhook Wompi
POST  /api/webhooks/pagos/bold          → Webhook Bold
POST  /api/webhooks/emails/resend       → Webhook Resend (opens, clicks)
POST  /api/webhooks/telegram            → Webhook Telegram (ya existe, extender)

GET   /api/admin/crm/dashboard          → Métricas CRM en tiempo real
GET   /api/admin/crm/leads              → Lista leads con filtros
GET   /api/admin/crm/lead/[id]          → Detalle de un lead + historial
POST  /api/admin/crm/lead/[id]/nota     → Agregar nota manual al lead

GET   /api/marketplace/concursos        → Lista concursos públicos activos
GET   /api/marketplace/concurso/[slug]  → Detalle de un concurso
```

### 5.2 Implementación: `/api/crm/calificar/route.ts`

```typescript
// src/app/api/crm/calificar/route.ts
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  respuestas: z.array(z.object({
    pregunta_id: z.string(),
    modulo: z.string(),
    es_correcta: z.boolean(),
    cargo_aspira: z.string(),
  })),
  concurso_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const body = BodySchema.parse(await req.json())
  const supabase = createClient()
  const anthropic = new Anthropic()

  // 1. Calcular scores por módulo
  const scoresPorModulo = calcularScoresPorModulo(body.respuestas)
  const scoreTotal = calcularScoreTotal(scoresPorModulo, body.concurso_id)

  // 2. Calificador IA para recomendación personalizada
  const calificacion = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT_CALIFICADOR,
    messages: [{
      role: 'user',
      content: JSON.stringify({ scoresPorModulo, scoreTotal, cargo: body.respuestas[0]?.cargo_aspira })
    }]
  })

  // 3. Calcular lead_score inicial
  const leadScore = calcularLeadScore({ scoreTotal, completoDiagnostico: true })

  // 4. Actualizar lead en BD
  await supabase.from('leads').update({
    etapa_crm: 'DIAGNOSTICADO',
    lead_score: leadScore,
    diagnostico_score: scoresPorModulo,
  }).eq('id', body.lead_id)

  // 5. Registrar evento CRM
  await supabase.from('crm_eventos').insert({
    lead_id: body.lead_id,
    tipo: 'diagnostico_completado',
    payload: { scoreTotal, scoresPorModulo, leadScore },
    agente: 'calificador',
    canal: 'web',
  })

  return NextResponse.json({ ok: true, leadScore, scoresPorModulo })
}
```

### 5.3 Implementación: `/api/cron/remarketing/route.ts` (extender la existente)

```typescript
// src/app/api/cron/remarketing/route.ts
export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const anthropic = new Anthropic()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Obtener leads Hot que no han pagado
  const { data: leads } = await supabase
    .from('leads')
    .select('*, concursos(*)')
    .in('etapa_crm', ['DIAGNOSTICADO', 'TRIAL'])
    .gte('lead_score', 70)
    .is('pago_completado_at', null)
    .limit(50)

  const resultados = await Promise.allSettled(
    (leads ?? []).map(lead => procesarLeadPersuasor(lead, anthropic, resend, supabase))
  )

  // PostHog batch event
  const exitosos = resultados.filter(r => r.status === 'fulfilled').length
  
  return NextResponse.json({
    procesados: leads?.length ?? 0,
    exitosos,
    fallidos: (leads?.length ?? 0) - exitosos,
  })
}

async function procesarLeadPersuasor(lead, anthropic, resend, supabase) {
  // Determinar número de email en la secuencia
  const { count } = await supabase
    .from('crm_eventos')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', lead.id)
    .eq('tipo', 'email_enviado')
    .eq('agente', 'persuasor')

  if (count >= 5) return  // máximo 5 emails persuasores

  const tecnica = TECNICAS_POR_ORDEN[count ?? 0]
  const diasParaPruebas = calcularDias(lead.concursos?.fecha_pruebas)
  const salarioCargo = SALARIOS_PGN[lead.cargo_aspira] ?? 5000000

  // Generar email con Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPromptPersuasor(lead, tecnica, diasParaPruebas, salarioCargo, (count ?? 0) + 1),
    messages: [{ role: 'user', content: 'Genera el email persuasivo ahora.' }]
  })

  const emailData = JSON.parse(response.content[0].text)

  // Enviar con Resend
  const { data: resendData } = await resend.emails.send({
    from: 'MéritoPro <hola@meritopro.co>',
    to: lead.email,
    subject: emailData.asunto,
    html: emailData.body_html,
  })

  // Registrar evento
  await supabase.from('crm_eventos').insert({
    lead_id: lead.id,
    tipo: 'email_enviado',
    payload: { asunto: emailData.asunto, tipo_email: 'remarketing', resend_id: resendData?.id, numero: (count ?? 0) + 1 },
    agente: 'persuasor',
    canal: 'email',
  })

  // Actualizar último email enviado
  await supabase.from('leads').update({
    ultimo_email_enviado_at: new Date().toISOString(),
    ultimo_email_tipo: 'remarketing',
    emails_enviados_count: supabase.rpc('increment', { row_id: lead.id }),
  }).eq('id', lead.id)
}
```

### 5.4 Webhook Resend (tracking de aperturas)

```typescript
// src/app/api/webhooks/emails/resend/route.ts
export async function POST(req: NextRequest) {
  const payload = await req.json()
  const supabase = createClient()

  // Verificar firma Resend (Svix)
  // ...verificación de signature...

  if (payload.type === 'email.opened') {
    const leadId = payload.data.tags?.lead_id
    if (!leadId) return NextResponse.json({ ok: true })

    // Sumar 10 puntos al lead score por apertura
    await supabase.rpc('incrementar_lead_score', {
      p_lead_id: leadId,
      p_puntos: 10,
      p_factor: 'email_abierto'
    })

    await supabase.from('crm_eventos').insert({
      lead_id: leadId,
      tipo: 'email_abierto',
      payload: { resend_email_id: payload.data.email_id },
      agente: 'sistema',
      canal: 'email',
    })
  }

  if (payload.type === 'email.clicked') {
    const leadId = payload.data.tags?.lead_id
    if (leadId) {
      await supabase.rpc('incrementar_lead_score', {
        p_lead_id: leadId,
        p_puntos: 15,
        p_factor: 'email_click_cta'
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

---

## 6. Dashboard Admin CRM

### 6.1 Ruta y estructura

```
/admin/crm                    → Dashboard principal con métricas
/admin/crm/leads              → Tabla de leads con filtros y búsqueda
/admin/crm/lead/[id]          → Perfil completo de un lead + timeline
/admin/crm/concursos          → Gestión de concursos (marketplace)
/admin/crm/secuencias         → Editor de plantillas de email
/admin/crm/agentes            → Logs de los agentes IA
```

**Acceso:** Solo usuarios con `raw_user_meta_data->>'role' = 'admin'`.

### 6.2 KPIs en el dashboard admin

**Sección 1 — Embudo Hoy:**
```
Nuevos leads: [N]  →  Diagnósticos completados: [N]  →  Pagos: [N]
Conversión landing→diagnóstico: [%]  |  Diagnóstico→pago: [%]
```

**Sección 2 — Pipeline por Etapa:**
| Etapa | # Leads | Score Promedio | Acción Recomendada |
|---|---|---|---|
| LEAD_NUEVO | N | - | Cron nutrición enviado |
| EN_DIAGNOSTICO | N | - | Ping Telegram |
| DIAGNOSTICADO | N | X% | Nutrición / Persuasión |
| TRIAL | N | X% | Persuasor activo |
| PAGO_COMPLETADO | N | 100 | Retención |
| CHURNED | N | - | Reactivación pendiente |

**Sección 3 — Agentes en las últimas 24h:**
- Emails enviados: N (Nutritor: N | Persuasor: N | Bienvenida: N)
- Emails abiertos: N (tasa: N%)
- Mensajes Telegram enviados: N
- Errores de agente: N

**Sección 4 — Revenue:**
- MRR (pago único acumulado este mes): $N COP
- Ticket promedio: $N COP
- CAC estimado (si hay data de ads): $N COP

### 6.3 Vista detalle lead (`/admin/crm/lead/[id]`)

```
┌─ DATOS BÁSICOS ──────────────────────────────────────────────┐
│ Nombre: [●] | Email: [●] | Celular: [●] | Cargo: [●]        │
│ Concurso: PGN 2026 | Etapa: DIAGNOSTICADO | Score: 72/100   │
└──────────────────────────────────────────────────────────────┘

┌─ DIAGNÓSTICO ────────────────────────────────────────────────┐
│ Score Total: 62% | Perfil Riesgo: MEDIO                      │
│ Derecho Disciplinario: 45% ████░░░░ (módulo más débil)      │
│ Control Fiscal:        78% ████████                          │
│ Gestión Pública:       55% █████░░░                          │
└──────────────────────────────────────────────────────────────┘

┌─ TIMELINE CRM ───────────────────────────────────────────────┐
│ [19:30] Email #3 persuasor enviado (asunto: "Quedan 18 días")│
│ [14:22] Email #2 abierto (click en CTA paywall)              │
│ [11:00] Email #2 enviado (Social proof)                      │
│ [Ayer]  Telegram: Lead respondió "gracias"                   │
│ [Ayer]  Email #1 enviado (resultado diagnóstico)             │
│ [Ayer]  Diagnóstico completado en 23 minutos                 │
│ [Ayer]  Lead creado (utm: google/cpc/pgn_2026)               │
└──────────────────────────────────────────────────────────────┘

┌─ ACCIONES MANUALES ──────────────────────────────────────────┐
│ [Enviar Telegram ahora] [Cambiar etapa] [Agregar nota]       │
│ [Marcar como pagado manualmente] [Bloquear remarketing]      │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Marketplace Multi-Concurso — Arquitectura

### 7.1 Modelo de datos del marketplace

Cada concurso tiene:
- Su propio `slug` para URLs (`/concurso/pgn-2026`, `/concurso/dian-2027`)
- Su propia configuración de módulos, pesos y preguntas en el corpus RAG
- Su propio precio (puede ser distinto de $197.000)
- Sus propias fechas de inscripción y pruebas
- Opcionalmente: su propio operador (entidad que co-administra)

### 7.2 Landing dinámica por concurso

```
/                           → Landing genérica marketplace (lista concursos activos)
/concurso/pgn-2026          → Landing específica PGN (la actual)
/concurso/dian-2027         → Landing específica DIAN (futura)
/diagnostico/[lead_id]      → Diagnóstico filtrado por concurso del lead
/dashboard                  → Dashboard del usuario (multi-concurso si ha pagado varios)
```

**Implementación landing dinámica:**
```typescript
// src/app/concurso/[slug]/page.tsx
export async function generateStaticParams() {
  const supabase = createClient()
  const { data } = await supabase.from('concursos').select('slug').eq('activo', true)
  return (data ?? []).map(c => ({ slug: c.slug }))
}

export default async function LandingConcurso({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: concurso } = await supabase
    .from('concursos')
    .select('*')
    .eq('slug', params.slug)
    .eq('activo', true)
    .single()

  if (!concurso) notFound()
  return <LandingTemplate concurso={concurso} />
}
```

### 7.3 Roadmap marketplace por fases

**Fase Marketplace 1 (mes 7-9):** Soporte técnico multi-concurso
- [ ] Tablas `concursos` y `pagos` creadas
- [ ] Sistema de corpus RAG multi-concurso (vectores taggeados por `concurso_id`)
- [ ] Landing dinámica `/concurso/[slug]`
- [ ] Dashboard multi-concurso para un usuario con varios cursos
- [ ] CRM: Router multi-concurso básico
- [ ] Admin: Panel de gestión de concursos

**Fase Marketplace 2 (mes 10-12):** Primer concurso adicional
- [ ] Ingestar corpus del segundo concurso (DIAN / Contraloría / Función Pública)
- [ ] A/B test landing nueva vs landing PGN (aprendizajes de copy)
- [ ] Precios diferenciados por concurso
- [ ] Pasarela de pagos con multi-concurso
- [ ] SEO: página individual por concurso indexada

**Fase Marketplace 3 (mes 13-18):** Marketplace abierto
- [ ] Portal de auto-onboarding para operadores de concurso
- [ ] Panel del operador: gestión de su concurso, visualización de métricas de leads
- [ ] Modelo de revenue sharing con operadores
- [ ] Widget embebible en sitios de universidades operadoras
- [ ] API pública para consultar concursos activos

---

## 8. Tracking y Métricas (PostHog)

### 8.1 Eventos críticos a trackear

```typescript
// Catálogo completo de eventos PostHog para MéritoPro CRM

// CAPTACIÓN
posthog.capture('lead_captado', {
  concurso_slug: string,        // 'pgn-2026'
  cargo_aspira: string,
  utm_source: string,
  utm_medium: string,
  utm_campaign: string,
  tiene_telefono: boolean,
})

// DIAGNÓSTICO
posthog.capture('diagnostico_iniciado', { lead_id, concurso_slug })
posthog.capture('diagnostico_abandonado', { lead_id, pregunta_numero, minutos_sesion })
posthog.capture('diagnostico_completado', {
  lead_id,
  score_total: number,          // 0-100
  modulo_debil: string,
  perfil_riesgo: string,        // 'ALTO' | 'MEDIO' | 'BAJO'
  minutos_tomados: number,
})

// CRM EMAILS
posthog.capture('email_enviado', { lead_id, tipo_email, agente, concurso_slug })
posthog.capture('email_abierto', { lead_id, tipo_email })
posthog.capture('email_cta_clicked', { lead_id, tipo_email })

// TELEGRAM
posthog.capture('telegram_conectado', { lead_id })
posthog.capture('telegram_respondio', { lead_id, longitud_respuesta: number })

// CONVERSIÓN
posthog.capture('paywall_visto', { lead_id, origen, lead_score })
posthog.capture('checkout_iniciado', { lead_id, metodo_pago, monto_cop })
posthog.capture('pago_completado', {
  lead_id,
  monto_cop,
  metodo_pago,
  concurso_slug,
  dias_desde_lead: number,      // cuántos días desde el registro hasta pago
  emails_recibidos: number,
  diagnostico_score: number,
})
posthog.capture('pago_fallido', { lead_id, metodo_pago, error_codigo })

// RETENCIÓN (post-pago)
posthog.capture('sesion_sm2_completada', { user_id, preguntas_respondidas, modulo })
posthog.capture('racha_dias', { user_id, racha_dias: number })
posthog.capture('nps_respondido', { user_id, score: number })
posthog.capture('referido_generado', { user_id })
```

### 8.2 Funnels clave en PostHog

**Funnel 1 — Conversión principal:**
```
Landing vista → Lead captado → Diagnóstico iniciado → Diagnóstico completado → Paywall visto → Checkout iniciado → Pago completado
```

**Funnel 2 — Retención:**
```
Pago completado → Primera sesión SM-2 → Sesión día 7 → Sesión día 14 → Sesión día 30
```

**Funnel 3 — Reactivación:**
```
Lead churned → Email reactivación enviado → Email abierto → Paywall visto → Pago completado
```

### 8.3 Métricas target por fase

| Métrica | Hoy (PGN únicamente) | Meta 6 meses | Meta 18 meses |
|---|---|---|---|
| CVR Landing → Lead | - | 12% | 15% |
| CVR Lead → Diagnóstico | - | 60% | 65% |
| CVR Diagnóstico → Pago | - | 8% | 12% |
| CVR global | - | 5.8% | 7.8% |
| LTV promedio | $197k COP | $197k COP | $350k COP (multi-concurso) |
| CAC (ads) | - | < $50k COP | < $40k COP |
| Retención día 30 (post-pago) | - | 70% | 75% |
| NPS | - | ≥ 8.0 | ≥ 8.5 |

---

## 9. Plan de Implementación — Fases Detalladas

### FASE CRM-1: Base de Datos y Schema (Semana 1)

**Objetivo:** Migrar el schema de BD para soportar el CRM completo.

**Archivos a crear/modificar:**
- [ ] `supabase/migrations/20260506_crm_schema.sql` — Schema completo (tablas + índices + RLS + triggers)
- [ ] `supabase/migrations/20260506_concursos_seed.sql` — Insertar concurso PGN 2026 como primer registro
- [ ] `src/lib/supabase/types.ts` — Regenerar tipos TypeScript (`supabase gen types typescript`)

**SQL de seed inicial:**
```sql
INSERT INTO concursos (
  slug, nombre, entidad, operador, total_vacantes,
  fecha_inscripcion_inicio, fecha_inscripcion_fin, fecha_pruebas,
  precio_cop, activo, modulos
) VALUES (
  'pgn-2026',
  'Procuraduría General de la Nación 2026',
  'Procuraduría General de la Nación',
  'Universidad de Antioquia',
  2824,
  '2026-06-01', '2026-06-12', '2026-09-15',
  197000,
  true,
  '[
    {"slug":"derecho_disciplinario","nombre":"Derecho Disciplinario","peso":0.35},
    {"slug":"control_fiscal","nombre":"Control Fiscal y Gestión Pública","peso":0.30},
    {"slug":"gestion_publica","nombre":"Gestión y Administración Pública","peso":0.20},
    {"slug":"competencias_comportamentales","nombre":"Competencias Comportamentales","peso":0.15}
  ]'::jsonb
);
```

**Criterio de done:** `npm run build` pasa, `supabase gen types` sin errores, RLS verificada con test user.

---

### FASE CRM-2: Agente Calificador (Semana 2)

**Objetivo:** Post-diagnóstico automático → score + etapa CRM.

**Archivos a crear/modificar:**
- [ ] `src/app/api/crm/calificar/route.ts` — Endpoint POST nuevo
- [ ] `src/lib/crm/calificador.ts` — Lógica de cálculo de scores
- [ ] `src/lib/crm/lead-score.ts` — Función `calcularLeadScore()`
- [ ] `src/app/api/orquestador/route.ts` — Modificar para llamar al Calificador al completar

**Función `calcularLeadScore`:**
```typescript
// src/lib/crm/lead-score.ts
export function calcularLeadScore(factores: LeadScoreFactores): number {
  let score = 0
  if (factores.completoDiagnostico)      score += 30
  if (factores.abrioPrimerEmail)         score += 10
  if (factores.visitoPaywall)            score += 15
  if (factores.scoreModuloDebil < 40)    score += 20
  if (factores.salarioCargo > 5_000_000) score += 15
  if (factores.respondioTelegram)        score += 10
  if (factores.diasSinAbriEmail > 7)     score -= 20
  return Math.max(0, Math.min(100, score))
}
```

**Criterio de done:** Al completar el diagnóstico, la BD muestra `etapa_crm='DIAGNOSTICADO'` + `lead_score > 0` + evento en `crm_eventos`.

---

### FASE CRM-3: Email Automatizado por Etapa (Semana 3)

**Objetivo:** Nutritor y Persuasor activos con secuencias reales.

**Archivos a crear/modificar:**
- [ ] `src/app/api/cron/nutricion/route.ts` — Nuevo cron (reemplaza el actual básico)
- [ ] `src/app/api/cron/remarketing/route.ts` — Extender el existente con scoring
- [ ] `src/app/api/cron/reactivacion/route.ts` — Nuevo cron (lunes 08:00)
- [ ] `src/lib/crm/email-templates.ts` — Templates base para las secuencias
- [ ] `src/lib/crm/agente-nutritor.ts` — Lógica del Nutritor
- [ ] `src/lib/crm/agente-persuasor.ts` — Lógica del Persuasor (extraer del cron existente)
- [ ] `vercel.json` — Agregar crons nutricion y reactivación

**Entrada en `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/nutricion",    "schedule": "0 12 * * *"  },
    { "path": "/api/cron/remarketing",  "schedule": "30 0 * * *"  },
    { "path": "/api/cron/reactivacion", "schedule": "0 13 * * 1"  },
    { "path": "/api/cron/score-actualizar", "schedule": "0 8 * * *" }
  ]
}
```
> Nota: Vercel usa UTC. Colombia (UTC-5) → 07:00 = 12:00 UTC | 19:30 = 00:30 UTC+1 (día siguiente).

**Criterio de done:** En staging, ejecutar manualmente cada cron → ver emails en bandeja Resend + eventos en `crm_eventos`.

---

### FASE CRM-4: Webhook de Apertura de Email (Semana 3)

**Objetivo:** Actualizar `lead_score` cuando un lead abre un email.

**Archivos a crear:**
- [ ] `src/app/api/webhooks/emails/resend/route.ts`
- [ ] `supabase/functions/incrementar_lead_score.sql` — Función RPC para incrementar score con límites

**Función SQL:**
```sql
CREATE OR REPLACE FUNCTION incrementar_lead_score(
  p_lead_id UUID,
  p_puntos INTEGER,
  p_factor TEXT
) RETURNS void AS $$
BEGIN
  UPDATE leads
  SET lead_score = LEAST(100, lead_score + p_puntos)
  WHERE id = p_lead_id;

  INSERT INTO crm_eventos (lead_id, tipo, payload, agente, canal)
  VALUES (p_lead_id, 'score_actualizado',
    jsonb_build_object('puntos_sumados', p_puntos, 'factor', p_factor),
    'sistema', 'webhook');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Criterio de done:** Abrir email de test → BD muestra `lead_score + 10` + evento en log.

---

### FASE CRM-5: Dashboard Admin CRM (Semana 4)

**Objetivo:** Visibilidad total del pipeline para el equipo.

**Archivos a crear:**
- [ ] `src/app/admin/crm/page.tsx` — Dashboard principal
- [ ] `src/app/admin/crm/leads/page.tsx` — Tabla de leads con filtros
- [ ] `src/app/admin/crm/lead/[id]/page.tsx` — Detalle de lead
- [ ] `src/app/admin/layout.tsx` — Layout admin con verificación de rol
- [ ] `src/components/admin/LeadTimeline.tsx` — Componente timeline
- [ ] `src/components/admin/LeadScoreBadge.tsx` — Badge visual del score
- [ ] `src/components/admin/FunnelChart.tsx` — Gráfico de embudo (recharts)
- [ ] `src/app/api/admin/crm/dashboard/route.ts` — API de métricas

**Protección de ruta admin:**
```typescript
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/login')
  }
  return <div className="admin-layout">{children}</div>
}
```

**Criterio de done:** Admin puede ver embudo en tiempo real, filtrar leads por etapa/score, ver timeline de cada lead.

---

### FASE CRM-6: Pasarela de Pagos (Semana 5)

**Objetivo:** Pago real integrado, webhook actualiza etapa CRM automáticamente.

**Decisión de pasarela:** Wompi (Colombia, sin costo fijo, cobro por transacción ~2.95%).

**Archivos a crear/modificar:**
- [ ] `src/app/api/webhooks/pagos/wompi/route.ts` — Webhook Wompi (verificación de firma SHA256)
- [ ] `src/app/dashboard/pagar/page.tsx` — Página de pago (redirect a Wompi checkout)
- [ ] `src/lib/pagos/wompi.ts` — Cliente Wompi (generar link de pago + verificar firma)
- [ ] `src/app/dashboard/pago-exitoso/page.tsx` — Página de confirmación

**Verificación de firma Wompi:**
```typescript
// src/lib/pagos/wompi.ts
import crypto from 'crypto'

export function verificarFirmaWompi(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const calculado = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculado)
  )
}
```

**Criterio de done:** Pago de prueba en Wompi sandbox → etapa del lead cambia a `PAGO_COMPLETADO` → email onboarding llega en < 1 min.

---

### FASE CRM-7: Multi-Concurso Base (Semana 6-7)

**Objetivo:** La arquitectura soporta un segundo concurso sin tocar código de negocio.

**Archivos a crear/modificar:**
- [ ] `src/app/concurso/[slug]/page.tsx` — Landing dinámica por concurso
- [ ] `src/app/concurso/[slug]/layout.tsx`
- [ ] `src/components/landing/LandingTemplate.tsx` — Template paramétrico
- [ ] `src/app/api/marketplace/concursos/route.ts` — API pública de concursos
- [ ] `src/lib/rag/corpus.ts` — Taggeado por `concurso_id` en vectores
- [ ] Migración SQL: agregar `concurso_id` a `public.corpus_legal`

**Criterio de done:** Crear un segundo concurso de prueba en la BD → `/concurso/test-2027` muestra landing con datos del nuevo concurso. CRM lo asigna correctamente.

---

## 10. Checklist de Release (por Fase CRM)

Antes de hacer deploy de cada fase a producción:

```
SEGURIDAD
□ Todos los endpoints cron verifican CRON_SECRET
□ Webhook Resend verifica firma Svix
□ Webhook Wompi verifica firma SHA256
□ Admin routes verifican rol en cada request
□ Variables de entorno documentadas en .env.example

BASE DE DATOS
□ Todas las tablas nuevas tienen RLS habilitada
□ Todas las políticas RLS probadas con test user anónimo, autenticado, admin
□ Funciones SQL con SECURITY DEFINER revisadas
□ Índices creados en columnas de filtro frecuente
□ Migration SQL idempotente (IF NOT EXISTS)

CÓDIGO
□ npm run build → 0 errores TypeScript
□ 0 usos de `any` en código nuevo
□ Zod schema en todos los inputs de API routes
□ Funciones de cron: error handling + log en crm_eventos

OBSERVABILIDAD
□ PostHog events disparándose (verificar en PostHog dashboard)
□ Sentry configurado para errores de cron y webhooks
□ crm_eventos registrando acciones de agentes

PERFORMANCE
□ Lighthouse Mobile Perf ≥ 85 en landing dinámica
□ API routes de cron retornan en < 30s (límite Vercel hobby)
□ Queries con LIMIT en todos los crons
```

---

## 11. Variables de Entorno Requeridas (Acumulado)

```bash
# Supabase (ya existen)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA (ya existen)
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
TAVILY_API_KEY=

# Email (ya existe)
RESEND_API_KEY=

# Telegram (ya existe)
TELEGRAM_BOT_TOKEN=
TELEGRAM_SECRET_TOKEN=

# Cron security (ya existe)
CRON_SECRET=

# Nuevos para CRM
WOMPI_PUBLIC_KEY=           # Pasarela de pagos
WOMPI_PRIVATE_KEY=
WOMPI_WEBHOOK_SECRET=       # Para verificar firma de webhooks Wompi
RESEND_WEBHOOK_SECRET=      # Para verificar firma de webhooks Resend (Svix)
POSTHOG_API_KEY=            # Para server-side events
NEXT_PUBLIC_POSTHOG_KEY=    # Para client-side events
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# URLs
NEXT_PUBLIC_APP_URL=https://meritopro.co   # Para links en emails
```

---

## 12. Glosario Técnico del CRM MéritoPro

| Término | Definición en este contexto |
|---|---|
| **Lead** | Persona que dejó sus datos en la landing. Puede no haber pagado. |
| **Usuario** | Lead que completó el pago. Tiene acceso a `/dashboard`. |
| **Etapa CRM** | Estado actual del lead en el pipeline (FSM de 8 estados). |
| **Lead Score** | Número 0-100 que mide la probabilidad de conversión. |
| **Hot Lead** | Score ≥ 70. Interviene el Persuasor. |
| **Agente** | Proceso autónomo IA que actúa sobre leads según su estado. |
| **Concurso** | Convocatoria específica de una entidad pública (PGN, DIAN, etc.). |
| **Marketplace** | Plataforma donde múltiples concursos son preparables en MéritoPro. |
| **Corpus RAG** | Documentación legal ingestada en pgvector, taggeada por concurso. |
| **Bucle Diario** | Sesión de estudio SM-2 que el usuario hace en `/dashboard/entrenar`. |
| **Píldora Telegram** | Pregunta práctica enviada por Telegram para repaso rápido. |
| **CVR** | Conversion Rate (tasa de conversión entre dos etapas del funnel). |
| **CAC** | Customer Acquisition Cost (costo de adquirir un usuario pagador). |
