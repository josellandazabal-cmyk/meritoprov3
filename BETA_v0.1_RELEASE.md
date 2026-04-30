# MéritoPro · Beta v0.1 — Release Notes y Plan de Pruebas Reales

**Fecha:** Abril 2026 · **Estado:** READY FOR BETA TESTING
**Concurso objetivo:** Procuraduría General de la Nación — Convocatoria 2026 (2.826 vacantes)
**Operador oficial:** Universidad de Antioquia

---

## 1. Qué se incluye en la beta

### 1.1. Funcionalidad funcional (probada end-to-end)

| Capa | Estado | Notas |
|---|---|---|
| Build de producción (`npm run build`) | ✅ | tsc + ESLint sin errores. |
| Landing → captura de lead → redirect a diagnóstico | ✅ | Lead persistido en `public.leads` con cargo elegido. |
| Diagnóstico de 40 preguntas (Pearson VUE UI) | ✅ | Reloj regresivo, dificultad adaptativa, cita normativa serif. |
| Tipo I — selección múltiple A/B/C/D | ✅ | |
| Tipo II — afirmaciones 1-4 + combinaciones estáticas | ✅ | Opciones inyectadas server-side (no las genera el modelo). |
| Tipo III — Afirmación PORQUE Razón + opciones A-E | ✅ | Contraste corregido; opciones inyectadas. |
| Comportamental — Likert 1-5 con escala frecuencia/acuerdo | ✅ | |
| Hiper-personalización por cargo (`cargo_aspira`) | ✅ | H6 + H6.b — el orquestador recibe `contexto_usuario` real. |
| RAG — corpus pgvector (3.338 chunks ingestados) | ✅ | Voyage `voyage-3-large` 1024-d, threshold 0.45. |
| REGLA 4 — rechazo literal cuando no hay base | ✅ | Frase exacta de Directivas V4. |
| Cache LRU de preguntas (TTL 30 min) | ✅ | Batch de 5 + refill background. |
| Routing de modelos (Plan A: Haiku 4.5 en diagnóstico) | ✅ | 2.9× más rápido que Sonnet, 100 % pass-rate Zod. |
| Login Supabase (email + password) | ✅ | Tabs iniciar / crear / recuperar. |
| Recuperación de contraseña por correo | ✅ | `/login/restablecer` para crear nueva contraseña. |
| Dashboard post-login | ✅ | Con bucle diario auth-aware. |
| Bucle Diario (`/dashboard/entrenar`) | ✅ | 10 preguntas/día, modal bloqueante con cita en cada error. |

### 1.2. Lo que requiere configuración del usuario

| Variable | Estado |
|---|---|
| `VOYAGE_API_KEY` | ✅ real |
| `ANTHROPIC_API_KEY` | ✅ real |
| `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY` + `SERVICE_ROLE_KEY` | ✅ real |
| `TAVILY_API_KEY` | ⚠️ placeholder — REGLA 4 dispara cuando el corpus no cubre un tema. **Configurar antes de marketing.** |
| `TELEGRAM_BOT_TOKEN` | ⚠️ pendiente — bloquea Agente 2 (Motivador). |
| Migraciones SQL aplicadas | ✅ `0000_foundation_v3.sql`, `0001_corpus_legal_voyage.sql`, `0002_leads_anon_read.sql`. |
| Auth → URL Configuration en Supabase Dashboard | ⚠️ confirmar redirect URLs (`/login/restablecer`). |

### 1.3. Deuda técnica abierta (no bloquea beta, sí siguiente sprint)

1. Configurar Tavily real para cubrir temas fuera del corpus (jurisprudencia 2024-2026).
2. Agente 2 (Motivador Telegram) — wired al cronjob pero sin token de bot.
3. Agente 3 (Persuasor Resend) — wired pero requiere validación end-to-end con un lead de prueba.
4. Hard test del RAG (`scripts/hard-test-rag.mjs`) cableado en CI antes del merge a `main`.
5. Telemetría: log de top-1 sim de cada query del orquestador para detectar regresiones.

---

