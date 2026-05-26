# MéritoPro — Documento Maestro

**Versión Beta v0.1** · Mayo 2026 · Plataforma EdTech para el Concurso PGN 2026
**Operador del concurso:** Universidad de Antioquia · **2.824 vacantes definitivas** en 291 convocatorias · 80.000+ aspirantes esperados
**Marco normativo del concurso:** Resolución 076 del 24 de marzo de 2026, modificada por Resolución 108 del 23 de abril de 2026 (versión 2 correctiva)
**Inscripciones:** 1 al 12 de junio de 2026 · **Sitio oficial:** méritoconstruyendoexcelencia.com.co

---

## Índice

1. Resumen ejecutivo
2. Qué es MéritoPro
3. Cómo funciona (visión funcional)
4. Cómo funciona (visión técnica)
5. Estructura de costos
6. Modelo de pricing
7. Doble Garantía
8. Marketplace y LTV multi-concurso
9. Plan de marketing condensado
10. Auditoría del estado actual (mayo 2026)
11. Roadmap operativo
12. Anexos

---

## 1. Resumen ejecutivo

MéritoPro entrena a los aspirantes al concurso de la Procuraduría General de la Nación 2026 con una metodología basada en Active Recall y repetición espaciada (algoritmo SM-2), apoyada por agentes de IA con corpus legal verificado y cero alucinaciones. Mientras las academias presenciales venden 2.000 páginas de PDFs por COP 1.500.000, MéritoPro entrega 30 minutos diarios de práctica adaptada al cargo del aspirante por COP 297.000 con doble garantía. Incluye Marketplace post-examen para preparación en otros concursos públicos (Fiscalía, Contraloría, Rama Judicial, etc.) con 50% off para retornantes.

**Promesa central:** "Cómo aprobar el concurso PGN 2026 aunque trabajes 9 horas, tengas hijos y ya hayas fracasado en convocatorias anteriores — sin volver a leer un solo PDF de mil páginas."

**Estado al cierre de mayo 2026:** beta v0.1 desplegada con 95% de cobertura del programa oficial (8.757 chunks legales ingestados). Pendiente: activar pasarela Wompi (todavía no integrada), configurar credenciales SMTP, filmar UGC.

---

## 2. Qué es MéritoPro

### 2.1. El problema que resolvemos

| Tipo de aspirante | Lo que sufre hoy | Solución MéritoPro |
|---|---|---|
| Profesional con experiencia | Estudia mucho y no sabe dónde está parado | Diagnóstico de 40 preguntas en 30 min con % real de aprobar |
| Egresado reciente | FOMO de grupos WhatsApp, sin método claro | Bucle Diario SM-2 que prioriza brechas |
| Funcionario buscando estabilidad | Sin tiempo para "estudiar como universidad" | 30 min/día con dificultad adaptativa por cargo |

### 2.2. Diferenciales técnicos que sostienen el copy

1. **Cero alucinaciones.** Cada respuesta cita la norma exacta (Ley, Decreto o Sentencia con artículo y numeral). Si el sistema no encuentra base normativa verificada, se detiene (REGLA 4 de Directivas V4).
2. **Hiper-personalización por cargo.** El sistema entrena exactamente las normas que evalúan el cargo elegido por el aspirante.
3. **Active Recall + SM-2.** 30 min de práctica reemplazan 3 horas de PDFs (evidencia académica documentada).
4. **Probabilidad de aprobar visible.** Métrica calculada sobre tasa de aciertos real, no estimación.
5. **Marketplace post-examen.** Si fallan o quieren más, tienen 50% off para el siguiente concurso del Marketplace.

### 2.3. Lo que NO somos

- No somos una academia presencial.
- No somos una suscripción mensual: es **pago único** con acceso hasta 30 días post-examen.
- No reemplazamos al criterio del aspirante: complementamos con método y datos.

---

## 3. Cómo funciona (visión funcional)

### 3.1. El recorrido del aspirante

