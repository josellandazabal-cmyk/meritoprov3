'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// Schemas Zod
// ============================================================
const credencialesSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
});

const registroSchema = credencialesSchema.extend({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
});

const recuperarSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
});

const nuevaPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña es demasiado larga'),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirm'],
  });

// ============================================================
// Tipos de estado para useActionState
// ============================================================
export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    password_confirm?: string[];
    nombre?: string[];
    _form?: string[];
  };
  mensaje?: string;
};

// ============================================================
// Acción: Iniciar sesión
// ============================================================
export async function iniciarSesion(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validados = credencialesSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validados.success) {
    return { errors: validados.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validados.data.email,
    password: validados.data.password,
  });

  if (error) {
    // Mensaje genérico cuando Supabase devuelve "Invalid login credentials":
    // la API moderna de Supabase devuelve este código tanto para passwords
    // realmente incorrectos como para cuentas sin confirmar (no leak de
    // si la cuenta existe). Por eso mencionamos ambas posibilidades.
    const mensaje =
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos. Si acabas de registrarte, revisa tu bandeja para confirmar el correo, o usa "Continuar con Google".'
        : error.message === 'Email not confirmed'
          ? 'Tu correo aún no ha sido confirmado. Revisa tu bandeja (y la carpeta de spam) o entra con Google.'
          : 'No pudimos iniciar sesión. Intenta de nuevo en unos segundos.';
    return { errors: { _form: [mensaje] } };
  }

  redirect('/dashboard');
}

// ============================================================
// Acción: Login con Google OAuth (un click, sin password)
//
// Recomendado para la beta: elimina la fricción del registro/login y
// del correo de confirmación. Supabase maneja el OAuth en su backend;
// el aspirante hace click → Google le pide consentimiento → Supabase
// crea la sesión → redirect a /dashboard.
//
// Requisitos:
//   1. En el dashboard de Supabase, Authentication → Providers → Google
//      habilitado, con Client ID y Client Secret de Google Cloud Console.
//   2. La URL `${origin}/auth/callback` añadida a Authorized redirect
//      URIs en Google Cloud Console + Supabase Auth Redirect URLs.
// ============================================================
export async function iniciarSesionGoogle(): Promise<void> {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.url) {
    console.error('[Login] Google OAuth init falló:', error?.message);
    redirect('/login?error=google_oauth_failed');
  }

  redirect(data.url);
}

// ============================================================
// Acción: Crear cuenta
// ============================================================
export async function registrar(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validados = registroSchema.safeParse({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validados.success) {
    return { errors: validados.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validados.data.email,
    password: validados.data.password,
    options: {
      data: { nombre: validados.data.nombre },
    },
  });

  if (error) {
    const mensaje =
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already been registered')
        ? 'Este correo ya tiene una cuenta. Inicia sesión.'
        : 'No pudimos crear la cuenta. Intenta de nuevo.';
    return { errors: { _form: [mensaje] } };
  }

  // Si Supabase tiene "Confirm email" activado, session será null y hay que verificar.
  if (data.session) {
    redirect('/dashboard');
  }

  return {
    mensaje:
      'Cuenta creada. Te enviamos un correo para confirmar tu dirección — revisa tu bandeja de entrada (y la carpeta de spam).',
  };
}

// ============================================================
// Acción: Cerrar sesión
// ============================================================
export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

// ============================================================
// Acción: Enviar correo de recuperación de contraseña
//
// Supabase envía un email con un enlace mágico que aterriza en
// `${origin}/login/restablecer`. Allí, la sesión "recovery" queda
// activa y el usuario puede llamar a `actualizarPassword` con la
// nueva contraseña.
//
// Nota de privacidad: NO revelamos si el email existe o no — Supabase
// devuelve OK en ambos casos para evitar enumeración. El mensaje al
// usuario es genérico.
// ============================================================
export async function solicitarRecuperacion(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validados = recuperarSchema.safeParse({ email: formData.get('email') });
  if (!validados.success) {
    return { errors: validados.error.flatten().fieldErrors };
  }

  // Construimos el redirectTo a partir del host de la request — funciona en
  // dev (localhost:3000) y en cualquier despliegue sin variable adicional.
  // Fallback a NEXT_PUBLIC_SITE_URL si está configurada.
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const supabase = await createClient();
  // Importante: el redirectTo pasa por /auth/callback?next=... porque
  // Supabase usa flow PKCE — el correo trae un `code` que debe
  // intercambiarse por sesión ANTES de aterrizar en el form. Si
  // redirectTo apunta directo a /login/restablecer, supabase.auth.getUser()
  // devuelve null y el form no puede invocar updateUser().
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent('/login/restablecer')}`;
  console.log('[Login] resetPasswordForEmail → redirectTo:', redirectTo);

  const { error } = await supabase.auth.resetPasswordForEmail(
    validados.data.email,
    { redirectTo }
  );

  if (error) {
    console.error('[Login] resetPasswordForEmail FALLÓ:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });

    // Si es rate-limit, mostramos un mensaje más específico
    const esRateLimit =
      error.status === 429 ||
      error.message.toLowerCase().includes('rate') ||
      error.message.toLowerCase().includes('limit') ||
      error.message.toLowerCase().includes('exceeded');

    return {
      errors: {
        _form: [
          esRateLimit
            ? 'Se alcanzó el límite de correos. Espera unos minutos antes de intentar de nuevo.'
            : 'No pudimos enviar el correo de recuperación. Intenta de nuevo en unos minutos.',
        ],
      },
    };
  }

  return {
    mensaje:
      'Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y la carpeta de spam).',
  };
}

// ============================================================
// Acción: Actualizar contraseña (post-link)
//
// Se invoca desde /login/restablecer después de que el usuario abre
// el enlace del correo. Supabase ya estableció una sesión "recovery"
// vía cookies, así que `updateUser` funciona sin más auth.
// ============================================================
export async function actualizarPassword(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validados = nuevaPasswordSchema.safeParse({
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
  });
  if (!validados.success) {
    return { errors: validados.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // Verificamos que haya una sesión recovery activa antes de actualizar.
  // Si el enlace expiró o nunca se abrió, getUser devuelve null.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      errors: {
        _form: [
          'El enlace de recuperación expiró o no es válido. Solicita uno nuevo.',
        ],
      },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: validados.data.password,
  });

  if (error) {
    console.error('[Login] updateUser password:', error.message);
    return {
      errors: {
        _form: [
          'No pudimos actualizar la contraseña. Solicita un nuevo enlace de recuperación.',
        ],
      },
    };
  }

  redirect('/dashboard');
}