## 2. Cómo arrancar las pruebas reales

```bash
# 1. Variables de entorno
cp .env.local.example .env.local   # editar con keys reales

# 2. Instalar dependencias
npm install

# 3. Aplicar migraciones SQL en Supabase Dashboard (una sola vez)
#    SQL Editor → ejecutar en orden:
#    - supabase/migrations/0000_foundation_v3.sql
#    - supabase/migrations/0001_corpus_legal_voyage.sql
#    - supabase/migrations/0002_leads_anon_read.sql

# 4. Ingestar corpus legal (sólo si el conteo está en 0)
npm run ingest:corpus

# 5. Hard test del RAG antes de salir a producción
node scripts/hard-test-rag.mjs

# 6. Build + run
npm run build && npm run start
```

URLs de prueba en local:
- `http://localhost:3000` — landing pública.
- `http://localhost:3000/login` — auth.
- `http://localhost:3000/dashboard/entrenar` — bucle diario (post-auth).
- `http://localhost:3000/diagnostico/<lead_id>` — simulacro 40 preguntas.

---

## 3. KPIs a analizar durante la fase de pruebas reales

Diseñados para detectar fricción, validar valor y calibrar pricing antes de escalar pauta.

### 3.1. Funnel de adquisición (top of funnel)

| KPI | Meta beta | Cómo medir | Acción si rojo |
|---|---|---|---|
| **CTR del anuncio (Meta/Google)** | ≥ 1.5 % | UTMs + plataforma de ads | Iterar copy y creativo (ver §6 del Plan de Marketing). |
| **Conversión landing → form completado** | ≥ 25 % | `landing_view` ÷ `lead_created` | Reducir fricción del form (cuatro campos máx.). |
| **CPL (costo por lead)** | ≤ COP 8.000 | gasto Meta ÷ leads | Subir a CPL ≤ 12 K si el LTV lo soporta. |

### 3.2. Activación (mid funnel)

| KPI | Meta beta | Cómo medir | Acción si rojo |
|---|---|---|---|
| **% leads que inician diagnóstico** | ≥ 80 % | `lead_created` → `diagnostico_started` | Acelerar redirect post-form, eliminar pasos intermedios. |
| **% leads que completan ≥ 20 preguntas** | ≥ 50 % | `diagnostico_completed_partial` | Probar con 20 preguntas en vez de 40 (A/B test). |
| **% leads que completan las 40** | ≥ 35 % | `diagnostico_completed_full` | Detectar pregunta de drop-off; ajustar dificultad. |
| **Tiempo medio del diagnóstico** | 25-35 min | timer del simulacro | Si > 45 min → demasiada fricción cognitiva. |

### 3.3. Retención y producto

| KPI | Meta beta | Cómo medir | Acción si rojo |
|---|---|---|---|
| **D1 retention (vuelve al día siguiente)** | ≥ 40 % | sesiones únicas en `dashboard/entrenar` | Mejorar push de Telegram + email "tu primera pregunta de hoy". |
| **D7 retention** | ≥ 25 % | | Indicador de hábito SM-2; si baja, revisar dificultad y dolor del modal. |
| **D30 retention** | ≥ 15 % | | Predictor de conversión a paid. |
| **% del corpus consultado en sesión típica** | ≥ 8 chunks/sesión | logs de `buscarCorpusLegal` | Bajo = repetimos preguntas; ajustar diversidad de query. |
| **Latencia P95 del orquestador** | ≤ 15 s (Haiku) | Vercel Analytics | > 20 s = degrada UX; revisar cache hit rate. |
| **Cache hit rate del LRU** | ≥ 60 % a partir de Q5 | `_meta.cache_hit` | Si bajo, ajustar BATCH_SIZE o TTL. |

### 3.4. Calidad del contenido (anti-alucinación)

| KPI | Meta beta | Cómo medir | Acción si rojo |
|---|---|---|---|
| **% preguntas con `norma_relacionada` válida** | 100 % | regex `/Art\.|Ley|Decreto…/` | El schema Zod ya lo fuerza; si falla, log + alert. |
| **% rechazos REGLA 4** | ≤ 2 % | HTTP 503 ÷ requests | > 5 % = corpus o threshold mal calibrado. |
| **NPS de la cita normativa** | ≥ 40 | encuesta in-app post-Q10 | "¿La explicación te ayudó a entender?" |

