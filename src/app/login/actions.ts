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
    const mensaje =
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message === 'Email not confirmed'
          ? 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
          : 'No pudimos iniciar sesión. Intenta de nuevo en unos segundos.';
    return { errors: { _form: [mensaje] } };
  }

  redirect('/dashboard');
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
  const { error } = await supabase.auth.resetPasswordForEmail(
    validados.data.email,
    { redirectTo: `${origin}/login/restablecer` }
  );

  if (error) {
    console.error('[Login] resetPasswordForEmail:', error.message);
    // Mensaje seguro: no filtramos el motivo exacto al cliente.
    return {
      errors: {
        _form: [
          'No pudimos enviar el correo de recuperación. Intenta de nuevo en unos minutos.',
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
