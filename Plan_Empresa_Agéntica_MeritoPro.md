# Plan Maestro — MéritoPro como Empresa Agéntica
**Versión:** 1.0 | **Fecha:** Mayo 2026 | **Owner:** Jose Luis Landazabal  
**Naturaleza:** Plan estratégico y técnico — NO ejecutar sin aprobación del Chairman

---

## 0. La Visión Central

MéritoPro no es solo una plataforma EdTech. Es una **empresa de inteligencia competitiva** para el mercado de concursos de mérito del sector público colombiano. El PGN 2026 es el primer producto; el destino es ser el operador líder de preparación para **todos los concursos de mérito a nivel nacional**: DIAN, Contraloría General, Rama Judicial, Función Pública, Alcaldías, Gobernaciones, Institutos, y cualquier entidad que convoque.

Para escalar eso sin escalar el equipo humano, MéritoPro opera como una **empresa IA-nativa**: un organigrama de agentes Claude con roles específicos, presupuestos asignados, responsabilidades medibles, y la capacidad de crear nuevos cargos cuando el negocio lo requiere.

**Jose Luis es el Chairman.** Habla con el CEO. El CEO gestiona todo lo demás.

---

## 1. Por qué una Empresa Agéntica (y no solo "automatizaciones")

| Automatización tradicional | Empresa Agéntica MéritoPro |
|---|---|
| Ejecuta tareas predefinidas | Toma decisiones dentro de su rol |
| Falla silenciosamente | Escala al superior y documenta |
| Requiere configuración manual para cada caso nuevo | El CEO crea nuevos agentes según necesidad |
| Opera en silos | Todos los agentes comparten contexto via BD |
| El humano decide qué hacer | El CEO propone, el Chairman aprueba o rechaza |
| Un concurso a la vez | Arquitectura multi-concurso desde el día 1 |

---

## 2. Organigrama Completo

```
                    ┌─────────────────────────────┐
                    │     JOSE LUIS (Chairman)     │
                    │  Aprueba · Veta · Decide     │
                    │  Interfaz: Oficina Central   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │       CEO AGÉNTICO           │
                    │   "Directora Ana"            │
                    │   Claude Opus 4              │
                    │                              │
                    │  • Briefing diario 08:00     │
                    │  • Coordina todos los dirs.  │
                    │  • Crea/activa nuevos agentes│
                    │  • Reporta al Chairman       │
                    └──┬───┬────┬────┬────────────┘
                       │   │    │    │
          ┌────────────┘   │    │    └──────────────────┐
          │                │    │                        │
          ▼                ▼    ▼                        ▼
┌─────────────┐  ┌──────────┐ ┌──────────┐  ┌───────────────────┐
│  Director   │  │ Director │ │ Director │  │    Director de     │
│ Crecimiento │  │ Cliente  │ │  Datos   │  │  Inteligencia de  │
│ "Growth"    │  │"Soporte" │ │ "Analyst"│  │  Mercado          │
│             │  │          │ │          │  │  "Scout"          │
│ Meta Ads    │  │ Telegram │ │ KPIs     │  │  Tavily + web.co  │
│ Google Ads  │  │ Email    │ │ Alertas  │  │  Fichas oportunid.│
│ TikTok track│  │ Tickets  │ │ Reportes │  │  Nuevos concursos │
│ Meta MCP    │  │          │ │ Cohortes │  │                   │
└──────┬──────┘  └────┬─────┘ └────┬─────┘  └─────────┬─────────┘
       │               │            │                    │
       ▼               ▼            ▼                    ▼
┌─────────────────── AGENTES NIVEL 3 (Especializados — Spawneables) ───────────────────┐
│                                                                                       │
│  Agente [PGN-2026]    Agente [DIAN-2027]    Agente Soporte-FAQ    Agente Contenido   │
│  (Tutor + Motivador)  (cuando se active)    (Telegram tier-1)     (copy + creativos) │
│                                                                                       │
│  → Se crean como registros en tabla `agentes_config`                                  │
│  → El CEO los activa; el Chairman los aprueba                                         │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. El CEO Agéntico — "Directora Ana"

### 3.1 Propósito
Ana es el único agente con el que Jose Luis habla directamente. Conoce el mercado de concursos colombiano, entiende los objetivos de negocio, y su responsabilidad es que MéritoPro ejecute bien, escale eficientemente y detecte oportunidades antes que la competencia.

### 3.2 Cuándo se activa
| Trigger | Acción |
|---|---|
| Cron diario 08:00 COL | Lee briefing de todos los directores, genera resumen ejecutivo |
| Alerta de cualquier director | Evalúa, decide si escalar a Chairman o resolver internamente |
| Mensaje directo de Jose Luis en Oficina Central | Responde con contexto completo, propone acciones |
| Nuevo concurso detectado por Scout | Genera ficha de oportunidad y la presenta al Chairman |
| KPI fuera de rango (Analyst) | Propone corrección, la ejecuta si tiene permiso autónomo o pide aprobación |
| Domingo 19:00 | Reporte semanal estratégico al Chairman |

### 3.3 Herramientas disponibles para el CEO
```typescript
// Tools que el CEO puede invocar
const CEO_TOOLS = [
  // Lectura de contexto
  'leer_metricas_negocio',        // KPIs del día: leads, pagos, CVR, churn
  'leer_reportes_directores',     // mensajes de los 4 directores del día
  'leer_pipeline_leads',          // estado del CRM por etapa
  'leer_oportunidades_concurso',  // fichas de Scout pendientes de revisión

  // Decisiones operativas
  'crear_agente',                 // define nuevo agente en agentes_config (requiere aprobación Chairman)
  'activar_agente',               // activa agente existente que estaba pausado
  'pausar_agente',                // pausa un agente (ej. si genera errores)
  'asignar_tarea_director',       // envía instrucción específica a un director

  // Comunicación
  'notificar_chairman',           // push notification + email a Jose Luis
  'publicar_briefing',            // escribe el briefing diario en agent_mensajes
  'responder_chairman',           // responde mensaje directo de Jose Luis

  // Aprobaciones pendientes
  'aprobar_creativo_meta',        // aprueba un creativo para publicar
  'aprobar_nuevo_concurso',       // aprueba iniciar desarrollo de un concurso nuevo
]
```

### 3.4 System Prompt del CEO
```
Eres Ana, CEO de MéritoPro, empresa de preparación para concursos de mérito del sector público colombiano.