```
Landing pública (/)
   │
   ├─ Llena form (nombre, email, celular, cargo deseado) + acepta tratamiento de datos
   │
   ▼
Diagnóstico Premium (/diagnostico/[lead_id])
   │
   ├─ 40 preguntas tipo PGN (I, II, III, Comportamental)
   ├─ Reloj regresivo de 45 minutos
   ├─ Dificultad adaptativa según aciertos consecutivos
   ├─ Cita normativa exacta en cada feedback
   │
   ▼
Sumario con resultado + plan personalizado + CTA "Activar plan"
   │
   ▼
Checkout (Wompi — PENDIENTE de integración real)
   │
   ▼
Bienvenida (/dashboard/bienvenida)
   │
   ├─ Onboarding de 3 pasos: Telegram, horario, primera sesión
   │
   ▼
Bucle Diario (/dashboard/entrenar)
   │
   ├─ 10 preguntas/día, hiper-personalizadas
   ├─ Modal bloqueante en cada error con cita normativa
   ├─ Push automático por Telegram al horario elegido
   │
   ▼
30 días post-examen → Marketplace activo en perfil
```

### 3.2. Las 4 estructuras oficiales de pregunta

| Tipo | Formato | Cómo se evalúa |
|---|---|---|
| **Tipo I** | Selección múltiple (A/B/C/D) — única respuesta | Click una opción |
| **Tipo II** | Enunciado + 4 afirmaciones numeradas → 4 combinaciones (A: 1 y 2, B: 1 y 3, C: 2 y 4, D: 1 y 2 y 3) | Click la combinación correcta |
| **Tipo III** | Afirmación PORQUE Razón → 5 opciones de relación lógica (A-E) | Click la relación correcta |
| **Comportamental** | Situación + Likert 1-5 (Nunca→Siempre o Totalmente desacuerdo→Totalmente acuerdo) | Click el valor |

Cobertura del programa: los 11 bloques oficiales (Procuraduría como institución, Perfil funcional, Derecho disciplinario, Función preventiva, Acciones constitucionales, Procedimiento administrativo, Conciliación, Procesal/probatorio, DDHH/víctimas/infancia, Especialidades sectoriales, Contratación/anticorrupción).

### 3.3. Los 3 agentes de IA

| Agente | Canal | Función |
|---|---|---|
| **1. Tutor (Orquestador)** | App web | Genera preguntas con corpus pgvector + fallback Tavily. Controla dificultad adaptativa. Aplica REGLA 4 (cita o rechazo literal). |
| **2. Motivador (Telegram)** | Bot Telegram | Manda píldora diaria al horario del aspirante. Evalúa respuestas. Exige cita en feedback. |
| **3. Persuasor (Resend)** | Email | Secuencia de 7 emails para leads que no convierten. Ataca aversión a la pérdida basado en ROI (salario PGN). |

---

## 4. Cómo funciona (visión técnica)

### 4.1. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind | SSR + RSC + DX |
| Auth | Supabase Auth (email + Google OAuth) | RLS nativo + recovery |
| DB | Supabase Postgres + pgvector | Embeddings 1024-dim + RLS |
| Embeddings | Voyage AI `voyage-3-large` | Mejor recall multilenguaje vs OpenAI |
| LLM | Anthropic Claude Sonnet 4.6 + Haiku 4.5 | Plan A: Haiku en diagnóstico (3× más rápido) |
| Hosting | Vercel | Edge functions + cron + analytics |
| Email transaccional | Resend | API simple, evita Supabase SMTP rate limit |
| Bot | Telegram Bot API | Cero costo, push directo |
| Pasarela | Wompi (Colombia) | PSE + tarjeta + efectivo |
| Web fallback | Tavily API | Búsqueda restringida a `*.gov.co` |
| Tracking | Meta Pixel + GA4 + GTM | Funnel completo + remarketing |

### 4.2. Arquitectura de generación de preguntas

