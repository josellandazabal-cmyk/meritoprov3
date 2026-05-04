'use server';

// ============================================================
// /dashboard/completar-perfil — server action
//
// Guarda los 4 datos críticos para personalización:
//   · cargo_aspira  → leads.cargo_aspira (crea lead si no existe)
//   · nivel_cargo   → usuarios.nivel_cargo
//   · profesion     → usuarios.profesion
//   · fecha_examen  → usuarios.fecha_examen
//
// El cargo lo guardamos vía leads (no en usuarios.opec_seleccionada
// directamente) para que el flow sea consistente con el funnel de
// landing donde el cargo siempre nace en leads.
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { obtenerEstadoPerfil } from '@/lib/perfil/completitud';

/**
 * Wrapper expuesto como server action para que client components
 * (entrenar, tutor) puedan consultar si el perfil está completo
 * y aplicar el gate de UX correspondiente.
 */
export async function consultarPerfilCompleto(): Promise<{ completo: boolean }> {
  const estado = await obtenerEstadoPerfil();
  return { completo: estado.completo };
}

const PerfilSchema = z.object({
  cargo_aspira: z.string().min(2).max(120),
  nivel_cargo: z.enum([
    'directivo',
    'asesor',
    'ejecutivo',
    'profesional',
    'tecnico',
    'administrativo',
    'operativo',
  ]),
  profesion: z.string().min(2).max(120),
  fecha_examen: z.string().min(10).max(10), // YYYY-MM-DD
});

export type PerfilInput = z.infer<typeof PerfilSchema>;

export interface ResultadoGuardarPerfil {
  ok: boolean;
  error?: string;
}

export async function guardarPerfilCompleto(
  input: PerfilInput
): Promise<ResultadoGuardarPerfil> {
  const parsed = PerfilSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos. Revisa todos los campos.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'No autenticado' };

    const { cargo_aspira, nivel_cargo, profesion, fecha_examen } = parsed.data;

    // 1) Asegurar fila en usuarios (puede no existir si signup OAuth incompleto)
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id, lead_id')
      .eq('id', user.id)
      .maybeSingle();

    let leadId = usuarioExistente?.lead_id ?? null;

    // 2) Crear o reutilizar lead
    if (!leadId) {
      // Buscar lead existente por email (puede haber uno del funnel landing)
      const { data: leadPorEmail } = await supabase
        .from('leads')
        .select('id')
        .eq('email', user.email ?? '')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadPorEmail) {
        leadId = leadPorEmail.id;
        // Actualizar el cargo en el lead existente
        await supabase
          .from('leads')
          .update({ cargo_aspira })
          .eq('id', leadId);
      } else {
        // Crear lead nuevo
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const nombre =
          (typeof meta.nombre === 'string' && meta.nombre) ||
          (typeof meta.full_name === 'string' && meta.full_name) ||
          user.email?.split('@')[0] ||
          'Aspirante';
        const { data: leadNuevo, error: leadError } = await supabase
          .from('leads')
          .insert({
            nombre,
            email: user.email ?? '',
            celular: '0000000000', // placeholder; el celular no se pide en este flow
            cargo_aspira,
            fuente: 'landing',
          })
          .select('id')
          .single();
        if (leadError) {
          console.error('[CompletarPerfil] Error creando lead:', leadError.message);
          return { ok: false, error: 'No se pudo guardar tu información.' };
        }
        leadId = leadNuevo.id;
      }
    } else {
      // Lead existe → actualizar cargo
      await supabase
        .from('leads')
        .update({ cargo_aspira })
        .eq('id', leadId);
    }

    // 3) Upsert usuarios con todos los datos
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .upsert(
        {
          id: user.id,
          lead_id: leadId,
          profesion,
          nivel_cargo,
          fecha_examen,
        },
        { onConflict: 'id' }
      );

    if (usuarioError) {
      console.error('[CompletarPerfil] Error upsert usuarios:', usuarioError.message);
      return { ok: false, error: 'No se pudo guardar tu perfil.' };
    }

    // Invalidar caché del dashboard para que el gate refleje el nuevo estado
    revalidatePath('/dashboard', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('[CompletarPerfil] Error inesperado:', error);
    return { ok: false, error: 'Error inesperado. Intenta de nuevo.' };
  }
}
