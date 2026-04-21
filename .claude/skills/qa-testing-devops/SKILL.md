---
name: qa-testing-devops
description: Skill del QA Engineer + DevOps de MéritoPro. Activa SIEMPRE que la tarea implique pruebas (unit, integration, e2e), validación con Zod, auditoría de RLS en Supabase, deploy a Vercel, Vercel Cron, seguridad de endpoints (CRON_SECRET, validación de firma de webhooks Telegram, rate limiting), CI/CD con GitHub Actions, performance (Core Web Vitals, bundle size, Lighthouse), observabilidad (Sentry, logs estructurados, métricas de cache de IA). Usar cuando el usuario mencione "test", "pruebas", "validar", "schema", "zod", "deploy", "vercel", "cron", "seguridad", "rls", "ci", "pipeline", "performance", "lighthouse", "webhook", "rate limit", "bundle", "producción", "staging", "rollback". Garantiza el checklist de release de MéritoPro: 0 tablas sin RLS, todos los crons con CRON_SECRET, typecheck limpio, build verde, Lighthouse Mobile Perf ≥85 / A11y ≥95.
---

# QA + DevOps MéritoPro

## 6 reglas innegociables
1. Toda ruta que recibe payload → **Zod `.parse()` en try/catch**, 400 con detalle si falla.
2. Toda tabla → **RLS enabled + policies explícitas**. Auditar con `pg_tables` antes de release.
3. Todo cron → **`Authorization: Bearer ${CRON_SECRET}`** validado al inicio. Grepear antes de deploy.
4. Toda env secreta → **sin prefijo `NEXT_PUBLIC_`**. Validar con Zod al arranque (`env.ts`).
5. Webhook Telegram → valida header `X-Telegram-Bot-Api-Secret-Token` vs `TELEGRAM_SECRET_TOKEN`.
6. Endpoints públicos pre-pago (`/api/leads`, `/api/diagnostico/*`) → **rate limit 10 req/min por IP** (Upstash).

## Estructura de tests
- `tests/unit/` → lógica pura (SM-2, calculadora antecedentes, schemas Zod). **Vitest**.
- `tests/integration/` → API routes con Supabase mockeado / Claude mockeado. **Vitest + msw**.
- `tests/e2e/` → flujos lead→diagnóstico→paywall→dashboard. **Playwright**.

## Tests SM-2 canónicos (deben existir)
- quality<3 → reset repetitions=0, interval=1.
- Repetición 1 acertada → interval=1. Repetición 2 acertada → interval=6.
- eFactor jamás <1.3.

## Checklist de release
`pnpm typecheck` 0 errores · `pnpm test` verde · `pnpm test:e2e` crítico OK · `pnpm build` sin warnings · Bundle <200KB gz página inicial · Lighthouse mobile Perf ≥85 A11y ≥95 · 0 tablas sin RLS · crons con CRON_SECRET · 0 secretos en cliente · `.env.example` actualizado · migraciones probadas en staging.

## Vercel config
`vercel.json` con `crons` (repaso `0 9 * * *`, remarketing `0 14 * * 1,3,5`) y headers de seguridad (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

## GitHub Actions mínimo
Jobs: typecheck, lint, test, build. Node 20, pnpm con cache, `--frozen-lockfile`.

## Observabilidad
Sentry con source maps · Vercel Analytics + PostHog para funnels · Tabla `ia_llamadas` con `{user_id, cache_hit_ratio, input_tokens, output_tokens, latency_ms, tool_used}` — crítico para detectar regresiones de caching.

## Auditorías que corres antes de deploy
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
```
Debe devolver 0 filas.

```
rg "app/api/cron" -l | xargs rg -L "CRON_SECRET"
```
Debe devolver vacío.

## Qué NO hacer
- Mergear con tests en rojo o `test.skip`.
- `process.env.X!` sin validación.
- Stack traces de servidor expuestos al cliente.
- Datos reales de usuario en fixtures.

## Entrega
Tests creados + cobertura · resultado de auditorías · bloqueadores de release · runbook de deploy en 5 líneas.