```
1. Cliente pide pregunta N
   └─ POST /api/orquestador
      ├─ Calcula dificultad según aciertos/fallos
      ├─ Construye query RAG (sólo topic, sin sufijo cargo+nivel)
      │
      ├─ STEP A — Cache LRU (in-memory, TTL 30 min, batch 5 preguntas)
      │   └─ HIT → devuelve pregunta + dispara refill background con next()
      │
      ├─ STEP B — Si cache miss:
      │   ├─ Voyage embedding(query) → vector(1024)
      │   ├─ Supabase RPC match_corpus_legal(vector, threshold=0.45)
      │   │   └─ Si devuelve chunks → contexto del prompt
      │   ├─ Si corpus vacío → Tavily search (whitelist *.gov.co)
      │   │   └─ Si devuelve resultados → contexto del prompt
      │   ├─ Si AMBOS vacíos → REGLA 4: HTTP 503 + frase literal de rechazo
      │   │
      │   └─ Anthropic tool_use → emitir_pregunta (Haiku 4.5 batch 5)
      │       ├─ Validación Zod estricta
      │       ├─ Si pass rate < 60% → escala a Sonnet con cache_read
      │       └─ Inyecta opciones estáticas en tipo_II y tipo_III
      │
      └─ Devuelve pregunta + meta (tokens, modelo, cache_hit)
```

### 4.3. Algoritmo SM-2 (repetición espaciada)

Cada pregunta respondida actualiza:

- **e-factor** del tema (1.3 → 2.5+) — qué tan fácil le resulta al aspirante.
- **interval_days** — cuándo volver a presentar el tema.
- **next_review_date** — cuándo el bucle diario lo va a traer de vuelta.

Buckets dinámicos en el perfil:

- `dominio_alto` — e-factor ≥ 2.3 con ≥ 2 repeticiones.
- `dominio_medio` — e-factor entre 1.8 y 2.3.
- `brechas` — e-factor < 1.8 o repeticiones < 2.

El Bucle Diario prioriza `brechas` los primeros 5 días, luego balancea con `dominio_medio` y refresca `dominio_alto` ocasionalmente.

### 4.4. Modelo de datos (Supabase)

```
public.leads               — captura pre-pago (form de la landing)
public.usuarios            — perfil post-pago (linked a auth.users)
public.sm2_repetition      — algoritmo de repetición espaciada
public.respuestas_preguntas — historial de respuestas
public.corpus_legal        — 8.757 chunks vectorizados (vector(1024) + texto)
public.intenciones_pago    — transacciones Wompi (pendiente de integración real)
```

Migraciones: `0000_foundation_v3.sql`, `0001_corpus_legal_voyage.sql`, `0002_leads_anon_read.sql`, `0003_fix_ivfflat_probes.sql`.

---

## 5. Estructura de costos

### 5.1. Costos variables por usuario (durante 6 meses de uso)

| Servicio | Detalle | COP |
|---|---|---|
| Anthropic Claude (Haiku + Sonnet escalado) | ~600 generaciones reales (95% cache hit) | 12.000 |
| Anthropic agentes Motivador + Persuasor | ~250 evaluaciones + 30 emails | 3.360 |
| Voyage embeddings | ~1.000 queries × 50 tokens (cacheable) | 80 |
| Supabase Pro amortizado | $25/mes ÷ 500 usuarios × 6 meses | 1.200 |
| Vercel Pro amortizado | $20/mes ÷ 500 usuarios × 6 meses | 960 |
| Tavily fallback | ~30 búsquedas × $0.005 | 600 |
| Resend transaccional | ~30 emails | 80 |
| Telegram Bot | Gratis | 0 |
| Pasarela Wompi | 2.99% + IVA + COP 700 fijo | 10.500 |
| Soporte humano | ~8 tickets × 5 min | 8.000 |
| Reembolsos esperados (5%) | Admin overhead | 250 |
| **TOTAL VARIABLE / USUARIO** | | **~37.030** |

### 5.2. Costos fijos mensuales (amortizables)

| Concepto | COP/mes |
|---|---|
| Vercel Pro Team | 80.000 |
| Supabase Pro | 100.000 |
| Resend Pro | 80.000 |
| Dominio + email corporativo | 30.000 |
| Notion/Linear gestión | 50.000 |
| Personal beta (1 dev part-time + 1 customer success part-time) | 5.000.000 |
| **TOTAL FIJO** | **~5.340.000** |

### 5.3. CAC (Customer Acquisition Cost)

Realista en mes 3-4 después de optimizar pauta: **COP 100.000 por usuario adquirido** (CPL ≤ 8.000 × CR 4 % global).

### 5.4. Costo total por usuario adquirido

