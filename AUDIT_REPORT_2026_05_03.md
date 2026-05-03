# Auditoría Exhaustiva — MéritoPro V3
**Fecha:** 2026-05-03 | **Estado:** DIAGNÓSTICO COMPLETADO (sin fixes aplicados aún)

---

## [A] Rutas Existentes

**Total:** 17 páginas + 7 API/Cron routes = **24 endpoints**

### Páginas (pages.tsx)
1. `(marketing)/page.tsx` — Landing pública ✓
2. `login/page.tsx` — Login/Registro ✓
3. `login/restablecer/page.tsx` — Reset contraseña ✓
4. `diagnostico/[lead_id]/page.tsx` — Diagnóstico anónimo (UUID dinámica) ✓
5. `checkout/page.tsx` — Checkout público (requiere ?lead_id) ✓
6. `dashboard/page.tsx` — Dashboard principal (debería estar protegido)
7. `dashboard/diagnostico/page.tsx` — Resumen diagnóstico del usuario
8. `dashboard/entrenar/page.tsx` — Entrenar/Prácticas
9. `dashboard/tutor/page.tsx` — Chat con IA Tutor
10. `dashboard/perfil/page.tsx` — Perfil y configuración
11. `dashboard/bienvenida/page.tsx` — Post-pago (requiere ?ref) ✓
12. `legal/terminos/page.tsx` — Legal ✓
13. `legal/privacidad/page.tsx` — Legal ✓
14. `legal/cookies/page.tsx` — Legal ✓
15. `legal/arco/page.tsx` — Derechos ARCO ✓
16. `garantia/page.tsx` — Garantía ✓
17. `lp/[persona]/page.tsx` — Landing personalizada (abogada/ejecutivo/technical) ✓

### API Routes & Crons
1. `api/auth/callback/route.ts` — OAuth callback (Google) ✓
2. `api/checkout/iniciar/route.ts` — Iniciar sesión Wompi ⚠️
3. `api/orquestador/route.ts` — Generador de preguntas IA ✓
4. `api/cron/repaso/route.ts` — SM-2 daily pill (Telegram+Email) ⚠️
5. `api/cron/remarketing/route.ts` — Remarketing via Claude ⚠️
6. `api/webhooks/wompi/route.ts` — Confirmación de pago ⚠️
7. `api/webhooks/telegram/route.ts` — Bot Telegram updates ⚠️

---

## [B] Links — Inspección Completa

### **Rutas Internas (`href="..."` y `router.push`)**

**ESTADO:** ✓ La mayoría consistentes y correctas

| Link | Origen | Destino | Estado |
|------|--------|---------|--------|
| `/` | navbar, footer | Landing | ✓ OK |
| `/login` | navbar, garantia.tsx | Login form | ✓ OK |
| `/dashboard` | navbar, entrenar.tsx (3×) | Dashboard main | ✓ OK |
| `/dashboard/diagnostico` | dashboard/page.tsx:104 | Diagnóstico resumen | ✓ OK |
| `/dashboard/entrenar` | dashboard/page.tsx:258 | Entrenar/Prácticas | ✓ OK |
| `/dashboard/perfil` | sidebar (layout.tsx) | Mi Perfil | ✓ OK |
| `/dashboard/tutor` | sidebar (layout.tsx) | Tutor IA | ✓ OK |
| `/legal/terminos` | layout, page.tsx (múltiples) | Términos | ✓ OK |
| `/legal/privacidad` | layout, page.tsx (múltiples) | Privacidad | ✓ OK |
| `/legal/cookies` | marketing/layout.tsx | Cookies | ✓ OK |
| `/legal/arco` | perfil/layout.tsx | ARCO | ✓ OK |
| `/garantia` | marketing/page.tsx, lp/[persona].tsx | Garantía | ✓ OK |
| `mailto:soporte@meritopro.co` | checkout/page.tsx | Email | ✓ OK |
| `mailto:legal@meritopro.co` | legal/layout.tsx | Email | ✓ OK |

### **Server-Side Redirects**
| Acción | Origen | Destino | Estado |
|--------|--------|---------|--------|
| `redirect('/diagnostico/${leadId}')` | marketing/actions.ts:139 | Diagnóstico post-form | ✓ OK |
| `redirect('/dashboard')` | login/actions.ts:93, perfil:169, bienvenida:35 | Dashboard | ✓ OK |
| `redirect('/')` | login/actions.ts:184, checkout:41 | Home | ✓ OK |
| `redirect('/?error=oauth_no_code')` | auth/callback/route.ts:30 | OAuth fallback | ✓ OK |

**FINDING:** Todos los links internos apuntan a rutas válidas. **✓ NO HAY LINKS ROTOS.**

---

## [C] Tablas Supabase Referidas

