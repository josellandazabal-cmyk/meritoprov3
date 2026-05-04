// ============================================================
// Helper para chequear si el perfil del usuario está "completo"
//
// Un perfil completo es PRERREQUISITO para:
//   · Hacer el diagnóstico inicial
//   · Acceder a entrenar / tutor
//   · Recibir remarketing personalizado
//   · Que el RAG del Tutor adapte respuestas al cargo/nivel
//
// Sin estos datos, los agentes IA no pueden hiper-personalizar y el
// remarketing es ciego. Por eso se gateó la app entera.
// ============================================================

import { createClient } from '@/lib/supabase/server';

export interface EstadoPerfil {
  /** Si el usuario está autenticado. */
  autenticado: boolean;
  /** Si tiene los 4 campos mínimos (cargo, nivel, profesión, fecha examen). */
  completo: boolean;
  /** Datos actuales (vacío si la fila no existe). */
  cargoAspira: string;
  nivelCargo: string;
  profesion: string;
  fechaExamen: string | null;
}

const ESTADO_DEFAULT: EstadoPerfil = {
  autenticado: false,
  completo: false,
  cargoAspira: '',
  nivelCargo: '',
  profesion: '',
  fechaExamen: null,
};

export async function obtenerEstadoPerfil(): Promise<EstadoPerfil> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ESTADO_DEFAULT;

    // Cargo aspira viene de leads (vía lead_id en usuarios) o de
    // usuarios.opec_seleccionada como fallback.
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('lead_id, profesion, nivel_cargo, fecha_examen, opec_seleccionada')
      .eq('id', user.id)
      .maybeSingle();

    let cargoAspira = '';
    if (usuario?.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('cargo_aspira')
        .eq('id', usuario.lead_id)
        .maybeSingle();
      cargoAspira = lead?.cargo_aspira ?? '';
    }
    if (!cargoAspira && usuario?.opec_seleccionada) {
      cargoAspira = usuario.opec_seleccionada;
    }

    const profesion = usuario?.profesion?.trim() ?? '';
    const nivelCargo = usuario?.nivel_cargo ?? '';
    const fechaExamen = usuario?.fecha_examen ?? null;

    const completo =
      Boolean(cargoAspira) &&
      Boolean(nivelCargo) &&
      Boolean(profesion) &&
      Boolean(fechaExamen);

    return {
      autenticado: true,
      completo,
      cargoAspira,
      nivelCargo,
      profesion,
      fechaExamen,
    };
  } catch {
    return ESTADO_DEFAULT;
  }
}
