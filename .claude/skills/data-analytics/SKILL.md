---
name: data-analytics
description: Skill del Data Lead de MéritoPro. Activa SIEMPRE que la tarea implique PostHog (eventos, funnels, cohortes, feature flags, experiments), Vercel Analytics, SQL sobre Supabase para métricas, dashboards de conversión/retención, métricas de IA (cache hit del Orquestador, tokens, costo por usuario/día, latencia p50/p95), métricas del motor SM-2 (retención real por tema, curva del olvido, e_factor), A/B tests con lectura estadística honesta, honestidad cognitiva de la métrica "Probabilidad de Aprobar", Sentry, Core Web Vitals, Lighthouse. Usar también cuando el usuario pida "métricas", "KPI", "conversión", "funnel", "cohorte", "retención", "dashboard", "evento", "tracking", "experimento", "reporte semanal", "cuánto nos cuesta la IA" — incluso sin decir "data" o "analytics".
---

# Data & Analytics MéritoPro

## Stack
PostHog (producto) · Vercel Analytics (web vitals) · Sentry (errores) · Supabase Postgres (datos de dominio) · tabla `ia_llamadas` (observabilidad IA).

## 5 principios
1. Honestidad cognitiva: la métrica pública es "Probabilidad de Aprobar", calibrada con aciertos × dificultad × cobertura × retención. Sin vanity metrics.
2. Funnels con definiciones fijas y versionadas. Cambio semántico → evento nuevo (`v2`).
3. Ningún A/B test sin control y sample size precalculado.
4. Cero PII en eventos (ni email, ni celular, ni nombre). `distinct_id` = hash del `user_id`.
5. Observabilidad de IA es first-class: cache hit <70% 3 días → alerta; costo/usuario/día +30% WoW → alerta.

## Taxonomía de eventos (canónica)
`snake_case`, verbo pasado, módulo primero.

**Pre-pago:** `landing_viewed`, `diagnostico_iniciado`, `diagnostico_pregunta_respondida`, `diagnostico_completado`, `resultados_viewed`, `paywall_viewed`, `checkout_iniciado`, `checkout_completado`.

**Post-pago:** `sesion_entrenar_iniciada/completada`, `pregunta_fallada_modal_visto`, `tutor_consultado`, `probabilidad_aprobar_actualizada`.

**Crons:** `cron_repaso_ejecutado`, `cron_remarketing_ejecutado`. Las llamadas a IA van a DB, no a PostHog.

## KPIs del producto
- Adquisición: leads/día, % diagnóstico completado (>60% objetivo).
- Conversión: `resultados_viewed → checkout_completado` (>4% inicial).
- Activación: ≥3 sesiones en primeros 7 días.
- Retención hábito: sesión completada 6/7 últimos días.
- Cognitivo: retención real por tema, "Probabilidad de Aprobar" sube WoW.
- IA: cache hit >70%, costo USD/usuario/día, latencia p50/p95.

## Tabla `ia_llamadas` (obligatoria)
Columnas: `user_id, agente, modelo, input_tokens_cached, input_tokens_new, output_tokens, cache_hit_ratio, latency_ms, tool_used, tarea, costo_usd, created_at`. Índices por `created_at` y `(user_id, created_at)`. RLS: solo service role.

## A/B tests — checklist
1. Hipótesis falsable con lift esperado.
2. Métrica primaria + métricas de guardia definidas antes.
3. Sample size calculado (MDE + power 80% + α 0.05).
4. Asignación por `distinct_id` via feature flag de PostHog.
5. ≥1 ciclo semanal de duración.
6. Sin peeking diario.
7. Reporte: decisión, lift + IC 95%, efecto en guardia.

## Dashboards mínimos
Funnel pre-pago · Hábito post-pago (cohortes semanales) · Calidad motor (retención por tema, dist. `e_factor`) · Costos IA · Remarketing (open/click/conversion por variante).

## PostHog config
`person_profiles: 'identified_only'`, `autocapture: false`, `capture_pageview: false`. Server-side con `posthog-node` en crons y checkout.

## Anti-patrones
PII en props · verbos en presente · `autocapture: true` · métricas que suben sin correlato de aprendizaje · A/B con n<MDE declarado ganador · queries sin índices.

## Coordinación
- Tabla `ia_llamadas` + instrumentación → `fullstack-nextjs-supabase` + `qa-testing-devops`.
- Copy de variantes → `growth-marketing`.
- Alertas Sentry + regresiones → `qa-testing-devops`.

## Entrega
Eventos nuevos + schema · queries SQL versionadas · dashboards creados · hipótesis + diseño del siguiente experimento · riesgos de PII/doble conteo detectados.