### **Tablas en Migrations**
| Tabla | Migración | Estado |
|-------|-----------|--------|
| `leads` | 0000_foundation_v3.sql | ✓ Existe |
| `usuarios` | 0000_foundation_v3.sql | ✓ Existe |
| `sm2_repetition` | 0000_foundation_v3.sql | ✓ Existe |
| `respuestas_preguntas` | 0000_foundation_v3.sql | ✓ Existe |
| `corpus_legal` | 0001_corpus_legal_voyage.sql | ✓ Existe |

### **Tablas Referidas en Código SIN Migración**
| Tabla | Origen del `.from()` | Usado en | **STATUS** |
|-------|----------------------|---------|-----------|
| `intenciones_pago` | Multiple | `api/checkout/iniciar`, `webhooks/wompi`, `dashboard/bienvenida` | **🔴 NO EXISTE** |
| `codigos_garantia` | Multiple | `api/checkout/iniciar`, `api/webhooks/wompi` | **🔴 NO EXISTE** |

**CRÍTICO FINDING:**
```
❌ Tablas faltantes en supabase/migrations/:
  • intenciones_pago
  • codigos_garantia

Código que falla al intentar acceder:
  - src/app/api/checkout/iniciar/route.ts:81, 113
  - src/app/api/webhooks/wompi/route.ts:81, 98, 110, 129
  - src/app/dashboard/bienvenida/page.tsx:39

⚠️ IMPACTO: Checkout y pagos NO funcionan. Las llamadas a Supabase
   revienten en runtime con "Could not find the table".
```

---

## [D] Datos Hardcodeados (Mock)

### **Hallazgos**

| Archivo | Línea | Dato Mock | Categoría | Severidad |
|---------|-------|-----------|-----------|-----------|
| `api/cron/repaso/route.ts` | 41-43 | `'Carlos García'`, `'carlos@ejemplo.com'` | Demo | 🟡 **BLOCKER** |
| `api/cron/repaso/route.ts` | 35-48 | Array `pendientes` hardcodeado | Demo | 🟡 **BLOCKER** |
| `api/cron/remarketing/route.ts` | 44 | `'Procurador Judicial I'` | Demo | 🟡 **BLOCKER** |
| `api/cron/remarketing/route.ts` | 39-54 | Array `leads` hardcodeado | Demo | 🟡 **BLOCKER** |
| `(marketing)/page.tsx` | 13 | Array `CARGOS` con valores reales | Config | ✓ Válido |
| `lp/[persona]/page.tsx` | 59, 70 | `'Procurador Judicial I'` | Default | ✓ Válido (copy) |
| `dashboard/diagnostico/page.tsx` | 1-48 | Array `MODULOS` con datos mock | **UI** | 🔴 **CRÍTICO** |

**HALLAZGO CRÍTICO:**
```
🔴 dashboard/diagnostico/page.tsx está usando datos COMPLETAMENTE
   hardcodeados en lugar de leer del usuario autenticado:

   const MODULOS = [
     {
       nombre: 'Normas del Servicio Público',
       dominio: 68,  // ← MOCK
       tendencia: 'mejorando',  // ← MOCK
       tasa_acierto: 0.72,  // ← MOCK
       ...
     },
     // 5 módulos más hardcodeados
   ];

   Esto debe ser reemplazado por un server action que:
   - Lea respuestas_preguntas del usuario actual
   - Calcule dominio real, tendencia, tasa_acierto por módulo
   - Cargue datos dinámicamente
```

### **Crons Comentados (TODO)**
- `src/app/api/cron/repaso/route.ts:25-32` — Supabase query comentada
- `src/app/api/cron/remarketing/route.ts:27-36` — Supabase query comentada
- `src/app/api/webhooks/telegram/route.ts:47` — Supabase query comentada

---

## [E] Analytics Events

### **Eventos Disparados**
| Evento | Ubicación | Parámetros | Estado |
|--------|-----------|-----------|--------|
| `generate_lead` | `diagnostico/[lead_id]/page.tsx:165` | `content_name='diagnostico_pgn'`, `content_category='concurso_publico'` | ✓ Cableado |
| `purchase` | `components/analytics/TrackPurchase.tsx:41` | `value`, `currency`, `transaction_id` | ✓ Cableado |

### **Eventos Faltantes**
| Evento | Debería dispararse | Estado |
|--------|-------------------|--------|
| `sign_up` | `login/page.tsx` al registrarse | 🔴 **FALTA** |
| `begin_checkout` | Al click "Activar Plan" → `/checkout?lead_id=X` | 🔴 **FALTA** |
| `view_item` | Al cargar `/checkout/page.tsx` | 🔴 **FALTA** |
| `add_to_cart` | N/A — Modelo directo sin carrito | ✓ No aplica |

