# Prompt para auditoría completa de links y lógica — MéritoPro

> Pegar tal cual en Claude Code (o cualquier coding agent que tenga acceso al repo). El agente debe diagnosticar primero, reportar findings, y aplicar SOLO los fixes seguros (no romper UX existente).

---

## Tarea

Auditoría exhaustiva del proyecto Next.js 14 (App Router) en `meritoprov3`. Encontrar y reparar:

1. **Links rotos** — `<Link href="...">`, `<a href="...">`, `redirect("...")`, `router.push("...")` que apunten a rutas inexistentes.
2. **Inconsistencias de navegación** — links que llevan a un destino lógicamente equivocado (ej. dashboard → ruta pública de marketing en lugar de la página autenticada).
3. **Auth gaps** — páginas protegidas accesibles sin sesión, o páginas públicas que requieren auth innecesariamente.
4. **Server actions con dependencias rotas** — actions que llaman tablas o RPCs que no existen en `supabase/migrations/`.
5. **Datos hardcodeados (mock)** — strings tipo `Carlos`, `carlos@ejemplo.com`, `42 %`, `Procurador Judicial I` literales en vez de leer de `auth.users` / `public.usuarios` / `public.respuestas_preguntas`.
6. **Schemas Zod desincronizados** entre el frontend que envía y el backend que valida.
7. **Eventos del Pixel/GA no disparados** en momentos clave del funnel (Lead, Purchase, etc.).

## Pasos de diagnóstico (no avanzar al fix sin completar esto)

### A. Mapeo de rutas existentes

```bash
# Lista todas las rutas (App Router descubre por convención de carpeta)
find src/app -name 'page.tsx' -o -name 'route.ts' | sort
```

Construir una lista canónica de todas las rutas válidas. Distinguir entre rutas estáticas y dinámicas (`[lead_id]`, `[persona]`, etc.).

### B. Mapeo de todos los links del proyecto

```bash
# Todos los hrefs de Link y <a>
grep -rn 'href="' src/ | grep -E "(Link|<a)" | sort
# Todos los router.push y redirect
grep -rn 'router\.push\|redirect(' src/ | sort
```

Para cada href encontrado, comprobar:
- ¿La ruta destino existe en el mapeo de A?
- Si es dinámica (ej. `/diagnostico/[lead_id]`), ¿se está pasando un id válido o queda hardcoded `/diagnostico` que da 404?
- ¿Es coherente con el contexto (público vs autenticado)?

### C. Tablas y RPCs de Supabase

```bash
# Todas las tablas leídas/escritas desde el código
grep -rn '\.from(' src/ | grep -v node_modules | sort
# Todas las RPCs invocadas
grep -rn '\.rpc(' src/ | grep -v node_modules | sort
```

Cruzar contra `supabase/migrations/*.sql` para confirmar que cada tabla y cada función referida realmente exista. Si falta alguna → reportar y proponer migración.

### D. Datos hardcodeados (mock)

```bash
grep -rn 'Carlos\|carlos@ejemplo\|DEMO_USER\|Procurador Judicial I' src/ | grep -v node_modules
```

Cualquier ocurrencia en código de producción es un bug. Únicamente ignora los matches que sean comentarios o nombres en strings de testimonios falsos en marketing.

### E. Eventos analytics

```bash
grep -rn "trackEvent\(" src/ | sort
```

Verificar que estos eventos clave estén disparados en el lugar correcto:

- `generate_lead` → al crear el lead (en `(marketing)/actions.ts crearLead` o al aterrizar `/diagnostico/[lead_id]`).
- `purchase` → en `dashboard/bienvenida/page.tsx` cuando `intencion.estado === 'aprobada'`.
- `view_item` → al cargar `/checkout/page.tsx`.
- `begin_checkout` → al click "Activar plan" desde el sumario del diagnóstico.
- `sign_up` → al crear cuenta en `/login` (registro nuevo).

Si alguno no está cableado → reportar y proponer fix.

### F. Smoke test de páginas críticas (opcional, requiere dev server local)

Si `npm run dev` está corriendo, hacer GET a estas rutas y verificar status:

```
GET /                            → 200, landing pública
GET /login                       → 200, formulario login
GET /dashboard                   → 307 redirect a /login (sin sesión)
GET /diagnostico                 → 404 (intencional, requiere [lead_id])
GET /diagnostico/00000000-0000-0000-0000-000000000000 → 200, simulacro vacío
GET /api/orquestador             → 405 Method Not Allowed (POST-only)
GET /legal/terminos              → 200
GET /legal/privacidad            → 200
GET /garantia                    → 200
GET /lp/abogada                  → 200
```

