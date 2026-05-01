# Setup de Auth para la Beta — instrucciones operativas

Resumen de lo que cambió en código:

- Botón **"Continuar con Google"** en `/login` (modo iniciar y registrar) que dispara OAuth de un click sin password ni correo de confirmación.
- Endpoint `/auth/callback` que recibe la respuesta de Google/Supabase y crea la sesión.
- Mensaje de error mejorado: cuando Supabase devuelve "Invalid login credentials" sugerimos al aspirante que revise su correo de confirmación o entre con Google.

Para que esto funcione, hay que tocar **dos consolas externas** (Supabase + Google Cloud Console). Es la única forma — no hay manera de configurar OAuth sólo desde el código.

---

## Decisión recomendada para la beta

**Deshabilitar la confirmación de correo electrónico durante la beta.** Esto hace que cualquiera que se registre con email/password pueda entrar al instante, sin esperar correo.

**Mantenerla activada en producción** (después de la beta), cuando ya tengas SMTP configurado y volumen suficiente.

---

## PASO 1 · Supabase Dashboard — Deshabilitar confirmación de correo

1. Ve a https://supabase.com/dashboard/project/<tu-proyecto>/auth/providers
2. Click en **"Email"** (proveedor por defecto).
3. Encuentra el toggle **"Confirm email"** y desactívalo.
4. Click en **"Save"**.

Resultado: cualquier `signUp` te crea una sesión activa al instante (sin esperar el clic en email). El aspirante puede entrar inmediatamente después de registrarse.

---

## PASO 2 · Google Cloud Console — Crear OAuth credentials

1. Ve a https://console.cloud.google.com/apis/credentials
2. Si no tienes proyecto: **"New Project"** → nombre "MéritoPro" → Create.
3. Lateral izquierdo: **APIs & Services → OAuth consent screen**.
   - User Type: **External**.
   - App name: **MéritoPro**.
   - User support email: tu correo.
   - Developer contact: tu correo.
   - Save and continue → en Scopes, dejar lo de por defecto → Save.
   - Test users: añade tu propio correo (durante la beta, hasta verificación).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: "MéritoPro Web".
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (dev)
     - `https://<tu-dominio>.vercel.app` (preview Vercel)
     - `https://meritopro.co` (producción, cuando tengas dominio)
   - **Authorized redirect URIs:**
     - `https://<tu-proyecto>.supabase.co/auth/v1/callback`

   La URL de Supabase la ves en Supabase Dashboard → Settings → API → "URL".
5. Click **Create**. Copia el **Client ID** y el **Client Secret** (modal al cerrar lo verás sólo una vez).

---

## PASO 3 · Supabase Dashboard — Habilitar Google provider

1. Ve a https://supabase.com/dashboard/project/<tu-proyecto>/auth/providers
2. Click en **Google**.
3. Toggle **"Enable Sign in with Google"**.
4. Pega:
   - **Client ID** (paso 2.5).
   - **Client Secret** (paso 2.5).
5. **Skip nonce checks**: déjalo como está (Supabase recomienda dejarlo activado).
6. Click **Save**.

---

## PASO 4 · Supabase Dashboard — Configurar redirect URLs

Esto evita que Supabase rechace el callback.

1. Settings → Authentication → **URL Configuration**.
2. **Site URL**: `http://localhost:3000` (dev) o `https://meritopro.co` (prod).
3. **Redirect URLs** (lista — añade todas las que apliquen):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login/restablecer`
   - `https://<tu-dominio>.vercel.app/auth/callback`
   - `https://<tu-dominio>.vercel.app/login/restablecer`
   - `https://meritopro.co/auth/callback`
   - `https://meritopro.co/login/restablecer`
4. **Save**.

---

## PASO 5 · Verificación

En local:

1. `npm run dev`
2. Abre `http://localhost:3000/login`
3. Click **"Continuar con Google"**.
4. Te redirige a Google (selector de cuenta).
5. Eliges tu correo → consientes los permisos básicos.
6. Vuelves a `/auth/callback?code=...&next=/dashboard`.
7. Aterrizas en `/dashboard` con sesión activa.

Si algo falla en el callback (URL no autorizada, código inválido), te lleva a `/login?error=oauth_callback_failed`.

---

## Por qué este es el camino más simple para el cliente

| Vía | Pasos del aspirante | Riesgo de fricción |
|---|---|---|
| **Google OAuth** | 1. Click "Continuar con Google" · 2. Elegir cuenta · 3. Listo. | Mínimo — la mayoría de aspirantes ya tienen Gmail. |
| Email/password con confirmación | 1. Llenar 3 campos · 2. Esperar correo · 3. Buscar en spam · 4. Clic · 5. Volver a la app · 6. Iniciar sesión | Alto — si el SMTP de Supabase está mal configurado el correo nunca llega. |
| Email/password sin confirmación | 1. Llenar 3 campos · 2. Listo (auto-login). | Medio — el aspirante puede olvidar la contraseña. |

**Recomendación final para la beta:** ofrecer Google como botón principal arriba, email/password como alternativa, y deshabilitar confirmación de correo durante las 4 semanas de beta. Re-activar confirmación después con SMTP real (Resend o Postmark).

---

## Sobre Facebook OAuth

No lo recomiendo para la beta:

1. Requiere registrar aplicación en **Facebook for Developers** + business verification (documentos legales de la empresa, demora 5-7 días).
2. La cuota de adopción de Facebook como proveedor de identidad ha caído fuerte vs Gmail; en Colombia, Gmail tiene ~80 % vs ~15 % Facebook entre profesionales.
3. Mantener dos OAuth providers duplica el costo de soporte sin upside claro.

Si en el futuro alguien lo pide explícitamente, se puede añadir en sprint+1: misma estructura que Google, pero `provider: 'facebook'` y credenciales de Facebook Developers.

---

## Variables de entorno opcionales relacionadas

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://meritopro.co  # opcional — sólo para forzar el origin en redirectTo
```

Si no se define, el código usa los headers `x-forwarded-host` / `host` de la request — funciona automático en Vercel y en local.