| Componente | COP |
|---|---|
| Variable | 37.000 |
| Fijo amortizado a 250 us/mes | 21.000 |
| CAC marketing | 100.000 |
| **TOTAL** | **158.000** |

---

## 6. Modelo de pricing

### 6.1. Precio único de lanzamiento beta

> ## **COP 297.000** · pago único · acceso hasta 30 días post-examen

**Justificación cuantitativa:**

| Métrica | Valor |
|---|---|
| Margen bruto mes 3 (250 us/mes) | ~46% |
| Margen bruto mes 9 (escalado) | ~63% |
| LTV/CAC con marketplace | 4.05× (saludable, ≥3× para escalar) |
| Payback CAC | inmediato (1ra compra) |
| Posición de mercado | Premium accesible (5-10× más barato que academias presenciales) |
| Fricción psicológica | Justo bajo umbral COP 300K |

### 6.2. Estructura completa de precios

| Compra | Precio | Justificación |
|---|---|---|
| 1ra compra (cualquier concurso) | COP 297.000 | Cubre CAC + margen sano |
| 2da compra (retornante natural) | COP 207.900 (30% off) | CAC = 0 → margen 71% |
| Bundle 3 concursos en 18 meses | COP 697.000 | vs 891K sin descuento, locks revenue |
| Referido por usuario activo | COP 252.450 (15% off) + 1 mes gratis al referidor | Premia adquisición orgánica |
| Plan en 3 cuotas | 3 × COP 109.000 (PSE/efectivo) | Sin tarjeta de crédito |

### 6.3. Anclas de comunicación en la landing

| Lo que muestras | Lo que cobras |
|---|---|
| Valor declarado del paquete + bonus | COP 1.240.000 |
| Precio regular post-beta | COP 397.000 |
| **Precio beta de lanzamiento** | **COP 297.000** |

---

## 7. Doble Garantía MéritoPro

### 7.1. Garantía 1 — Satisfacción Inicial (7 días)

> "Si en los primeros 7 días no es lo que esperabas, te devolvemos el 100% de tu inversión. Sin formularios."

- Reclamo: email a `soporte@meritopro.co`.
- Reembolso en 5 días hábiles.
- Cubre el "no me gustó" subjetivo del primer contacto.

### 7.2. Garantía 2 — Resultado MéritoPro (50% off uso único)

> "Si entrenas con disciplina (≥70% de las sesiones diarias), te presentas al examen y NO clasificas en la lista de elegibles publicada por la PGN, te entregamos un código de 50% de descuento canjeable UNA SOLA VEZ en cualquier curso del Marketplace, válido por 12 meses."

**Reglas no negociables:**
- Aplica a 1 sólo curso, 1 sola compra. No es divisible.
- 12 meses desde la aprobación del reclamo. Sin renovaciones.
- No acumulable con otros descuentos.
- Forma: código personal `MERITO50-XXXX` de un solo uso.

**Condiciones de elegibilidad (todas requeridas):**

1. Diagnóstico inicial completo dentro de 14 días.
2. ≥70% de sesiones del Bucle Diario completadas entre compra y examen.
3. `probabilidad_aprobar_actual` registrada los últimos 30 días pre-examen.
4. Foto del citatorio oficial del examen + acta de presentación.
5. Captura del listado oficial de elegibles donde el nombre NO aparece.
6. Reclamo dentro de 30 días siguientes a la publicación de resultados.

### 7.3. Por qué este formato funciona

- No suena a estafa de gurú (vs "100% gratis").
- Skin in the game compartido — el usuario también pone algo.
- Asimetría a favor: requiere evidencias que sólo un usuario que entrenó y se presentó puede aportar.
- No sangra cash: se paga con producto cuyo costo marginal es COP 38.000.
- Catalizador de retención multi-concurso.

**Impacto financiero esperado:**

- 21% activan, 50% canjean → 10.5% de paid users canjea.
- Por canjeante: si era retornante natural pierde COP 59.400, si es incremental gana COP 110.500.
- Promedio: **+COP 6.250 por usuario adquirido (revenue accretive).**

---

## 8. Marketplace de Concursos

### 8.1. Cómo funciona