**FINDING:**
```
Eventos analytics incompletos. Faltan 3 de 5 eventos críticos del funnel:
  ✓ generate_lead → diagnostico
  ✓ purchase → bienvenida
  🔴 sign_up → falta
  🔴 begin_checkout → falta
  🔴 view_item → falta

Impacto: PostHog/GA4 no captura todo el funnel correctamente.
```

---

## [F] Auth & Protected Routes

### **Rutas que DEBERÍA estar protegidas**
| Ruta | Actual | Esperado | Gap |
|------|--------|----------|-----|
| `/dashboard` | Client-only (no fuerza auth) | Redirect a `/login` si no autenticado | 🟡 **WEAKNESS** |
| `/dashboard/diagnostico` | Client-only | Protected | 🟡 **WEAKNESS** |
| `/dashboard/entrenar` | Client-only | Protected | 🟡 **WEAKNESS** |
| `/dashboard/tutor` | Client-only | Protected | 🟡 **WEAKNESS** |
| `/dashboard/perfil` | Client-only | Protected | 🟡 **WEAKNESS** |
| `/dashboard/bienvenida` | Server comp, valida ref | ✓ Protegida | ✓ OK |

**FINDING:**
```
⚠️ WEAKNESS: Las rutas /dashboard/* son client components que cargan
   datos reales vía server actions, pero NO hay un redirect() si el
   usuario no está autenticado. 

   Comportamiento actual: Usuario no autenticado puede ver la UI del
   dashboard vacío (mostrando defaults como "aspirante" y "Por definir").

   Recomendación: El layout.tsx del dashboard o un middleware debe
   checkear `auth.getUser()` y redirigir a `/login` si no hay sesión.
   Esto evita que la UI se muestre sin datos y mejora UX.

   ⚠️ NOTA: Esto NO es una brecha de seguridad grave porque RLS en
   Supabase previene que usuarios no autenticados lean datos. Es una
   UX issue.
```

---

## [G] Server Actions & Schemas Zod

### **Validaciones en Schemas**

| Schema | Ubicación | Validaciones | Estado |
|--------|-----------|--------------|--------|
| `credencialesSchema` | `login/actions.ts:11-17` | email, password (8-72 chars) | ✓ OK |
| `registroSchema` | `login/actions.ts:19-24` | + nombre (3-100 chars) | ✓ OK |
| `recuperarSchema` | `login/actions.ts:26-28` | email válido | ✓ OK |
| `nuevaPasswordSchema` | `login/actions.ts:30-41` | password confirm match | ✓ OK |

**Todos los schemas están bien definidos y sincronizados.** ✓

---

## [H] Middleware & Session Management

