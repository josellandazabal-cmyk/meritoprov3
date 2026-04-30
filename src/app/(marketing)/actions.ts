'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Schema de validación con Zod — strict
const leadSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z
    .string()
    .email('Ingresa un correo electrónico válido'),
  celular: z
    .string()
    .min(7, 'El celular debe tener al menos 7 dígitos')
    .max(15, 'El celular es demasiado largo')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de celular inválido'),
  cargo_aspira: z
    .string()
    .min(1, 'Selecciona un cargo'),
  acepta_datos: z
    .literal('on', {
      message: 'Debes autorizar el tratamiento de datos para continuar',
    }),
});

function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export type LeadFormState = {
  errors?: {
    nombre?: string[];
    email?: string[];
    celular?: string[];
    cargo_aspira?: string[];
    acepta_datos?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function crearLead(
  prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  // Validar con Zod
  const validatedFields = leadSchema.safeParse({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    celular: formData.get('celular'),
    cargo_aspira: formData.get('cargo_aspira'),
    acepta_datos: formData.get('acepta_datos'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nombre, email, celular, cargo_aspira } = validatedFields.data;

  let leadId: string;

  try {
    if (supabaseConfigurado()) {
      // Persistencia real en Supabase. La RLS pública del schema permite el
      // INSERT anónimo (rol `anon`); sólo capturamos los campos del funnel.
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('leads')
        .insert({
          nombre,
          email,
          celular,
          cargo_aspira,
          fuente: 'landing',
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        console.error('[MéritoPro] Error insertando lead:', error?.message);

        // En desarrollo, no bloqueamos el funnel si la tabla `leads` no
        // está creada todavía o RLS rechaza el INSERT — caemos al UUID
        // local para que el equipo pueda seguir probando el diagnóstico.
        // En producción, sí devolvemos error visible al usuario.
        if (process.env.NODE_ENV !== 'production') {
          leadId = crypto.randomUUID();
          console.warn(
            '[MéritoPro] Fallback dev: lead no persistido, leadId local =',
            leadId,
            '· Hint: corre supabase/migrations/0000_foundation_v3.sql.'
          );
        } else {
          return {
            errors: {
              _form: [
                'Hubo un error al procesar tu solicitud. Intenta de nuevo.',
              ],
            },
          };
        }
      } else {
        leadId = data.id as string;
      }
    } else {
      // Fallback de desarrollo: sin Supabase, generamos un id local.
      // El diagnóstico funcionará pero no podrá leer cargo_aspira (cae al
      // default 'aspirante PGN' del orquestador).
      leadId = crypto.randomUUID();
      console.warn(
        '[MéritoPro] Supabase no configurado — lead no persistido. leadId local:',
        leadId
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('[MéritoPro] Excepción en crearLead:', error);
    return {
      errors: {
        _form: ['Hubo un error al procesar tu solicitud. Intenta de nuevo.'],
      },
    };
  }

  // El redirect SIEMPRE va fuera del try/catch: Next.js implementa la redirección
  // lanzando una excepción NEXT_REDIRECT y atraparla aquí rompería el flujo.
  redirect(`/diagnostico/${leadId}`);
}