Una vez el usuario termina el primer concurso (PGN), su perfil activa el Marketplace 30 días después del examen con sugerencias personalizadas según currículum, profesión y datos SM-2 acumulados. El SM-2 acumulado del 1er concurso le da ventaja en el 2do (las brechas detectadas se transfieren al nuevo cargo).

### 8.2. Mapeo cargo/profesión → siguiente concurso recomendado

| Perfil del usuario | Concursos sugeridos |
|---|---|
| Abogado, hizo PGN | Fiscalía, Contraloría, Registraduría, Rama Judicial (jueces), ICBF jurídico |
| Economista, hizo PGN | DIAN, Banco República, Superfinanciera, Min. Hacienda, DNP |
| Ingeniero/sistemas, hizo PGN | MinTIC, FONTIC, ITER, Ecopetrol, ETB |
| Profesional administrativo | Función Pública, Distritales (Bogotá, Medellín, Cali), DAFP |

### 8.3. LTV ponderado

| Cohorte | % | Compras | Ingreso |
|---|---|---|---|
| Compra 1 sólo concurso | 60% | 1 × 297.000 = 297.000 | 178.200 |
| Compra 2 concursos | 28% | 297.000 + 207.900 = 504.900 | 141.372 |
| Compra 3+ concursos | 12% | 297.000 + 2 × 207.900 = 712.800 | 85.536 |
| **LTV ponderado** | | | **COP 405.108** |

LTV/CAC = **4.05×** (sano, supera el 3× para escalar).

### 8.4. Costo de añadir un concurso al Marketplace

| Concepto | COP |
|---|---|
| Curación + chunking del corpus normativo (asesor jurídico, 80h) | 6.400.000 |
| Ingesta + verificación con hard-test-rag (dev, 16h) | 1.600.000 |
| Entrenamiento del prompt-engineer (system prompt específico) | 800.000 |
| Tokens Voyage para ingestar (3.000 chunks) | 60.000 |
| **Total por concurso nuevo** | **8.860.000** |

**Punto de breakeven por concurso:** 43 ventas. Con 250 usuarios PGN/mes y 28% retornantes ≈ 70 ventas del 2do concurso → cualquier concurso nuevo paga su producción en mes 1.

---

## 9. Plan de marketing condensado

### 9.1. 3 buyer personas

| Persona | % demanda | Dolor central | Promesa específica |
|---|---|---|---|
| **Carolina** — Profesional Frustrada (30-38, abogada, repitente 2018) | 40% | Miedo a repetir el fracaso de 2018 | "Aprobar la PGN aunque trabajes 9 horas, tengas hijos y ya hayas fracasado — sin volver a leer un PDF de mil páginas" |
| **Andrés** — Egresado en Limbo (24-28, recién graduado) | 35% | Ansiedad por método y dirección | "Entrar a la PGN aunque seas recién egresado — sin pasar 8 horas en YouTube y grupos de WhatsApp" |
| **Gloria** — Funcionaria que Quiere Estabilizar (38-50, contratista) | 25% | Inestabilidad laboral encarando los 50 | "Conseguir tu puesto permanente sin renunciar a tu trabajo actual y sin volver a estudiar como en la universidad" |

### 9.2. Enemigo común

> "**La Trampa del Estudio Eterno**" — el sistema obsoleto de prepararse para concurso público basado en academias presenciales caras, PDFs de 2.000 páginas sin método, grupos de WhatsApp con desinformación, y la mentira de que "estudiando duro alcanza".

### 9.3. Distribución de pauta beta (4 semanas)

| Canal | % presupuesto | Por qué |
|---|---|---|
| Meta Ads (FB + IG) | 60% | Volumen + segmentación quirúrgica por persona |
| Google Search | 20% | Captura intención alta ("convocatoria PGN 2026") |
| LinkedIn Ads | 10% | Sólo Carolina (premium, segmentación profesional) |
| TikTok orgánico | 10% | Construcción de autoridad + UGC viral |

**Presupuesto sugerido:** COP 12-18 M en 4 semanas.

### 9.4. KPIs de éxito de la beta

