'use server';

import { createClient } from '@/lib/supabase/server';
import { inferirSlugModulo } from '@/lib/diagnostico/modulos';

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
  // true cuando el simulacro se está corriendo desde una sesión auth
  // (vía /dashboard/diagnostico-inicial). El componente lo usa para
  // decidir el destino del CTA al terminar:
  //   - autenticado=true  → /dashboard/diagnostico (vista de resultados)
  //   - autenticado=false → /checkout?lead_id=X    (pre-pago, lead real)
  autenticado: boolean;
}

const FALLBACK: ContextoUsuarioCliente = {
  cargo_aspira: 'aspirante PGN',
  autenticado: false,
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

    // ¿Hay sesión activa? El cliente del simulacro lo necesita para
    // saber a dónde redirigir cuando termine el test.
    const { data: { user } } = await supabase.auth.getUser();
    const autenticado = !!user;

    // 1) Buscar como lead directo (modo anónimo, pre-pago)
    const { data: leadRow } = await supabase
      .from('leads')
      .select('cargo_aspira')
      .eq('id', leadId)
      .maybeSingle();

    if (leadRow?.cargo_aspira) {
      return { cargo_aspira: leadRow.cargo_aspira, autenticado };
    }

    // 2) Modo autenticado — el `leadId` que llega puede ser realmente
    // el `user.id`. Buscar `usuarios.lead_id` y leer cargo_aspira desde ahí.
    const { data: userRow } = await supabase
      .from('usuarios')
      .select('lead_id')
      .eq('id', leadId)
      .maybeSingle();

    if (userRow?.lead_id) {
      const { data: leadVinculado } = await supabase
        .from('leads')
        .select('cargo_aspira')
        .eq('id', userRow.lead_id)
        .maybeSingle();
      if (leadVinculado?.cargo_aspira) {
        return { cargo_aspira: leadVinculado.cargo_aspira, autenticado };
      }
    }

    return { ...FALLBACK, autenticado };
  } catch (error) {
    console.warn('[Diagnostico] Excepción leyendo lead:', error);
    return FALLBACK;
  }
}

// ============================================================
// Persistir respuesta del diagnóstico
//
// Se llama desde el cliente al confirmar cada respuesta. Acepta
// modo anónimo (lead_id, sin user) y modo autenticado (con user_id
// además del lead_id). Si hay sesión activa, prioriza user_id para
// que el resultado se vea en /dashboard/diagnostico.
//
// Codifica el `modulo` dentro del `pregunta_id` con separador `::`
// para que `obtenerDiagnosticoModulos` pueda agrupar sin requerir
// una columna nueva en la tabla (sin migración SQL).
// Formato: "<slug-modulo>::<id-pregunta-original>"
// ============================================================
export interface RespuestaDiagnostico {
  leadId: string;
  preguntaId: string;
  respuesta: string;
  correcta: boolean;
  tiempoMs: number;
  modulo?: string;
}

export async function guardarRespuestaDiagnostico(
  payload: RespuestaDiagnostico
): Promise<{ ok: boolean }> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(payload.leadId)) {
    return { ok: false };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const slug = inferirSlugModulo(payload.modulo);
    // Codificar módulo en el pregunta_id con separador "::" para
    // poder agrupar después sin requerir una columna nueva.
    const preguntaIdConModulo = `${slug}::${payload.preguntaId}`;

    const fila: Record<string, unknown> = {
      pregunta_id: preguntaIdConModulo,
      respuesta: payload.respuesta,
      correcta: payload.correcta,
      tiempo_respuesta_ms: payload.tiempoMs,
      sesion_tipo: 'diagnostico',
    };

    if (user) {
      fila.user_id = user.id;
    } else {
      fila.lead_id = payload.leadId;
    }

    const { error } = await supabase.from('respuestas_preguntas').insert(fila);
    if (error) {
      console.warn('[Diagnostico] Error guardando respuesta:', error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.warn('[Diagnostico] Excepción guardando respuesta:', error);
    return { ok: false };
  }
}
