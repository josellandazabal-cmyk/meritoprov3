'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================
// Server action — Carga del contexto_usuario auth-aware (H6.b)
//
// Para el Bucle Diario el aspirante YA está autenticado, por lo que
// podemos cruzar:
//   · public.usuarios   → cargo_aspira (vía leads.cargo_aspira), profesion
//   · public.sm2_repetition → buckets de dominio (alto/medio/brecha)
// y armar el `contexto_usuario` que exige el ContextoUsuarioSchema del
// orquestador (Directivas_Agentes_V4.md §1).
//
// Caer al fallback genérico (cargo "aspirante PGN" + buckets vacíos) si:
//   · Supabase no está configurado.
//   · No hay sesión activa.
//   · El usuario no tiene perfil en `usuarios` todavía (recién registrado).
// ============================================================

export interface ContextoUsuarioBucle {
  user_id: string; // session id para el LRU del orquestador
  cargo_aspira: string;
  profesion: string;
  progreso_sm2: {
    dominio_alto: string[];
    dominio_medio: string[];
    brechas: string[];
  };
  dias_hasta_concurso: number;
  indice_preparacion_actual: number;
}

const FALLBACK: ContextoUsuarioBucle = {
  user_id: 'bucle-diario',
  cargo_aspira: 'aspirante PGN',
  profesion: 'no_declarada',
  progreso_sm2: { dominio_alto: [], dominio_medio: [], brechas: [] },
  dias_hasta_concurso: 180,
  indice_preparacion_actual: 0,
};

// ------------------------------------------------------------
// Buckets de dominio según e-factor del algoritmo SM-2
// e-factor crece con cada respuesta correcta (cap 2.5) y baja a 1.3
// con fallos consecutivos. Los umbrales reflejan la convención de la
// literatura SM-2: ≥2.3 ya es retención cómoda; <1.8 hay brecha real.
// repetition_count<2 también cuenta como brecha (no se ha consolidado).
// ------------------------------------------------------------

const UMBRAL_DOMINIO_ALTO = 2.3;
const UMBRAL_DOMINIO_MEDIO = 1.8;
const REPETICIONES_MIN_PARA_DOMINIO = 2;

interface FilaSM2 {
  tema_relacionado: string | null;
  e_factor: number;
  repetition_count: number;
  updated_at: string;
}

function clasificarTema(fila: FilaSM2): 'alto' | 'medio' | 'brecha' {
  if (fila.repetition_count < REPETICIONES_MIN_PARA_DOMINIO) return 'brecha';
  if (fila.e_factor >= UMBRAL_DOMINIO_ALTO) return 'alto';
  if (fila.e_factor >= UMBRAL_DOMINIO_MEDIO) return 'medio';
  return 'brecha';
}

function agregarPorTema(filas: FilaSM2[]): {
  dominio_alto: string[];
  dominio_medio: string[];
  brechas: string[];
} {
  // Por tema, conservamos sólo el registro más reciente (proxy del estado
  // SM-2 vigente). Si hay varios pregunta_id por tema, gana el último.
  const ultimoPorTema = new Map<string, FilaSM2>();
  for (const f of filas) {
    if (!f.tema_relacionado) continue;
    const prev = ultimoPorTema.get(f.tema_relacionado);
    if (!prev || prev.updated_at < f.updated_at) {
      ultimoPorTema.set(f.tema_relacionado, f);
    }
  }

  const dominio_alto: string[] = [];
  const dominio_medio: string[] = [];
  const brechas: string[] = [];
  for (const fila of ultimoPorTema.values()) {
    const cat = clasificarTema(fila);
    if (cat === 'alto') dominio_alto.push(fila.tema_relacionado!);
    else if (cat === 'medio') dominio_medio.push(fila.tema_relacionado!);
    else brechas.push(fila.tema_relacionado!);
  }
  return { dominio_alto, dominio_medio, brechas };
}

function calcularDiasHastaConcurso(fechaExamenIso: string | null): number {
  if (!fechaExamenIso) return 180;
  const fecha = new Date(fechaExamenIso).getTime();
  if (Number.isNaN(fecha)) return 180;
  const diff = Math.round((fecha - Date.now()) / (1000 * 60 * 60 * 24));
  // Acotamos a [0, 365]: el orquestador usa esto para calibrar urgencia.
  return Math.max(0, Math.min(365, diff));
}

// ------------------------------------------------------------
// Acción principal
// ------------------------------------------------------------

/**
 * Devuelve el contexto_usuario completo para el Bucle Diario. Nunca lanza:
 * cualquier fallo cae al `FALLBACK` y deja al orquestador trabajar con
 * defaults seguros (REGLA 4 V4 sigue garantizando rechazo literal si no
 * hay base normativa).
 */
export async function obtenerContextoUsuarioAutenticado(): Promise<ContextoUsuarioBucle> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return FALLBACK;
  }

  try {
    const supabase = await createClient();

    // 1) Sesión activa
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return FALLBACK;
    }

    // 2) Perfil + cargo (join implícito vía dos selects para evitar
    //    depender de la sintaxis de Supabase Embedded Resources, que
    //    requiere foreign key explícita en la API REST).
    const [{ data: perfil }, { data: filasSM2 }] = await Promise.all([
      supabase
        .from('usuarios')
        .select('lead_id, profesion, fecha_examen, probabilidad_aprobar_actual')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('sm2_repetition')
        .select('tema_relacionado, e_factor, repetition_count, updated_at')
        .eq('user_id', user.id),
    ]);

    let cargoAspira = FALLBACK.cargo_aspira;
    if (perfil?.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('cargo_aspira')
        .eq('id', perfil.lead_id)
        .maybeSingle();
      if (lead?.cargo_aspira) cargoAspira = lead.cargo_aspira;
    }

    const progreso = agregarPorTema((filasSM2 ?? []) as FilaSM2[]);

    return {
      user_id: user.id,
      cargo_aspira: cargoAspira,
      profesion: perfil?.profesion?.trim() || FALLBACK.profesion,
      progreso_sm2: progreso,
      dias_hasta_concurso: calcularDiasHastaConcurso(perfil?.fecha_examen ?? null),
      indice_preparacion_actual: Math.round(
        Math.max(0, Math.min(100, perfil?.probabilidad_aprobar_actual ?? 0))
      ),
    };
  } catch (error) {
    console.warn('[Bucle Diario] obtenerContextoUsuarioAutenticado falló:', error);
    return FALLBACK;
  }
}