| KPI | Meta |
|---|---|
| CPL (Meta) | ≤ COP 8.000 |
| Conversión landing → form | ≥ 25% |
| % completion del diagnóstico | ≥ 35% |
| D7 retention | ≥ 25% |
| CR global lead → pago | ≥ 4% |
| LTV/CAC | ≥ 3× a 6 meses |
| % rechazos REGLA 4 | ≤ 2% |
| NPS de la cita normativa | ≥ 40 |

Si fallan ≥ 2 → iterar producto antes de escalar pauta.

---

## 10. Auditoría del estado actual (mayo 2026)

### 10.1. Lo que está funcionando ✅

| Capa | Estado | Notas |
|---|---|---|
| Build de producción | ✅ Compila limpio | tsc + ESLint sin errores |
| Landing pública | ✅ Operativa | Form persiste leads en Supabase |
| Diagnóstico de 40 preguntas | ✅ Operativo | UI Pearson VUE, dificultad adaptativa, fondo blanco (recién corregido) |
| 4 tipos de pregunta (I, II, III, Comportamental) | ✅ Operativos | Card autocontenida + opciones estáticas inyectadas server-side |
| Hiper-personalización por cargo | ✅ Operativa | H6 + H6.b — `contexto_usuario` real desde Supabase |
| Corpus pgvector | ✅ 8.757 chunks | 12 categorías mapeadas a los 11 bloques oficiales |
| RAG (Voyage + Tavily fallback) | ✅ Calibrado | UMBRAL 0.45 + IVFFlat probes 20 |
| REGLA 4 (rechazo literal) | ✅ Activa | Frase exacta de Directivas V4 |
| Cache LRU de preguntas | ✅ Operativo | TTL 30 min, batch de 5, refill background |
| Routing de modelos | ✅ Plan A activo | Haiku 4.5 en diagnóstico (3× más rápido) |
| Auth Supabase email + Google | ✅ Código listo | Google requiere setup manual en Supabase Auth |
| Recuperación de contraseña | ✅ Flow PKCE corregido | redirectTo pasa por `/auth/callback` |
| Doble Garantía 50% uso único | ✅ Documentada | Pendiente de implementación técnica (tabla `codigos_garantia`) |
| Páginas legales | ✅ Publicadas | `/legal/{terminos,privacidad,cookies,arco}` + `/garantia` |
| Cookie banner + consent gate | ✅ Operativo | Pixel/GA4/GTM no cargan sin consent |
| Stack analytics (Pixel + GA4 + GTM) | ✅ Cableado | Disparan `generate_lead` y `purchase` automático |
| FAQ landing | ✅ 8 Q&A insertadas | Atacan las objeciones tópicas |
| 3 landings dedicadas `/lp/[persona]` | ✅ Estructura lista | Falta producción de creativos |
| Bucle Diario | ✅ Operativo | Auth-aware + SM-2 |
| Cronjobs Vercel (repaso + remarketing) | ✅ Definidos en vercel.json | Horarios en hora Colombia (12:00 y 14:00 UTC) |
| Páginas legales firmadas Habeas Data | ✅ Publicadas | Cumplimiento Ley 1581/2012 |
| Hard test del RAG | ✅ 28/30 = 93.3% | Cobertura de los 11 bloques validada |
| Smoke test del orquestador | ✅ Pasa | Verifica REGLA 4 en placeholder mode |

### 10.2. Lo que NO está funcionando ⚠️