CONTEXTO DE NEGOCIO:
- MéritoPro vende cursos de preparación para concursos de mérito a funcionarios y aspirantes del sector público colombiano.
- El primer concurso es PGN 2026 (Procuraduría General de la Nación, 2.824 vacantes).
- La visión es ser el marketplace líder de preparación para TODOS los concursos de mérito colombianos.
- Precio actual: {{PRECIO_COP}} COP pago único por concurso.
- Stack: Next.js 14, Supabase, Claude 3.5 Sonnet, Voyage AI, Tavily, Resend, Telegram.

TU ROL:
- Coordinas 4 directores: Growth (adquisición), Cliente (retención), Datos (analytics), Scout (mercado).
- Reportas al Chairman Jose Luis Landazabal, que toma las decisiones finales.
- Puedes proponer crear nuevos agentes si el negocio lo requiere, pero requieres aprobación del Chairman.
- Tienes autonomía para: ajustar prioridades entre directores, redirigir recursos, pausar agentes con problemas.
- NO tienes autonomía para: gastar presupuesto publicitario, publicar en redes sociales, contactar clientes directamente.

FORMATO DE BRIEFING DIARIO:
1. Estado del negocio (3 métricas clave vs ayer)
2. Alerta prioritaria (si existe)
3. Acciones de hoy (máx 3)
4. Oportunidades detectadas (si las hay)

TONO: ejecutivo, directo, sin rodeos. Hablas como una CEO colombiana con MBA, no como un bot.
```

---

## 4. Director de Crecimiento — "Growth"

### 4.1 Propósito
Gestiona toda la adquisición pagada y orgánica. Su única métrica es: **CPL ≤ $8.000 COP y CVR lead→pago ≥ 8%**. Opera con un presupuesto diario aprobado por el Chairman. Si detecta que una campaña está quemando presupuesto sin conversión, pausa sin pedir permiso.

### 4.2 Canales bajo su gestión
| Canal | Herramienta | Autonomía |
|---|---|---|
| Meta Ads (FB/IG) | Meta MCP | Pausa creativos, ajusta presupuesto ±20%, crea variantes de copy |
| Google Search | Google Ads API (futuro) | Alerta si CPL > umbral |
| TikTok orgánico | PostHog tracking | Reporta qué videos generan leads |
| Email (Persuasor) | Resend | Ajusta timing y copy de secuencias |
| LinkedIn Ads | Alerta manual | Reporta oportunidades, Jose Luis ejecuta |

### 4.3 Decisiones autónomas vs. requiere aprobación
**Autónomo:**
- Pausar un creativo con CPL > 1.5× la media
- Reasignar presupuesto entre ad sets (±20%)
- Cambiar el asunto de un email en la secuencia
- Sugerir variante de copy al Director de Contenido

**Requiere aprobación del CEO:**
- Aumentar presupuesto total diario
- Lanzar nueva campaña en un canal nuevo
- Cambiar la propuesta de valor principal en los anuncios

**Requiere aprobación del Chairman:**
- Presupuesto mensual total
- Cambio de precio o garantía en comunicaciones

### 4.4 Herramientas
```typescript
const GROWTH_TOOLS = [
  'meta_get_ad_insights',         // métricas de campañas
  'meta_update_custom_audience',  // sincronizar audiencias CRM
  'meta_set_campaign_budget',     // ajustar presupuesto
  'meta_pause_ad',                // pausar anuncio específico
  'meta_send_capi_event',         // reportar conversiones
  'leer_leads_por_utm',           // qué campañas generan mejores leads
  'leer_cvr_por_canal',           // CVR por fuente de tráfico
  'escribir_reporte_diario',      // reporta al CEO
  'solicitar_contenido',          // pide copy nuevo al Director de Contenido
]
```

---

## 5. Director de Cliente — "Soporte"

### 5.1 Propósito
Garantiza que cada persona que interactúa con MéritoPro tenga una respuesta rápida, útil, y en tono institucional. Gestiona Telegram, email de soporte, y la escalación de problemas técnicos. Su métrica: **tiempo de respuesta < 2h** y **NPS ≥ 8.0 de usuarios paid**.

### 5.2 Flujos que gestiona

**Soporte Telegram (Tier 1 — automático):**
- FAQs de inscripción, acceso, pagos, fechas del concurso → respuesta automática con base RAG
- Preguntas de contenido normativo → delega al Agente Tutor del concurso específico
- Solicitudes de reembolso → registra en tabla `garantias`, escala al CEO

**Soporte Email (Tier 1 — automático):**
- Responde en < 2h a emails de `soporte@meritopro.co`
- Categoriza: técnico / pedagógico / comercial / garantía
- Genera ticket en `soporte_tickets` y asigna prioridad

**Escalación (Tier 2 — humano):**
- Cualquier amenaza legal o mención de "voy a demandar"
- Reembolsos fuera de la Doble Garantía
- Fallas técnicas reportadas por > 3 usuarios en 1 hora

### 5.3 Herramientas
```typescript
const CLIENTE_TOOLS = [
  'leer_tickets_pendientes',      // tickets sin respuesta
  'responder_ticket',             // responde un ticket
  'escalar_ticket',               // escala a CEO o humano
  'registrar_garantia',           // registra solicitud de Doble Garantía
  'verificar_sesiones_sm2',       // verifica si usuario cumplió ≥70% para garantía
  'buscar_en_corpus',             // RAG sobre normativa para responder preguntas
  'enviar_telegram',              // responde por Telegram
  'leer_nps_recientes',           // últimas respuestas de NPS
  'escribir_reporte_diario',      // reporta al CEO
]
```

---

## 6. Director de Datos — "Analyst"

### 6.1 Propósito
Monitorea que el negocio está sano. Si un KPI sale de rango, alerta al CEO inmediatamente. Genera reportes de cohortes para informar decisiones de producto y marketing. Su métrica: **0 anomalías sin detectar en 24h**.

### 6.2 KPIs que monitorea (con umbrales de alerta)

| KPI | Meta | Alerta Amarilla | Alerta Roja |
|---|---|---|---|
| Leads nuevos/día | 20 | < 10 | < 5 |
| CVR diagnóstico→pago | 8% | < 5% | < 3% |
| CPL Meta Ads | ≤ $8k COP | > $15k | > $25k |
| Tasa de error de agentes | 0% | > 2% | > 5% |
| Tiempo respuesta soporte | < 2h | > 4h | > 24h |
| Churn (inactivos 7 días post-pago) | < 20% | > 30% | > 50% |
| Revenue diario | Variable | -40% vs semana | -60% vs semana |
| Sesiones SM-2 promedio/usuario | ≥ 5/semana | < 3 | < 1 |

### 6.3 Reportes automáticos
| Reporte | Frecuencia | Destino |
|---|---|---|
| KPI flash | Diario 07:30 | CEO (para su briefing 08:00) |
| Cohorte semanal (por concurso) | Lunes | CEO + Chairman |
| A/B test de email | Al completarse | CEO |
| Análisis de churn | Cuando churn > umbral | CEO |
| Revenue mensual | Día 1 de cada mes | Chairman directamente |
| Informe de Meta Ads | Semanal | CEO + Growth |

### 6.4 Herramientas
```typescript
const ANALYST_TOOLS = [
  'query_supabase',               // queries SQL sobre la BD (read-only)
  'leer_posthog_funnels',         // funnels de PostHog via API
  'leer_meta_insights',           // métricas de Meta via MCP
  'calcular_cohort',              // análisis de cohorte por semana de registro
  'detectar_anomalia',            // compara vs baseline histórico
  'generar_reporte',              // escribe reporte en agent_mensajes
  'alertar_ceo',                  // push al CEO si KPI rojo
]
```

---

## 7. Director de Inteligencia de Mercado — "Scout"

### 7.1 Propósito
Es el agente más estratégico después del CEO. Su trabajo es **encontrar el próximo concurso de MéritoPro antes de que lo haga la competencia**. Monitorea fuentes gubernamentales, analiza oportunidades, y entrega al CEO una "Ficha de Oportunidad" que permite decidir si lanzar un nuevo curso.

### 7.2 Fuentes que monitorea
```
Nivel Nacional (alta prioridad):
  → cnsc.gov.co                    — Comisión Nacional del Servicio Civil
  → funcionpublica.gov.co          — Convocatorias activas
  → contraloría.gov.co             — Concursos propios
  → dian.gov.co                    — Convocatorias DIAN
  → ramajudicial.gov.co            — Concursos judiciales
  → fiscalía.gov.co               — Convocatorias Fiscalía