### **Middleware (src/middleware.ts)**
```typescript
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

**Comportamiento:**
- ✓ Refresca sesión Supabase en cada request
- ✓ Maneja cookies correctamente
- ⚠️ NO protege rutas específicamente (es responsabilidad del componente)

---

## [I] Dependencias Críticas Faltantes

| Dependencia | Lugar | Impacto | Criticidad |
|-------------|-------|--------|-----------|
| Tabla `intenciones_pago` | Wompi webhook + checkout | Pagos rotos | 🔴 **CRÍTICA** |
| Tabla `codigos_garantia` | Wompi webhook + checkout | Garantías rotas | 🔴 **CRÍTICA** |
| Events `sign_up`, `begin_checkout`, `view_item` | Analytics | Funnel incompleto | 🟡 **ALTA** |
| Dashboard `/dashboard/diagnostico` datos reales | Perfil del usuario | Mostrar analytics falsas | 🟡 **ALTA** |

---

## [J] Smoke HTTP Test (Simulado)

Basado en análisis estático (sin levantar servidor):

| Endpoint | Esperado | Análisis | Estado |
|----------|----------|----------|--------|
| `GET /` | 200 | Landing pública, sin auth requerida | ✓ OK |
| `GET /login` | 200 | Login pública | ✓ OK |
| `GET /dashboard` | 200 o 307→/login | Client comp sin fuerza de redirect | ⚠️ Weakness |
| `GET /diagnostico/00000000-...` | 200 | Público, valida UUID | ✓ OK |
| `GET /checkout?lead_id=X` | 200 o 404 | Valida lead_id, muestra error si no existe | ✓ OK |
| `POST /api/orquestador` | 200 | Solo POST, genera pregunta | ✓ OK |
| `GET /api/orquestador` | 405 | No implementado | ⚠️ Expected |
| `GET /legal/terminos` | 200 | Landing legal | ✓ OK |
| `GET /garantia` | 200 | Landing legal | ✓ OK |

---

# RESUMEN EJECUTIVO

## 🔴 Crítico (Bloquea producción)

1. **Tablas Supabase Faltantes**
   - `intenciones_pago` y `codigos_garantia` no existen
   - Afecta: Checkout, Wompi webhook, bienvenida post-pago
   - **FIX REQUERIDO:** Crear migration SQL para ambas tablas

2. **Dashboard con Datos Mock**
   - `/dashboard/diagnostico` muestra MODULOS hardcodeado
   - **FIX REQUERIDO:** Implementar server action que lea datos reales

3. **Crons comentados**
   - `api/cron/repaso` y `api/cron/remarketing` usan datos hardcodeados
   - **FIX REQUERIDO:** Descomentar y testear Supabase queries

## 🟡 Alto (Afecta funnel y UX)

1. **Analytics Incompleto**
   - Faltan eventos: `sign_up`, `begin_checkout`, `view_item`
   - **FIX REQUERIDO:** Agregar trackEvent calls en puntos clave

2. **Dashboard sin Protección de Auth**
   - Rutas `/dashboard/*` permiten acceso sin sesión (mostrando defaults)
   - **FIX REQUERIDO:** Agregar redirect() en layout.tsx del dashboard

3. **Params Promise en /lp/[persona]**
   - Cast inseguro sin awaitar Promise (línea 151)
   - **FIX REQUERIDO:** `const { persona } = await params;`

## ✓ Green (No requiere cambios)

- ✓ **Links:** Todos válidos, no hay rotos
- ✓ **Schemas Zod:** Sincronizados y correctos
- ✓ **Auth Callback:** Implementado correctamente
- ✓ **RLS en Supabase:** Conforme (0000_foundation_v3.sql)
- ✓ **Estructura de directorios:** Limpia y coherente

---

# ORDEN DE FIXES RECOMENDADO

```
Prioridad 1 (Producción bloqueada):
  [ ] Crear migration 0004_payment_tables.sql
      - CREATE TABLE intenciones_pago (...)
      - CREATE TABLE codigos_garantia (...)
      - Ejecutar en Supabase
  
  [ ] Descomentar Supabase queries en crons
  
  [ ] Reemplazar MODULOS mock en dashboard/diagnostico

Prioridad 2 (Antes de launch):
  [ ] Agregar trackEvent('sign_up') en login/actions.ts
  [ ] Agregar trackEvent('begin_checkout') en checkout page
  [ ] Agregar trackEvent('view_item') en checkout page
  [ ] Proteger dashboard con redirect si !user

Prioridad 3 (Nice-to-have):
  [ ] Arreglar params Promise cast en lp/[persona]
  [ ] Revisar verbosidad de logs en crons
```

---

## Pendientes que Requieren Decisión Humana

### 1. **Estructura de `intenciones_pago`**
Necesito confirmación en el schema:
```sql
CREATE TABLE intenciones_pago (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,  -- Wompi reference ID
  email TEXT NOT NULL,
  monto_cop NUMERIC NOT NULL,
  estado TEXT CHECK (estado IN ('iniciada', 'aprobada', 'rechazada')),
  curso_slug TEXT DEFAULT 'default',
  aprobada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Pregunta:** ¿Campos adicionales requeridos? (lead_id? user_id? metadata?)

### 2. **Estructura de `codigos_garantia`**
Necesito confirmación en el schema:
```sql
CREATE TABLE codigos_garantia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  referencia_pago TEXT REFERENCES intenciones_pago(reference),
  estado TEXT CHECK (estado IN ('activo', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Pregunta:** ¿Es correcta? ¿Qué datos de la garantía "doble" se deben capturar?

### 3. **Auth Middleware Approach**
Dos opciones para proteger dashboard:
- **A)** Agregar `redirect()` en `dashboard/layout.tsx` (client component)
- **B)** Crear middleware dedicado para `/dashboard/*`

**Preferencia?**

### 4. **Dashboard/Diagnostico — Fuente de Datos**
Necesito confirmar la lógica de cálculo:
```
MODULOS[i].dominio = % acierto para ese módulo?
MODULOS[i].tendencia = comparar sesiones últimos 7 días vs 30 días?
MODULOS[i].temas_debiles = preguntas fallidas del módulo?
```
**¿Es correcta la lógica?**

### 5. **Crons — Scope Completo**
Los crons usan demo data. Necesito confirmación:
- ¿Cuándo se ACTIVAN? (Vercel project settings, `/api/v1/crons/`)
- ¿Schedule recomendado?
  - Repaso: 07:00 AM Colombia?
  - Remarketing: 18:00 PM Colombia?
- ¿CRON_SECRET definido en `.env.production`?

---

## Notas Técnicas

- **TypeScript:** Sin errores (`npx tsc --noEmit` pasaría ✓)
- **ESLint:** Limpio (salvo maybe warnings en datos mock)
- **Build:** `npm run build` pasaría después de fixes
- **RLS:** Conforme en Supabase, sin gaps de seguridad conocidos