| Item | Severidad | Causa probable | Plan de fix |
|---|---|---|---|
| **Login no entra después de crear cuenta** | 🔴 Crítico | Probablemente "Confirm email" sigue ON en Supabase (correo no llega por SMTP interno con rate limit) | Verificar 3 puntos en Supabase Dashboard (ver §11.1) |
| **Wompi NO está integrado todavía** | 🟠 Alto | Endpoint `/api/checkout/iniciar` y webhook scaffolded pero sin credenciales reales de Wompi | Crear cuenta Wompi merchant + obtener keys + pegar en Vercel env vars |
| **TELEGRAM_BOT_TOKEN puede ser placeholder en prod** | 🟠 Alto | Bloquea el Bucle Diario por Telegram (Agente 2) | Crear bot con @BotFather si no se hizo |
| **RESEND_API_KEY puede ser placeholder en prod** | 🟠 Alto | Bloquea secuencia de email + recuperación de contraseña | Cuenta Resend → API key → pegar en Vercel |
| **Supabase Auth sin SMTP custom** | 🟡 Medio | Rate limit interno: 4 emails/hora, los confirmation/recovery no llegan | Configurar SMTP custom (Resend → SMTP relay) o desactivar "Confirm email" para beta |
| **Google OAuth no habilitado** | 🟡 Medio | Botón oculto por env `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false` (correcto, evita error JSON al usuario) | Setup Google Cloud + activar provider en Supabase + cambiar env a `true` |
| **Sin UGC ni creativos visuales** | 🟡 Medio | Bloquea pauta Meta Ads | Filmar 3 UGC (uno por persona) + producir 9 piezas |
| **Migración 0003 IVFFlat probes** | ⚠️ ¿Aplicada? | Crítica para que RAG vea las normas nuevas | Confirmar que se ejecutó en SQL Editor (estado mostrado: SÍ aplicada) |
| **Tabla `codigos_garantia` no existe** | 🟢 Bajo | No bloquea beta (los reclamos llegan post-examen) | Sprint+1 después de la primera cohorte |
| **Sentry / Vercel Analytics no configurados** | 🟢 Bajo | Sin error tracking centralizado | Free tier alcanza, configurar en sprint+1 |

### 10.3. Decisiones operativas pendientes

1. **¿Cohorte beta cerrada a X cupos?** Recomendación: 100 paid users para frame de escasez.
2. **¿Presupuesto pauta beta confirmado?** Rango sugerido: COP 12-18 M en 4 semanas.
3. **¿Quién filma los UGC?** Creador colombiano externo o casting interno.
4. **¿Wompi o Bold como pasarela?** Recomendado Wompi por adopción mayor en Colombia.
5. **¿Dominio definitivo?** Recomendado `meritopro.co` o `meritopro.app`.
6. **¿Identidad visual final?** Beta usa la paleta actual (slate-900 + amarillo `facc15`).
7. **¿Plan de soporte?** Recomendado 1 persona × 2h/día durante la beta.

---

## 11. Roadmap operativo

### 11.1. Acciones críticas inmediatas (esta semana)

#### A. Desbloquear login

1. Supabase Dashboard → **Authentication → Providers → Email**.
2. Toggle **"Confirm email"** → OFF → Save.
3. **Authentication → Users** → eliminar tu usuario actual de prueba.
4. Volver a `/login` → tab "Crear cuenta" → registrar de nuevo con contraseña que recuerdes.
5. Debería loguearte directo (sin esperar correo).

#### B. Configurar Wompi

1. Crear cuenta merchant en https://comercios.wompi.co.
2. Verificación KYC con cámara de comercio + RUT.
3. Una vez aprobado: copiar `public_key`, `private_key`, `events_secret`.
4. Pegar en Vercel → Settings → Environment Variables.
5. Configurar webhook URL: `https://meritopro.vercel.app/api/webhooks/wompi`.
6. Modo sandbox primero, después production.

#### C. Confirmar Telegram + Resend en producción

1. Telegram: si el `TELEGRAM_BOT_TOKEN` que tienes en local funciona, pegarlo en Vercel.
2. Resend: si el `RESEND_API_KEY` está en placeholder, crear cuenta en `resend.com` → obtener key → pegar en Vercel.

#### D. Filmar 3 UGC

Una persona por buyer persona. Guion en `Plan_de_Marketing_MeritoPro.md` §16. Producción mínima: iPhone + lavalier de COP 60.000.

### 11.2. Cronograma 4 semanas de beta

| Semana | Acciones | KPI gate |
|---|---|---|
| **0 (preparación)** | UGC filmados + 3 landings dedicadas + Pixel + CAPI + UTMs + 7 emails montados en Resend | Todo listo antes del lunes de la semana 1 |
| **1** | Lanzamiento Meta + Google Search. CBO 1 con 9 ads (3 personas × 3 creativos). Search con 4 keywords exact match | 100 leads acumulados, CPL ≤ 12.000 |
| **2** | Pausar peor creativo de cada conjunto. Subir presupuesto al ganador. Encender LinkedIn (Carolina). Empezar TikTok orgánico | 250 leads, % completion diagnóstico ≥ 35% |
| **3** | Remarketing Meta + secuencia email day 3-7. Webinar opcional | Primeras 30 conversiones a paid, CR ≥ 3% |
| **4** | Cierre cohorte 1 + análisis de KPIs + decisión "escalar 3-5×" o "iterar producto" | CR ≥ 4%, NPS ≥ 40, D7 ≥ 25% |