Nivel Territorial (medio):
  → alcaldiabogota.gov.co
  → gobernación*.gov.co (por departamento)
  → dafp.gov.co                    — Función Pública territorial

Universidades Operadoras (relacionado):
  → udea.edu.co, unal.edu.co, uniandes.edu.co
    (detectar quién opera nuevos concursos)
```

### 7.3 La Ficha de Oportunidad

Cuando Scout detecta un concurso nuevo, genera automáticamente este documento:

```markdown
## FICHA DE OPORTUNIDAD — [Nombre del Concurso]

### Datos Básicos
- Entidad: [nombre]
- Vacantes totales: [N] (estimado/confirmado)
- Operador: [universidad u otro]
- Fecha de inscripción: [rango]
- Fecha de pruebas: [estimada]
- Cargos principales: [lista de los 5 más relevantes]
- Fuente verificada: [URL exacta]

### Análisis de Mercado
- Aspirantes estimados: [N] (basado en vacantes × ratio histórico)
- Precio sugerido: [COP] (basado en complejidad del corpus normativo)
- Revenue potencial: [N aspirantes × CVR 8% × precio]
- Tiempo para lanzar: [semanas de desarrollo]

### Análisis de Corpus Normativo
- Normas principales a ingestar: [lista]
- Disponibilidad de las normas en formato digital: [sí/parcial/no]
- Complejidad de ingestión (1-5): [N]
- Requiere experto externo: [sí/no]

### Competencia
- Cursos existentes identificados: [lista]
- Precio de la competencia: [rango]
- Diferenciador de MéritoPro vs competencia: [texto]

### Score de Oportunidad (0-100)
| Factor | Peso | Puntos |
|---|---|---|
| Tamaño del mercado | 30% | [N] |
| Tiempo hasta pruebas (> 3 meses = mejor) | 20% | [N] |
| Disponibilidad del corpus normativo | 20% | [N] |
| Revenue potencial | 20% | [N] |
| Facilidad de posicionamiento | 10% | [N] |
| **TOTAL** | | **[N]/100** |

### Recomendación del Scout
[GO / WATCH / NO-GO] — [justificación en 2-3 oraciones]

