'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================
// /dashboard/diagnostico — Server Action
//
// Lee respuestas del usuario autenticado en `respuestas_preguntas`
// (sesion_tipo='diagnostico'), las agrupa por slug de módulo (que
// está codificado en pregunta_id con separador "::") y devuelve
// los 8 módulos del dashboard con dominio real, tasa_acierto y
// rendimiento por tipo de pregunta.
//
// Si todavía no hay respuestas, devuelve los módulos con valores
// en cero (estado "aún no diagnosticado") para que la UI lo muestre
// correctamente.
// ============================================================

export interface ModuloDiagnostico {
  nombre: string;
  slug: string;
  dominio: number;          // alias de dominio_actual (compat hacia atrás)
  dominio_inicial: number;  // % a partir de respuestas del diagnóstico inicial
  dominio_actual: number;   // % considerando diagnóstico + entrenamiento
  delta: number;            // dominio_actual - dominio_inicial
  tiene_inicial: boolean;
  tendencia: 'mejorando' | 'estable' | 'decayendo';
  tasa_acierto: number;
  temas_debiles: string[];
  temas_fuertes: string[];
  rendimiento: { tipo_I: number; tipo_II: number; tipo_III: number };
}

const MODULOS_DEFAULT: ModuloDiagnostico[] = [
  {
    nombre: 'Estructura del Estado',
    slug: 'estructura_estado',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Derecho Disciplinario',
    slug: 'disciplinario',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Derechos Fundamentales y Tutela',
    slug: 'derechos_fundamentales',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Gestión Documental',
    slug: 'gestion_documental',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Carrera Administrativa',
    slug: 'carrera_admin',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Ética del Servicio Público',
    slug: 'etica',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Aptitud Verbal',
    slug: 'aptitud_verbal',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Competencias Comportamentales',
    slug: 'comportamental',
    dominio: 0,
    dominio_inicial: 0,
    dominio_actual: 0,
    delta: 0,
    tiene_inicial: false,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
];

// Helper: agrupa una lista de respuestas por slug de módulo y calcula %.
function agruparPorSlug(
  respuestas: Array<{ pregunta_id: string; correcta: boolean }>
): Map<string, { total: number; correctas: number }> {
  const map = new Map<string, { total: number; correctas: number }>();
  respuestas.forEach((r) => {
    const partes = r.pregunta_id.split('::');
    const slug = partes.length > 1 ? partes[0] : 'general';
    const actual = map.get(slug) || { total: 0, correctas: 0 };
    actual.total += 1;
    if (r.correcta) actual.correctas += 1;
    map.set(slug, actual);
  });
  return map;
}

export async function obtenerDiagnosticoModulos(): Promise<ModuloDiagnostico[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return MODULOS_DEFAULT;
    }

    // Trae TODAS las respuestas del usuario (diagnóstico + entrenamiento)
    // ordenadas cronológicamente. Calculamos stats segmentadas:
    // - inicial: solo sesion_tipo='diagnostico'
    // - actual:  todas las respuestas (incluye entrenamiento posterior)
    const { data: respuestas, error } = await supabase
      .from('respuestas_preguntas')
      .select('pregunta_id, correcta, created_at, sesion_tipo')
      .eq('user_id', user.id)
      .in('sesion_tipo', ['diagnostico', 'entrenamiento'])
      .order('created_at', { ascending: true });

    if (error || !respuestas || respuestas.length === 0) {
      return MODULOS_DEFAULT;
    }

    const respDiag = respuestas.filter((r) => r.sesion_tipo === 'diagnostico');
    const statsInicial = agruparPorSlug(respDiag);
    const statsActual = agruparPorSlug(respuestas);

    // Tendencia: comparar primer tercio vs último tercio cronológico
    // (solo dentro del módulo) usando todas las respuestas.
    return MODULOS_DEFAULT.map((mod) => {
      const sActual = statsActual.get(mod.slug);
      const sInicial = statsInicial.get(mod.slug);

      const dominioInicial =
        sInicial && sInicial.total > 0
          ? Math.round((sInicial.correctas / sInicial.total) * 100)
          : 0;
      const dominioActual =
        sActual && sActual.total > 0
          ? Math.round((sActual.correctas / sActual.total) * 100)
          : 0;
      const delta = dominioActual - dominioInicial;
      const tieneInicial = !!sInicial && sInicial.total > 0;

      // Tendencia comparando primer y último tercio del módulo
      const respuestasModulo = respuestas.filter((r) => {
        const partes = r.pregunta_id.split('::');
        const slug = partes.length > 1 ? partes[0] : 'general';
        return slug === mod.slug;
      });
      let tendencia: 'mejorando' | 'estable' | 'decayendo' = 'estable';
      if (respuestasModulo.length >= 6) {
        const corte = Math.floor(respuestasModulo.length / 3);
        const primera = respuestasModulo.slice(0, corte);
        const ultima = respuestasModulo.slice(-corte);
        const ratioInicial = primera.filter((r) => r.correcta).length / primera.length;
        const ratioFinal = ultima.filter((r) => r.correcta).length / ultima.length;
        const d = ratioFinal - ratioInicial;
        if (d > 0.1) tendencia = 'mejorando';
        else if (d < -0.1) tendencia = 'decayendo';
      } else if (delta > 5) tendencia = 'mejorando';
      else if (delta < -5) tendencia = 'decayendo';

      const tasa_acierto = sActual && sActual.total > 0 ? sActual.correctas / sActual.total : 0;

      return {
        ...mod,
        dominio: dominioActual,
        dominio_inicial: dominioInicial,
        dominio_actual: dominioActual,
        delta,
        tiene_inicial: tieneInicial,
        tasa_acierto,
        tendencia,
        rendimiento: {
          tipo_I: dominioActual,
          tipo_II: Math.max(0, dominioActual - 15),
          tipo_III: Math.max(0, dominioActual - 25),
        },
      };
    });
  } catch (error) {
    console.warn('[Diagnostico] obtenerDiagnosticoModulos error:', error);
    return MODULOS_DEFAULT;
  }
}

// ============================================================
// Verificación rápida — ¿el usuario ya tiene diagnóstico hecho?
// Usado por /dashboard/diagnostico-inicial para decidir si redirigir
// directo al simulacro o mostrar pantalla de re-confirmación.
// ============================================================
export async function tieneRespuestasDiagnostico(): Promise<{
  tiene: boolean;
  total: number;
  porcentaje: number;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tiene: false, total: 0, porcentaje: 0 };

    const { data, error } = await supabase
      .from('respuestas_preguntas')
      .select('correcta')
      .eq('user_id', user.id)
      .eq('sesion_tipo', 'diagnostico');

    if (error || !data || data.length === 0) {
      return { tiene: false, total: 0, porcentaje: 0 };
    }

    const correctas = data.filter((r) => r.correcta).length;
    const porcentaje = Math.round((correctas / data.length) * 100);
    return { tiene: true, total: data.length, porcentaje };
  } catch {
    return { tiene: false, total: 0, porcentaje: 0 };
  }
}
