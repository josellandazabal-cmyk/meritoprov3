'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================
// Server action — Carga del contexto_usuario para el diagnóstico
//
// La REGLA de hiper-personalización de Directivas_Agentes_V4.md exige que
// el orquestador conozca al menos el `cargo_aspira` del aspirante para
// generar preguntas relevantes (y citar normas asociadas a la OPEC).
// El diagnóstico corre antes del login, por lo que esta acción sólo se
// apoya en la fila pública de `leads` (RLS migración 0002).
// ============================================================

export interface ContextoUsuarioCliente {
  cargo_aspira: string;
  // Reservado para iteración futura — en pre-pago aún no tenemos progreso
  // SM-2 ni nivel educativo. Los defaults del orquestador cubren el resto.
}

const FALLBACK: ContextoUsuarioCliente = {
  cargo_aspira: 'aspirante PGN',
};

/**
 * Devuelve el contexto mínimo para inyectar en el payload del orquestador.
 *
 * - Si Supabase no está configurado, devuelve el fallback genérico.
 * - Si el lead no existe (UUID inventado) o RLS bloquea la lectura,
 *   también devuelve el fallback (nunca lanza — el diagnóstico debe seguir).
 * - El servidor nunca expone celular ni email; sólo el `cargo_aspira`
 *   sale del Server Action.
 */
export async function obtenerContextoLead(
  leadId: string
): Promise<ContextoUsuarioCliente> {
  if (
    !leadId ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return FALLBACK;
  }

  // Validación defensiva — el segmento dinámico viene del URL y queremos
  // evitar consultas con basura. UUID v4 estándar.
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(leadId)) {
    return FALLBACK;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('leads')
      .select('cargo_aspira')
      .eq('id', leadId)
      .maybeSingle();

    if (error) {
      console.warn('[Diagnostico] Error leyendo lead:', error.message);
      return FALLBACK;
    }
    if (!data?.cargo_aspira) return FALLBACK;

    return { cargo_aspira: data.cargo_aspira };
  } catch (error) {
    console.warn('[Diagnostico] Excepción leyendo lead:', error);
    return FALLBACK;
  }
}
