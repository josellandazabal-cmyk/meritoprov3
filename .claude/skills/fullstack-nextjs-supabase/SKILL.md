---
name: fullstack-nextjs-supabase
description: Skill del Senior Full-Stack Engineer de MéritoPro. Activa SIEMPRE que el trabajo implique Next.js 14 App Router, TypeScript estricto, Supabase (Auth Google/Email+Password, Row Level Security, pgvector, @supabase/ssr), rutas en /app/, API routes, Server Components, Server Actions, migraciones SQL, integración Resend o Telegraf, Vercel Cron. Usar también cuando el usuario diga "crear la tabla X", "el endpoint Y", "autenticación", "leads", "checkout", "webhook", "dashboard", "SM-2", "bucle diario" — aunque no mencione Next.js o Supabase explícitamente. Esta skill garantiza que el código cumpla las reglas duras de CLAUDE.md §12 (cero Magic Links, RLS estricto, tipado sin `any`, @supabase/ssr, CRON_SECRET).
---

# Full-Stack MéritoPro — Reglas Operativas

**Antes de tocar código:** lee `CLAUDE.md` del proyecto — especialmente §8 (modelo de datos), §11 (routing) y §12 (reglas duras).

## Stack obligatorio
- Next.js 14 App Router · TypeScript estricto · Supabase (`@supabase/ssr`) · Zod · Resend · Telegraf · Anthropic SDK con prompt caching.

## 6 reglas que siempre aplican
1. **Cero Magic Links.** Sólo Google OAuth y Email+Password.
2. **Dos clientes Supabase:** `lib/supabase/client.ts` (browser) y `lib/supabase/server.ts` (cookies via `next/headers`).
3. **RLS en toda tabla.** La migración que crea la tabla incluye sus policies en el mismo archivo SQL.
4. **Prohibido `any`.** Interfaces explícitas en `/types/`, importadas, nunca duplicadas.
5. **Crons protegidos** con `Authorization: Bearer ${CRON_SECRET}`.
6. **Flujo pre-pago sin login pesado.** Leads inserta anónimo, auth real sólo después del checkout.

## Patrones mentales

**Server Client con cookies:** `createServerClient` + `cookies()` de `next/headers`, expone `get/set/remove`.

**Migración + RLS en un solo SQL:** `create table … enable row level security; create policy "own_rows_select" … using (auth.uid() = user_id);` para cada operación (select/insert/update).

**Endpoint cron:** validar header → `401` si no coincide → lógica → log a `eventos_remarketing` con unique index `(user_id, tipo, fecha)` para idempotencia.

## SM-2 (firma canónica)

`lib/sm2/calcular.ts` exporta `calculateSM2(prev, quality)`. Si `quality < 3` → reset. Intervalos 1, 6, `interval * eFactor`. `eFactor` mínimo 1.3.

## Coordinación con otras skills
- UI visual → delegá al skill `ui-ux-institucional`. Tu responsabilidad es el contrato de datos.
- Prompts de IA / schemas de tools → delegá a `prompt-engineer-ia`.
- Tests, RLS audit, deploy → coordiná con `qa-testing-devops`.

## Qué entregar al terminar
1. Archivos tocados (rutas).
2. Migraciones nuevas a aplicar en Supabase.
3. Variables de entorno nuevas requeridas (nombradas, no valores).
4. Pasos manuales pendientes (ej. "configurar Google OAuth en Supabase dashboard").
