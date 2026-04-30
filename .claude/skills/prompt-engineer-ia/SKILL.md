---
name: prompt-engineer-ia
description: Skill del Prompt Engineer de MéritoPro. Activa SIEMPRE que la tarea implique los agentes IA del producto (Tutor/Orquestador, Motivador Telegram, Persuasor Remarketing), el Anthropic SDK, system prompts, prompt caching, herramientas (tool_use), RAG con pgvector, embeddings, generación estricta de preguntas Tipo I/II/III/Comportamental con norma obligatoria, feedback normativo con cita legal, o copys de remarketing. Usar también cuando el usuario diga "IA", "Claude", "prompt", "agente", "tutor virtual", "generar pregunta", "webhook Telegram", "remarketing email", "explicación de la norma" — incluso sin mencionar "prompt". Garantiza prompt caching >80%, salida estructurada vía tools con JSON Schema, y que toda pregunta lleve `norma_relacionada` (ley + artículo + año).
---

# Prompt Engineering IA — MéritoPro

**3 agentes:** Tutor (in-app), Motivador (Telegram + email), Persuasor (email remarketing). Modelo: Claude 3.5 Sonnet.

## 7 reglas innegociables
1. **Prompt caching SIEMPRE** en el system block, objetivo cache hit >80%.
2. **`DiagnosticoUsuario` va en el `user` message**, no en el system (el system es cacheable y estable).
3. **Salida estructurada con `tool_use`** + `tool_choice` forzado. Nada de regex sobre texto.
4. **`norma_relacionada` requerida** en toda pregunta: `"Ley X de AAAA, Art. N"`.
5. **Temperature 0.2 para evaluar**, **0.7 para generar**.
6. **`max_tokens` acotado:** pregunta ≤1500, explicación ≤800, Telegram ≤400, email ≤1200.
7. **Idempotencia en crons:** unique index `(user_id, tipo, fecha)` en `eventos_remarketing`.

## System prompt del Tutor — identidad base
Magíster en Pedagogía + Especialista en derecho disciplinario PGN. Frases cortas y densas. Ejemplos de oficina pública. Al corregir: cita ley + número + año + artículo. Reconoce esfuerzo sin condescender.

## Tool JSON Schema para generar preguntas
`emitir_pregunta` con `input_schema` que fuerza: `id`, `modulo`, `tema`, `estructura` (oneOf TipoI/II/III/Comportamental con las propiedades estrictas de CLAUDE.md §5), `explicacion` (min 30 chars), `norma_relacionada` (pattern `^(Ley|Decreto|Constitución|Acuerdo|CPACA|Resolución).*(19|20)\d{2}.*`). Validar con Zod después y reintentar si falla.

## RAG
Tabla `corpus_legal(id, ley, articulo, anio, texto, embedding vector(1024))`. Embeddings con `voyage-3-large` (Voyage AI, ecosistema Anthropic). Query `<=>` con umbral coseno > 0.72, top 6. Los chunks van cacheables si >1024 tokens.

## Agente 2 — flujo Telegram inbound
msg → `telegram_chat_id` → `user_id` → última pregunta fallada SM-2 → Claude evalúa lenguaje natural → respuesta <280 chars con norma → update `sm2_repetition`.

## Agente 3 — plantilla de remarketing
Aversión a la pérdida basada en brecha real (no clickbait). Menciona módulo débil, promedio de quienes aprueban, cargo al que aspira, ROI explícito ($197.000 vs primer salario).

## Coordinación
- Implementación Next.js / Supabase → `fullstack-nextjs-supabase`.
- Evals de regresión y cost guardrails → `qa-testing-devops`.

## Entrega
Prompts versionados (`SYSTEM_TUTOR_V{n}`) · tools/schemas · evals ejecutadas (mín 10 generaciones) · costo/llamada estimado · envs requeridas.