## Reglas para el fix

1. **NO** desactivar la auth en rutas que la requieren ("para que pase").
2. **NO** crear archivos placeholder con TODOs sin contenido real — preferir no crearlos.
3. **NO** cambiar el schema de DB si no se ha confirmado primero con el usuario.
4. **SÍ** corregir links rotos cuando el destino correcto es obvio (ej. `/diagnostico` → `/dashboard/diagnostico` para usuarios autenticados).
5. **SÍ** convertir `<a href="/...">` en `<Link href="/...">` cuando sea ruta interna (ESLint regla @next/next/no-html-link-for-pages).
6. **SÍ** reemplazar datos mock por reads reales de Supabase (siguiendo el patrón de `dashboard/actions.ts` y `dashboard/perfil/actions.ts`).
7. Cualquier cambio que toque comportamiento de producto (ej. mover un botón de lugar, cambiar copy) → primero documentar y esperar confirmación.

## Salida esperada

Reporte final con esta estructura exacta:

```
=== Auditoría MéritoPro ===

[A] Rutas existentes              : N rutas (X estáticas + Y dinámicas)
[B] Links inspeccionados          : N links totales
                                    · OK: X
                                    · Rotos: Y
                                    · Lógicamente erróneos: Z
[C] Tablas/RPC referidas          : N tablas + M RPCs
                                    · Confirmadas en migrations: X+Y
                                    · Faltantes: Z
[D] Strings hardcodeados (mock)   : N matches
                                    · Bugs reales: X
                                    · Falsos positivos: Y
[E] Eventos analytics esperados   : 5 puntos
                                    · Cableados correctamente: X
                                    · Faltantes: Y
[F] Smoke HTTP (si aplica)        : N/M endpoints OK

=== Findings detallados ===

1. [LINK ROTO] src/app/dashboard/page.tsx:103
   href="/diagnostico" → 404 (ruta dinámica requiere [lead_id])
   Fix sugerido: cambiar a "/dashboard/diagnostico"

2. [DATO MOCK] src/app/dashboard/perfil/page.tsx:35
   "Carlos García López" hardcodeado
   Fix sugerido: leer de obtenerPerfilUsuario() (ya existe en perfil/actions.ts)

... etc

=== Fixes aplicados ===

✓ src/app/dashboard/page.tsx — link de diagnóstico corregido
✓ src/app/dashboard/perfil/page.tsx — datos reales desde server action
✗ src/app/dashboard/tutor/page.tsx — requiere decisión: es feature WIP, ¿la dejamos vacía o la ocultamos del sidebar?

=== Pendientes que requieren decisión humana ===

· La página /dashboard/tutor está vacía pero linkeada en el sidebar.
  Opciones: A) ocultarla del sidebar B) implementarla C) marcarla "Próximamente".
```

## Restricciones operativas

- Trabajar en una rama nueva: `git checkout -b chore/audit-links-`<fecha>.
- Cada fix debe pasar `npx tsc --noEmit` y `npx eslint --max-warnings=0` antes del commit.
- Cuando un fix toque más de 3 archivos, hacer commit separado para que sea reviewable.
- Si encuentras un bug que requiere migración SQL nueva, NO la ejecutes — proponla en un archivo `supabase/migrations/000X_audit_fix.sql` y pídele al usuario que la corra manualmente.

## Archivos clave para empezar la inspección

- `src/app/dashboard/layout.tsx` — sidebar con links a todas las secciones del dashboard.
- `src/app/(marketing)/page.tsx` — landing pública con form.
- `src/app/(marketing)/actions.ts` — `crearLead` (donde debería disparar `generate_lead`).
- `src/app/login/page.tsx` y `actions.ts` — flujo de auth.
- `src/app/dashboard/page.tsx`, `dashboard/perfil/page.tsx` — los recientemente refactorizados (referencia de patrón correcto).
- `src/middleware.ts` — guards de auth si existen.
- `supabase/migrations/0000_foundation_v3.sql` y demás — fuente de verdad de tablas/RPCs.

---

## Conclusión

Cuando termines la auditoría, dame el reporte completo con la sección de "Pendientes que requieren decisión humana". No mergear nada a `master` sin mi confirmación de los items ambiguos.