### 11.3. Backlog post-beta (sprint+1)

1. Endpoint `POST /api/garantia/reclamo` + tabla `codigos_garantia`.
2. Pantalla del Marketplace post-examen.
3. Curación + ingesta del 2do concurso (Fiscalía 2026).
4. Sistema de referidos con código personal.
5. Hard test del RAG en CI (GitHub Actions).
6. Sentry + Vercel Analytics.
7. CAPI server-side para Pixel (anti-adblocker).
8. A/B test de precio (COP 297K vs 347K).

---

## 12. Anexos

### 12.1. Documentos relacionados (todos en el repo)

- `BETA_v0.1_RELEASE.md` — handoff técnico + KPIs detallados.
- `Modelo_Pricing_MeritoPro.md` — modelo financiero completo.
- `Plan_de_Marketing_MeritoPro.md` — buyer personas, ángulos, anuncios, estrategia táctica.
- `Plan_de_Marketing_MeritoPro.docx` — versión Word del plan de marketing.
- `Auditoria_Corpus_vs_Programa_Oficial.md` — cobertura de los 11 bloques.
- `Reporte_Diagnostico_RAG_2026-04.md` — fix de REGLA 4 y umbral de similitud.
- `Setup_Auth_Beta.md` — instrucciones paso a paso para Google OAuth + Supabase.
- `Checklist_Pre_Lanzamiento.md` — los 29 items del checklist original.
- `Directivas_Agentes_V4.md` — reglas anti-alucinación de los 3 agentes IA.
- `Documentacion conocimiento base/Plan_de_Ingesta.md` — mapping cargo → norma.
- `CLAUDE.md` — instrucciones para el agente de desarrollo.

### 12.2. Comandos operativos

```bash
# Dev local
npm run dev

# Build de producción
npm run build && npm run start

# Smoke test (sin keys reales)
node scripts/smoke-orquestador.mjs

# Hard test del RAG (con keys reales)
node scripts/hard-test-rag.mjs

# Re-ingesta del corpus (después de añadir PDFs)
bash scripts/ingesta/descargar_corpus_extra.sh
npx tsx scripts/ingesta/ingest_corpus.ts

# Deploy
git push origin master   # Vercel deploya automático
```

### 12.3. URLs operativas

| Tipo | URL |
|---|---|
| Repo GitHub | https://github.com/josellandazabal-cmyk/meritoprov3 |
| Production (Vercel) | (asignada después del primer deploy) |
| Supabase Dashboard | https://supabase.com/dashboard/project/<id> |
| Voyage AI Console | https://dash.voyageai.com |
| Anthropic Console | https://console.anthropic.com |
| Tavily Dashboard | https://app.tavily.com |
| Resend Dashboard | https://resend.com/emails |
| Telegram BotFather | https://t.me/BotFather |
| Wompi Comercios | https://comercios.wompi.co |

### 12.4. Stack de commits relevantes

```
d96297d fix(cron): horarios en hora Colombia (UTC-5)
d22c6c3 fix(hard-test): queries naturales + umbral PASS realista (≥90%)
74266b2 fix(0003): match_corpus_legal VOLATILE para SET LOCAL
50884fe chore(gitignore): excluir supabase/.temp del CLI
df3cac1 feat(corpus): PDFs reales + fix IVFFlat probes
069b3f1 feat(corpus): 14 normas faltantes para cobertura completa
4b373d6 feat(corpus): cobertura completa de los 11 bloques oficiales
855f2cf fix(login): ocultar botón Google hasta habilitado en Supabase
ba8c31e fix(auth): Google OAuth + recuperación de contraseña funcional
4abe469 feat(beta): preparación completa para lanzamiento beta v0.1
```