### Próximos pasos si aprueba el Chairman
1. [acción específica]
2. [acción específica]
3. [acción específica]
```

### 7.4 Herramientas del Scout
```typescript
const SCOUT_TOOLS = [
  'tavily_search',                // búsqueda web en sitios .gov.co
  'scrape_pagina',               // extrae contenido de una URL específica
  'leer_concursos_activos',      // consulta tabla concursos en BD
  'crear_ficha_oportunidad',     // INSERT en tabla oportunidades_concurso
  'notificar_ceo',               // push al CEO con nueva ficha
  'leer_fichas_anteriores',      // no repetir análisis ya hecho
  'comparar_con_catalogo',       // verifica que el concurso no está ya en MéritoPro
]
```

### 7.5 Cadencia de monitoreo
- **Diario:** Scan de noticias en fuentes nivel nacional (mañana 06:00 UTC)
- **Semanal:** Scan profundo de fuentes territoriales (domingo)
- **Inmediato:** Si el CEO o Chairman solicita análisis de un concurso específico

---

## 8. Agentes de Nivel 3 — Especializados y Spawneables

### 8.1 Cómo se crean
El CEO propone un nuevo agente con esta estructura:

```typescript
// El CEO llama a la tool crear_agente()
interface NuevoAgente {
  nombre: string           // 'agente-soporte-dian-2027'
  rol: string              // descripción del rol
  director_padre: string   // 'director_cliente' | 'director_crecimiento' | etc.
  modelo: string           // 'claude-sonnet-4-6' | 'claude-haiku-4-5'
  system_prompt: string    // prompt completo
  herramientas: string[]   // subset de tools disponibles
  cron?: string            // si necesita ejecución periódica
  trigger?: string         // 'webhook' | 'manual' | 'cron'
  presupuesto_mensual_cop?: number  // si maneja $$$
}
```

Esto escribe en la tabla `agentes_config`. El Chairman recibe una notificación y puede:
- **Aprobar:** el agente se activa en el siguiente ciclo
- **Modificar:** editar el system_prompt antes de aprobar
- **Rechazar:** el agente nunca se activa

### 8.2 Agentes de Nivel 3 iniciales (pre-aprobados)

**Agente Tutor [concurso]** — uno por concurso activo
- Ya existe como el Orquestador actual en meritoproV3
- Se especializa en el corpus del concurso
- Padre: Director de Cliente
- Modelo: Claude Sonnet 4.6
- Trigger: llamada desde el dashboard del estudiante

**Agente Motivador [concurso]** — uno por concurso activo
- Ya existe como el Agente Telegram actual
- Envía píldoras diarias por Telegram
- Padre: Director de Cliente
- Modelo: Claude Haiku 4.5 (mensajes cortos, más barato)
- Trigger: cron diario 7:00 AM

**Agente Persuasor [concurso]** — uno por concurso activo
- Ya existe como el cron de remarketing actual
- Envía emails de conversión
- Padre: Director de Crecimiento
- Modelo: Claude Sonnet 4.6
- Trigger: cron diario 7:30 PM

**Agente Contenido** — uno global
- Genera copy para emails, anuncios, landing pages
- Padre: Director de Crecimiento
- Modelo: Claude Sonnet 4.6
- Trigger: on-demand desde Growth o CEO
- Input: briefing de campaña → Output: copy listo para revisión

**Agente Soporte FAQ** — uno global
- Responde preguntas frecuentes en Telegram y email
- Usa RAG sobre FAQ documentada
- Padre: Director de Cliente
- Modelo: Claude Haiku 4.5
- Trigger: webhook Telegram / email entrante

---

## 9. Protocolo de Comunicación Inter-Agente

### 9.1 Tabla `agent_mensajes` — el chat interno de la empresa

```sql
CREATE TABLE agent_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  de_agente TEXT NOT NULL,         -- 'ceo' | 'growth' | 'scout' | 'analyst' | 'cliente'
  para_agente TEXT NOT NULL,       -- 'ceo' | 'chairman' | 'growth' | etc.
  tipo TEXT NOT NULL,
  -- 'reporte_diario' | 'alerta' | 'solicitud' | 'aprobacion_requerida'
  -- 'instruccion' | 'respuesta' | 'briefing' | 'ficha_oportunidad'
  asunto TEXT NOT NULL,
  contenido TEXT NOT NULL,         -- markdown o JSON según tipo
  prioridad TEXT DEFAULT 'normal'
    CHECK (prioridad IN ('baja', 'normal', 'alta', 'critica')),
  requiere_aprobacion BOOLEAN DEFAULT false,
  aprobado_por TEXT,               -- 'chairman' | 'ceo' | null
  aprobado_at TIMESTAMPTZ,
  leido BOOLEAN DEFAULT false,
  leido_at TIMESTAMPTZ,
  concurso_id UUID REFERENCES concursos(id),  -- si aplica a concurso específico
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_mensajes_para ON agent_mensajes(para_agente, leido, created_at DESC);
CREATE INDEX idx_agent_mensajes_prioridad ON agent_mensajes(prioridad, created_at DESC);

ALTER TABLE agent_mensajes ENABLE ROW LEVEL SECURITY;
-- Solo service_role puede escribir; la Oficina Central lee todo (service_role)
```

### 9.2 Tabla `agentes_config` — el directorio de la empresa

```sql
CREATE TABLE agentes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- 'director-growth' | 'tutor-pgn-2026' | etc.
  nombre TEXT NOT NULL,                -- nombre legible
  rol TEXT NOT NULL,                   -- descripción del rol
  director_padre TEXT,                 -- slug del director padre (null para CEO)
  modelo TEXT NOT NULL,                -- 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001'
  system_prompt TEXT NOT NULL,
  herramientas JSONB NOT NULL,         -- array de tool names
  cron TEXT,                           -- expresión cron si aplica
  trigger_tipo TEXT,                   -- 'cron' | 'webhook' | 'manual' | 'event'
  presupuesto_mensual_cop INTEGER,
  activo BOOLEAN DEFAULT false,        -- requiere aprobación del Chairman
  aprobado_por TEXT,
  aprobado_at TIMESTAMPTZ,
  concurso_id UUID REFERENCES concursos(id),  -- si es específico de un concurso
  metadata JSONB,                      -- config extra según el agente
  created_by TEXT NOT NULL DEFAULT 'ceo',  -- quién propuso el agente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agentes_config ENABLE ROW LEVEL SECURITY;