### 3.5. Conversión a paid (bottom of funnel)

| KPI | Meta beta | Cómo medir | Acción si rojo |
|---|---|---|---|
| **% que ve el sumario y hace click "Activar plan"** | ≥ 30 % | sumario → `/checkout` | Recalibrar promesa de la pantalla de cierre (ver §7). |
| **% checkout → pago completado** | ≥ 40 % | `/checkout` → `payment_succeeded` | Probar 2-3 precios anclados. |
| **CR global (lead → pago)** | ≥ 4 % | conversiones ÷ leads | Benchmark EdTech LATAM: 2-6 %. |
| **CAC** | ≤ COP 80.000 | gasto ÷ pagos | Calcular con LTV a 6 y 12 meses. |
| **LTV / CAC** | ≥ 3× a 6 meses | | < 2× = no escalar pauta. |
| **Payback period** | ≤ 4 meses | gasto ÷ contribución mensual | > 6 meses = pauta en pausa. |

### 3.6. Cualitativos (no medibles en SQL pero accionables)

- **Top-3 quejas en soporte** — bucket por tema y semana.
- **Top-3 elogios espontáneos** — los repites en testimonials de la landing.
- **Clip favorito de Telegram** — lo que se reenvía orgánicamente entre aspirantes.

---

## 4. Cohorte beta sugerida

- **Tamaño:** 100-150 leads pagados o 500 leads gratuitos en 14 días.
- **Segmentación:** 60 % cargos profesionales (Procurador Judicial I/II, Profesional Universitario), 30 % técnicos, 10 % directivos.
- **Canales de captación:** TikTok orgánico (testimonios cortos) + Meta Ads (CBO frío con 3 creativos por persona) + grupos privados de Telegram/WhatsApp ya existentes.
- **Duración:** 4 semanas. Semana 1-2: pulir activación. Semana 3-4: cerrar primeras conversiones a paid.

---

## 5. Definición de éxito de la beta

Pasamos a "listo para escalar pauta" si al cierre de las 4 semanas:

1. ✅ % completion del diagnóstico ≥ 35 %.
2. ✅ D7 retention ≥ 25 %.
3. ✅ CR lead → pago ≥ 4 %.
4. ✅ NPS de la cita normativa ≥ 40.
5. ✅ ≤ 2 % rechazos REGLA 4 (es decir, el RAG cubre la mayoría de queries).

Si fallan 2 o más → iteramos producto antes de escalar (no quemamos pauta).

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Tavily placeholder → REGLA 4 inesperado | Media | Alto | Configurar Tavily real ANTES de pauta. |
| Modelo Haiku se degrada en algún cargo | Baja | Medio | Fallback automático a Sonnet ya implementado (escalación si Haiku < 3/5). |
| Aspirantes piden ejemplos de la convocatoria 2024 que no están en el corpus | Alta | Medio | Re-ingesta jurisprudencia reciente; fallback Tavily activo. |
| Costo de Voyage embeddings se dispara | Media | Medio | Caching de embeddings de queries repetidas (próximo sprint). |
| Cuotas de Anthropic | Baja | Alto | Plan A ya optimiza tokens 60 %; rate limit alarmas en Vercel. |

Archivo:

- [Reporte_Diagnostico_RAG_2026-04.md](computer:///sessions/festive-trusting-fermat/mnt/meritoproV3/Reporte_Diagnostico_RAG_2026-04.md) — informe del fix RAG.
- [hard-test-rag.mjs](computer:///sessions/festive-trusting-fermat/mnt/meritoproV3/scripts/hard-test-rag.mjs) — banco de pruebas reproducible.
- [smoke-orquestador.mjs](computer:///sessions/festive-trusting-fermat/mnt/meritoproV3/scripts/smoke-orquestador.mjs) — smoke test sin keys reales.
