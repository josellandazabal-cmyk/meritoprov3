'use server';

import { createClient } from '@/lib/supabase/server';

export interface ModuloDiagnostico {
  nombre: string;
  dominio: number;
  tendencia: 'mejorando' | 'estable' | 'decayendo';
  tasa_acierto: number;
  temas_debiles: string[];
  temas_fuertes: string[];
  rendimiento: { tipo_I: number; tipo_II: number; tipo_III: number };
}

const MODULOS_DEFAULT: ModuloDiagnostico[] = [
  {
    nombre: 'Normas del Servicio Público',
    dominio: 0,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Derecho Disciplinario',
    dominio: 0,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Aptitud Verbal',
    dominio: 0,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Gestión Documental',
    dominio: 0,
    tendencia: 'estable',
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Ofimática',
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

    // Fetch respuestas del usuario
    const { data: respuestas, error } = await supabase
      .from('respuestas_preguntas')
      .select('pregunta_id, correcta')
      .eq('user_id', user.id)
      .eq('sesion_tipo', 'diagnostico');

    if (error || !respuestas || respuestas.length === 0) {
      return MODULOS_DEFAULT;
    }

    // Agrupar por módulo (simulado por ahora basado en pregunta_id prefix)
    const modulosMap = new Map<string, { total: number; correctas: number }>();

    respuestas.forEach((r) => {
      const prefijo = r.pregunta_id.split('-')[0] || 'generico';
      const actual = modulosMap.get(prefijo) || { total: 0, correctas: 0 };
      actual.total += 1;
      if (r.correcta) actual.correctas += 1;
      modulosMap.set(prefijo, actual);
    });

    // Calcular dominio y rendimiento
    return MODULOS_DEFAULT.map((mod) => {
      const stats = modulosMap.get(mod.nombre.toLowerCase().split(' ')[0]) || { total: 0, correctas: 0 };
      const dominio = stats.total > 0 ? Math.round((stats.correctas / stats.total) * 100) : 0;
      const tasa_acierto = stats.total > 0 ? stats.correctas / stats.total : 0;

      return {
        ...mod,
        dominio,
        tasa_acierto,
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