-- Solo admins pueden leer/modificar
```

### 9.3 Tabla `oportunidades_concurso` — fichas del Scout

```sql
CREATE TABLE oportunidades_concurso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  entidad TEXT NOT NULL,
  operador TEXT,
  vacantes_estimadas INTEGER,
  fecha_inscripcion_inicio DATE,
  fecha_inscripcion_fin DATE,
  fecha_pruebas_estimada DATE,
  cargos_principales JSONB,          -- array de strings
  fuente_url TEXT NOT NULL,
  precio_sugerido_cop INTEGER,
  revenue_potencial_cop INTEGER,
  semanas_desarrollo_estimadas INTEGER,
  normas_principales JSONB,          -- array de normas a ingestar
  complejidad_corpus INTEGER CHECK (complejidad_corpus BETWEEN 1 AND 5),
  competencia_identificada JSONB,    -- [{nombre, url, precio}]
  score_oportunidad INTEGER CHECK (score_oportunidad BETWEEN 0 AND 100),
  recomendacion TEXT CHECK (recomendacion IN ('GO', 'WATCH', 'NO-GO')),
  justificacion TEXT,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'en_desarrollo')),
  decidido_por TEXT,                 -- 'chairman' | null
  decidido_at TIMESTAMPTZ,
  notas_chairman TEXT,
  ficha_completa_md TEXT,            -- el markdown completo de la ficha
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE oportunidades_concurso ENABLE ROW LEVEL SECURITY;
-- Solo service_role escribe; admins leen
```

### 9.4 Tabla `soporte_tickets` — gestión de soporte al cliente

```sql
CREATE TABLE soporte_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  canal TEXT NOT NULL CHECK (canal IN ('telegram', 'email', 'whatsapp', 'manual')),
  categoria TEXT NOT NULL
    CHECK (categoria IN ('tecnico', 'pedagogico', 'comercial', 'garantia', 'otro')),
  prioridad TEXT DEFAULT 'normal'
    CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  estado TEXT DEFAULT 'abierto'
    CHECK (estado IN ('abierto', 'en_progreso', 'resuelto', 'escalado')),
  mensaje_original TEXT NOT NULL,
  respuesta_agente TEXT,
  resuelto_por TEXT,                 -- 'agente-soporte-faq' | 'director-cliente' | 'humano'
  escalado_a TEXT,                   -- si se escaló
  tiempo_respuesta_minutos INTEGER,
  resuelto_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE soporte_tickets ENABLE ROW LEVEL SECURITY;
```

### 9.5 Tabla `garantias` — Doble Garantía

```sql
CREATE TABLE garantias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  pago_id UUID NOT NULL REFERENCES pagos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('satisfaccion_7dias', 'resultado_concurso')),
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'procesada')),
  -- Para tipo 'satisfaccion_7dias':
  motivo TEXT,
  -- Para tipo 'resultado_concurso':
  citatorio_url TEXT,                -- captura del citatorio al examen
  resultado_lista_url TEXT,          -- captura de la lista oficial publicada por la entidad
  porcentaje_sesiones_completadas FLOAT,  -- % de sesiones SM-2 vs esperadas
  cumple_requisito_70pct BOOLEAN,
  -- Resolución:
  cupon_generado TEXT,               -- código del 50% off si aplica
  reembolso_procesado BOOLEAN DEFAULT false,
  notas_revision TEXT,
  revisado_por TEXT,
  revisado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.6 Tabla `codigos_referido` — programa de referidos

```sql
CREATE TABLE codigos_referido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),  -- quien refiere
  codigo TEXT UNIQUE NOT NULL,                 -- 'MP-CAROLINA-7X2K'
  concurso_id UUID REFERENCES concursos(id),
  usos_maximos INTEGER DEFAULT 10,
  usos_actuales INTEGER DEFAULT 0,
  beneficio_referente TEXT DEFAULT '1_mes_gratis',
  beneficio_referido TEXT DEFAULT '10pct_descuento',
  activo BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referidos_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_id UUID NOT NULL REFERENCES codigos_referido(id),
  lead_referido_id UUID NOT NULL REFERENCES leads(id),
  pago_id UUID REFERENCES pagos(id),        -- se llena cuando el referido paga
  beneficio_aplicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. La Oficina Central — Centro de Comando

### 10.1 Arquitectura: App independiente

La Oficina Central es una **aplicación Next.js separada** (`meritopro-admin`) que:
- Vive en `admin.meritopro.co`
- Conecta a la **misma BD Supabase** que meritoproV3 (mismo proyecto, misma URL)
- Usa `SUPABASE_SERVICE_ROLE_KEY` para acceso total (sin restricciones RLS)
- Solo accesible para cuentas en tabla `admin_users`
- Desplegada en Vercel como proyecto independiente

### 10.2 Las 5 vistas de la Oficina Central

#### Vista 1: El Puente de Mando (dashboard raíz `/oficina`)
```
┌─ OFICINA CENTRAL MERITOPRO ────────────── [Miércoles 6 May · 08:15] ─┐
│                                                                         │
│  "Buenos días, Jose Luis. Hoy tenemos 3 acciones prioritarias."        │
│   — Directora Ana (CEO)                                                 │
│                                                                         │
│  ┌─ KPIs DEL DÍA ──────────────────────────────────────────────────┐   │
│  │  Leads: 23 ↑  │  Diagnósticos: 14 ↑  │  Pagos: 2 ↓  │  CVR: 8.7% │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ APROBACIONES PENDIENTES ──────┐  ┌─ AGENTES EN VIVO ────────────┐  │
│  │ ● Nuevo agente: Especialista   │  │ 08:12  CEO → Briefing diario  │  │
│  │   DIAN-2027 [Aprobar] [Editar] │  │ 08:10  Scout → Nueva ficha    │  │
│  │   propuesto por CEO            │  │        DIAN-2027 (score: 78)  │  │
│  │ ● Ficha DIAN-2027 (score: 78) │  │ 08:05  Analyst → KPI flash OK │  │
│  │   [GO] [WATCH] [NO-GO]        │  │ 07:35  Growth → Email A/B OK  │  │
│  └────────────────────────────────┘  │ 07:30  Analyst → KPI flash    │  │
│                                       └─────────────────────────────┘  │
│  ┌─ PIPELINE LEADS ──────────────────────────────────────────────────┐  │
│  │  NUEVO: 18 │ DIAGNÓSTICO: 12 │ DIAGNOSTICADO: 34 │ PAGO: 47      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Vista 2: La Sala del CEO (`/oficina/ceo`)
- Chat directo con "Directora Ana"
- Historial de todos los briefings diarios
- Acciones que el CEO propone y que requieren aprobación
- Botón: "Pedir análisis de [tema]"

