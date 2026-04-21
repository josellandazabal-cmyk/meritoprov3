'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

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
});

export type LeadFormState = {
  errors?: {
    nombre?: string[];
    email?: string[];
    celular?: string[];
    cargo_aspira?: string[];
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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nombre, email, celular, cargo_aspira } = validatedFields.data;

  // Intentar insertar en Supabase
  try {
    // NOTE: En producción, usar createClient() de lib/supabase/server.ts
    // Por ahora, generamos un ID local para la demo
    const leadId = crypto.randomUUID();

    // TODO: Descomentar cuando Supabase esté configurado:
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('leads')
    //   .insert({
    //     nombre,
    //     email,
    //     celular,
    //     cargo_aspira,
    //     fuente: 'landing',
    //   })
    //   .select('id')
    //   .single();
    // if (error) throw error;
    // const leadId = data.id;

    console.log('[MéritoPro] Lead creado:', { leadId, nombre, email, celular, cargo_aspira });

    redirect(`/diagnostico/${leadId}`);
  } catch (error) {
    // Re-throw redirect errors (Next.js uses them internally)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    return {
      errors: {
        _form: ['Hubo un error al procesar tu solicitud. Intenta de nuevo.'],
      },
    };
  }
}
