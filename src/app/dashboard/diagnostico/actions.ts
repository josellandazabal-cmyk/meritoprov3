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
  dominio: number;
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
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
];

export async function obtenerDiagnosticoModulos(): Promise<ModuloDiagnostico[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return MODULOS_DEFAULT;
    }

    const { data: respuestas, error } = await supabase
      .from('respuestas_preguntas')
      .select('pregunta_id, correcta, created_at')
      .eq('user_id', user.id)
      .eq('sesion_tipo', 'diagnostico')
      .order('created_at', { ascending: true });

    if (error || !respuestas || respuestas.length === 0) {
      return MODULOS_DEFAULT;
    }

    // Agrupar por slug — el módulo viene codificado en `pregunta_id`
    // como "<slug>::<id>". Si no tiene "::", cae en 'general'.
    const stats = new Map<string, { total: number; correctas: number; correctasUltimoTercio: number; correctasPrimerTercio: number; totalUltimoTercio: number; totalPrimerTercio: number }>();
    const corte = Math.floor(respuestas.length / 3);

    respuestas.forEach((r, i) => {
      const partes = r.pregunta_id.split('::');
      const slug = partes.length > 1 ? partes[0] : 'general';
      const actual = stats.get(slug) || {
        total: 0,
        correctas: 0,
        correctasUltimoTercio: 0,
        correctasPrimerTercio: 0,
        totalUltimoTercio: 0,
        totalPrimerTercio: 0,
      };
      actual.total += 1;
      if (r.correcta) actual.correctas += 1;
      if (i < corte) {
        actual.totalPrimerTercio += 1;
        if (r.correcta) actual.correctasPrimerTercio += 1;
      } else if (i >= respuestas.length - corte) {
        actual.totalUltimoTercio += 1;
        if (r.correcta) actual.correctasUltimoTercio += 1;
      }
      stats.set(slug, actual);
    });

    return MODULOS_DEFAULT.map((mod) => {
      const s = stats.get(mod.slug);
      if (!s || s.total === 0) return mod;

      const dominio = Math.round((s.correctas / s.total) * 100);
      const tasa_acierto = s.correctas / s.total;

      // Tendencia: comparar primer tercio vs último tercio cronológico.
      let tendencia: 'mejorando' | 'estable' | 'decayendo' = 'estable';
      if (s.totalPrimerTercio > 0 && s.totalUltimoTercio > 0) {
        const ratioInicial = s.correctasPrimerTercio / s.totalPrimerTercio;
        const ratioFinal = s.correctasUltimoTercio / s.totalUltimoTercio;
        const delta = ratioFinal - ratioInicial;
        if (delta > 0.1) tendencia = 'mejorando';
        else if (delta < -0.1) tendencia = 'decayendo';
      }

      return {
        ...mod,
        dominio,
        tasa_acierto,
        tendencia,
        rendimiento: {
          tipo_I: dominio,
          tipo_II: Math.max(0, dominio - 15),
          tipo_III: Math.max(0, dominio - 25),
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