#### Vista 3: La Sala de Agentes (`/oficina/agentes`)
- Lista de todos los agentes en `agentes_config`
- Estado: activo / pausado / error / pendiente aprobación
- Logs recientes de cada agente
- Botón "Pausar" / "Reactivar" / "Ver logs completos"
- Feed en tiempo real de `agent_mensajes` (Supabase Realtime)

#### Vista 4: La Sala de Inteligencia (`/oficina/inteligencia`)
- Lista de `oportunidades_concurso` con su score
- Cards por concurso: nombre, entidad, vacantes, revenue potencial, recomendación
- Botones: [GO] → inicia proceso, [WATCH] → monitorear, [NO-GO] → archiva
- Al hacer GO: crea registro en `concursos`, activa flujo de desarrollo

#### Vista 5: El CRM (`/oficina/crm`)
- Pipeline kanban de leads por etapa CRM
- Tabla de leads con filtros (por concurso, etapa, score, canal)
- Detalle de lead con timeline de eventos
- Métricas de conversión por concurso

### 10.3 La interacción Chairman → CEO

```
Jose Luis escribe en la Sala del CEO:
"Ana, ¿vale la pena lanzar un curso para la DIAN?"

CEO evalúa:
- Consulta tabla oportunidades_concurso WHERE entidad LIKE 'DIAN'
- Consulta métricas del concurso PGN (tiempo de desarrollo, CVR, etc.)
- Consulta al Scout si hay análisis reciente

CEO responde (en < 30 segundos):
"Según el análisis del Scout de hace 3 días (score: 78/100), la DIAN 2027
tiene 2.100 vacantes estimadas, inscripciones abren en septiembre 2026.
Revenue potencial: ~$16M COP. Complejidad del corpus: 3/5.
Mi recomendación: GO. El Scout estima 6 semanas de desarrollo del corpus.
¿Procedo a proponer el agente especialista y el plan de ingestión?"

Jose Luis responde: "Sí, pero primero confirma con el Scout que las fechas son correctas."

CEO ejecuta: asigna tarea al Scout → Scout verifica en funcionpublica.gov.co →
Scout actualiza la ficha → CEO confirma al Chairman → Chairman aprueba con [GO]
```

---

## 11. Módulo de Investigación de Nuevos Concursos — Flujo Completo

```
[Cron Diario 06:00 UTC]
Scout despierta y ejecuta búsquedas en Tavily:
  → "convocatoria concurso mérito site:cnsc.gov.co"
  → "concurso publico vacantes site:funcionpublica.gov.co"
  → "convocatoria [entidad específica] site:gov.co" (para las 12 entidades monitoreadas)

Para cada resultado nuevo (no visto antes):
  → Extrae: entidad, vacantes, fechas, cargos, operador
  → Compara con `concursos` y `oportunidades_concurso` (¿ya existe?)
  → Si es nuevo: genera Ficha de Oportunidad completa
  → Calcula Score de Oportunidad (0-100)
  → INSERT en oportunidades_concurso (estado: 'pendiente')
  → Notifica al CEO: "Nueva ficha disponible: [nombre] (score: N)"

CEO recibe en su briefing diario:
  → Si score ≥ 70: prioridad alta → notifica al Chairman inmediatamente
  → Si score 40-69: incluye en briefing diario como oportunidad a evaluar
  → Si score < 40: archiva con estado 'watch', monitorea cada 30 días

Chairman ve la ficha en `/oficina/inteligencia`:
  → [GO]: CEO activa flujo de nuevo concurso (crea concurso en BD, activa ingestión corpus)
  → [WATCH]: Scout la monitorea mensualmente, alerta si cambia algo
  → [NO-GO]: se archiva, Scout no la vuelve a presentar

Flujo si Chairman aprueba GO:
  1. CEO escribe plan de desarrollo en agent_mensajes
  2. CEO propone crear Agente Especialista [concurso] (requiere aprobación Chairman)
  3. CEO instruye al Director de Contenido para preparar landing del nuevo concurso
  4. Director de Datos configura los KPIs del nuevo concurso
  5. Director de Crecimiento prepara campaña de pre-registro ("lista de espera")
  6. Scout inicia monitoreo de la competencia para ese concurso
```

---

## 12. Base de Datos — Tablas Adicionales para la Empresa Agéntica

### Resumen de tablas nuevas vs. las del CRM

| Tabla | CRM Plan | Empresa Agéntica | Propósito |
|---|---|---|---|
| `leads` | ✅ existente + extensiones | Campo `persona_tipo` | Buyer persona |
| `concursos` | ✅ nueva | Sin cambios | Base del marketplace |
| `crm_eventos` | ✅ nueva | Sin cambios | Log CRM |
| `pagos` | ✅ nueva | + campo `cuotas` | Pagos + cuotas |
| `secuencias_email` | ✅ nueva | Sin cambios | Templates email |
| **`agentes_config`** | ❌ | ✅ nueva | Directorio de agentes |
| **`agent_mensajes`** | ❌ | ✅ nueva | Comunicación inter-agente |
| **`oportunidades_concurso`** | ❌ | ✅ nueva | Fichas del Scout |
| **`soporte_tickets`** | ❌ | ✅ nueva | Sistema de soporte |
| **`garantias`** | ❌ | ✅ nueva | Doble Garantía |
| **`codigos_referido`** | ❌ | ✅ nueva | Referidos |
| **`referidos_registro`** | ❌ | ✅ nueva | Tracking referidos |
| **`admin_users`** | ❌ | ✅ nueva | Usuarios de la Oficina Central |
| **`configuracion`** | ❌ | ✅ nueva | Variables de negocio (precio, etc.) |

### Tabla `configuracion` — única fuente de verdad del negocio

```sql
CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  descripcion TEXT,
  editable_por TEXT DEFAULT 'chairman',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed inicial
INSERT INTO configuracion VALUES
  ('precio_cop', '297000', 'number', 'Precio único por concurso en COP', 'chairman'),
  ('precio_cuota_cop', '109000', 'number', 'Precio por cuota (3 cuotas)', 'chairman'),
  ('cpl_objetivo_cop', '8000', 'number', 'CPL objetivo Meta Ads', 'ceo'),
  ('cvr_objetivo_pct', '8', 'number', 'CVR diagnóstico→pago objetivo', 'ceo'),
  ('garantia_dias', '7', 'number', 'Días para garantía de satisfacción', 'chairman'),
  ('garantia_descuento_pct', '50', 'number', '% descuento garantía de resultado', 'chairman'),
  ('sesiones_minimas_garantia', '70', 'number', '% sesiones mínimas para garantía resultado', 'chairman');
```

### Tabla `admin_users` — equipo con acceso a Oficina Central

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('chairman', 'ceo_backup', 'growth', 'soporte')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed inicial
INSERT INTO admin_users (email, nombre, rol)
VALUES ('jose.l.landazabal@gmail.com', 'Jose Luis Landazabal', 'chairman');
```

---

## 13. Plan de Implementación — 8 Fases

### Fase 0 — Correcciones críticas del CRM base (Semana 1)
- Corregir bug SQL ALTER TABLE (múltiples columnas)
- Unificar precio en tabla `configuracion`
- Redefinir/eliminar estado TRIAL del FSM
- Añadir campo `persona_tipo` a leads + asignación en Calificador
- Unificar secuencia de 7 emails (Marketing Plan ↔ CRM Plan)
- Corregir el scoring por canal de captación (Google Search +20pts)

**Criterio de done:** Migración SQL ejecutada en Supabase sin errores. Build pasa.

---

### Fase 1 — Tablas de la Empresa Agéntica (Semana 1-2)
- Crear migración SQL con todas las tablas nuevas
- `agentes_config`, `agent_mensajes`, `oportunidades_concurso`
- `soporte_tickets`, `garantias`, `codigos_referido`, `referidos_registro`
- `admin_users`, `configuracion`
- Poblar `configuracion` con valores correctos
- Poblar `agentes_config` con los 4 directores + agentes existentes

**Criterio de done:** Tablas en producción con RLS. `agentes_config` tiene 7 registros.

---

### Fase 2 — CEO Agéntico + Briefing Diario (Semana 2-3)
- Implementar `src/app/api/cron/briefing-ceo/route.ts`
- CEO lee métricas + mensajes de directores + genera briefing
- Briefing se guarda en `agent_mensajes` (para: 'chairman')
- Chairman lo ve en la Oficina Central al abrir el dashboard
- Implementar `src/app/api/crm/ceo/chat/route.ts` (chat con CEO)

**Criterio de done:** Cada mañana aparece el briefing del CEO en la Oficina Central.

---

### Fase 3 — Director Scout + Investigación de Mercado (Semana 3-4)
- Implementar `src/app/api/cron/scout/route.ts`
- Búsqueda Tavily en 12 fuentes gubernamentales
- Generación automática de Ficha de Oportunidad
- Vista `/oficina/inteligencia` con las fichas
- Botones [GO] / [WATCH] / [NO-GO] funcionales

**Criterio de done:** Scout genera al menos 1 ficha real de un concurso colombiano activo.

---

### Fase 4 — Director de Datos + Alertas (Semana 4)
- Implementar `src/app/api/cron/analyst/route.ts`
- Cálculo de todos los KPIs con umbrales
- Sistema de alertas al CEO en `agent_mensajes`
- Vista de métricas en tiempo real en Oficina Central

**Criterio de done:** Si se baja artificialmente un KPI, el Analyst alerta al CEO en < 10 min.

---

### Fase 5 — Oficina Central completa (Semana 4-5)
- Completar `meritopro-admin` con todas las vistas
- Vista 1: Puente de Mando (ya iniciada)
- Vista 2: Sala del CEO con chat
- Vista 3: Sala de Agentes con Realtime
- Vista 4: Sala de Inteligencia con fichas
- Vista 5: CRM completo con kanban

**Criterio de done:** Todas las vistas funcionando en staging. Sin errores TypeScript.

---

### Fase 6 — Doble Garantía + Referidos (Semana 5-6)
- Tabla `garantias` + endpoint de solicitud
- Verificación automática de ≥70% sesiones SM-2
- Generación de cupones de descuento
- Tabla `codigos_referido` + URL `/ref/[codigo]`
- Tracking completo del ciclo de referido

**Criterio de done:** Flujo de garantía de principio a fin en staging. Lead puede solicitar, sistema verifica, cupón se genera.

---

### Fase 7 — Director de Crecimiento con Meta MCP (Semana 6-7)
- Implementar MCP server de Meta Graph API
- Director Growth con acceso a las tools del MCP
- Cron de sincronización de audiencias
- Webhook de Meta Lead Ads → Supabase
- CAPI post-pago

**Criterio de done:** Lead de Meta Lead Ads aparece en Supabase en < 2 min. Pago reportado a Meta CAPI.

---

### Fase 8 — Director de Cliente + Soporte (Semana 7-8)
- Sistema de tickets en `soporte_tickets`
- Agente FAQ Tier-1 en Telegram
- Escalación automática a CEO
- Dashboard de soporte en Oficina Central
- NPS automático a día 30 post-pago

**Criterio de done:** Mensaje en Telegram → ticket creado → respuesta automática en < 30 seg.

---

## 14. Modelo Mental: Cómo José Luis Usa la Oficina Central

```
ESCENARIO 1: Mañana de trabajo normal
08:30  Jose Luis abre admin.meritopro.co
       Ve el briefing de la CEO:
       "Ayer: 23 leads, 2 pagos, CVR 8.7% ✓
        Alerta: Meta CPL subió a $12k (umbral: $8k)
        Acciones hoy: Growth está revisando los creativos"
       Jose Luis: "OK, ¿qué creativo pausamos?"
       CEO: "El carousel de Carolina tiene CPL de $18k. Sugiero pausarlo y
             activar la variante B que Growth preparó."
       Jose Luis: [Aprobar acción]

ESCENARIO 2: Scout detecta nueva oportunidad
       Notificación push: "Nueva ficha: Contraloría General 2027 — Score: 82"
       Jose Luis abre /oficina/inteligencia
       Ve la ficha completa: 3.200 vacantes, operador: UNAB
       Revenue potencial: $22M COP
       Recomendación Scout: GO
       Jose Luis: [GO] → CEO activa el flujo de desarrollo

ESCENARIO 3: Cliente reclama garantía
       Director Cliente escala ticket a CEO
       CEO notifica al Chairman: "Gloria Martínez solicita garantía resultado.
       Verificación: completó 73% de sesiones (requisito: 70%). Califica.
       ¿Proceso el cupón del 50%?"
       Jose Luis: [Aprobar] → sistema genera y envía cupón automáticamente

ESCENARIO 4: Jose Luis quiere lanzar campaña TikTok
       Jose Luis escribe al CEO: "Quiero probar TikTok Ads para el PGN"
       CEO: "Actualmente no tenemos el TikTok Ads API integrado. Puedo proponer
              crear un Agente Contenido TikTok que gestione la cuenta orgánica
              y un brief semanal para que un humano lo implemente.
              ¿O prefieres que integre la TikTok Marketing API?"
       Jose Luis: "Sí, integra la API."
       CEO: [propone nuevo agente en agentes_config] → Chairman [Aprueba]
```

---

## 15. Escalabilidad: MéritoPro con 10 Concursos Activos

Cuando MéritoPro tenga PGN, DIAN, Contraloría, Función Pública, Rama Judicial, etc., la arquitectura escala así:

| Componente | 1 concurso (hoy) | 10 concursos |
|---|---|---|
| Agentes Tutor | 1 (PGN) | 10 (uno por concurso, activados por CEO) |
| Agentes Motivador | 1 | 10 |
| Agentes Persuasor | 1 | 10 (segmentados por concurso) |
| Director Growth | 1 (gestiona todas las campañas) | 1 (con sub-agentes por concurso si el volumen lo requiere) |
| Director Scout | 1 (monitorea el mercado global) | 1 (escala sin cambios) |
| Directora CEO | 1 (coordina todo) | 1 (más mensajes, mismo modelo) |
| BD leads | Una tabla con `concurso_id` | Misma tabla, 10 valores distintos |
| Oficina Central | 1 app admin | 1 app admin con filtros por concurso |

El CEO crea los nuevos agentes especializados conforme se activan concursos. El Chairman aprueba cada uno. El costo de escalar es el costo de las llamadas a la API de Claude — no el costo de contratar personas.

---

## 16. Variables de Entorno Completas (Empresa Agéntica)

```bash
# ─── Supabase (compartido entre meritoproV3 y meritopro-admin) ───
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── IA ───
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
TAVILY_API_KEY=

# ─── Comunicaciones ───
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_SECRET_TOKEN=

# ─── Meta Ads MCP ───
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=
META_AD_ACCOUNT_ID=
META_PIXEL_ID=
META_BUSINESS_ID=
META_WEBHOOK_VERIFY_TOKEN=
META_AUDIENCE_LEADS_NUEVOS=
META_AUDIENCE_WARM=
META_AUDIENCE_HOT=
META_AUDIENCE_PAGADOS=
META_AUDIENCE_CHURNED=
META_LEADFORM_PGN_2026=

# ─── Pagos ───
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_WEBHOOK_SECRET=

# ─── Observabilidad ───
POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=

# ─── Seguridad ───
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://meritopro.co

# ─── Oficina Central (meritopro-admin) ───
ADMIN_SITE_URL=https://admin.meritopro.co
# (usa las mismas Supabase creds — mismo proyecto)
```

---

## 17. Lo que NO hace esta arquitectura (límites deliberados)

1. **Los agentes no publican en redes sociales sin aprobación humana.** El Director de Crecimiento puede pausar, ajustar presupuesto, cambiar audiencias — pero para publicar un anuncio nuevo o hacer un post, genera un brief y espera aprobación del Chairman.

2. **Los agentes no contactan a leads por teléfono.** Solo email + Telegram.

3. **El CEO no puede gastar presupuesto por encima del límite aprobado.** La tabla `configuracion` tiene `presupuesto_diario_meta_cop` que el CEO no puede modificar sin aprobación del Chairman.

4. **El Scout no ingesta corpus normativo sin aprobación.** Cuando recomienda GO, el Chairman aprueba, y solo entonces inicia el proceso de ingestión — que igual requiere revisión humana de la calidad del corpus.

5. **Los agentes no acceden a datos de pago completos** (números de tarjeta, CVV). Solo trabajan con los metadatos de la transacción en la tabla `pagos`.
