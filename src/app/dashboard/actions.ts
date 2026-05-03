'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================
// Server action — Stats del dashboard del aspirante autenticado.
//
// Reemplaza los DEMO_USER y MODULOS_PROGRESO hardcodeados que tenía
// el dashboard. Lee:
//   · auth.users.user_metadata.nombre  → saludo personalizado
//   · public.usuarios.probabilidad_aprobar_actual
//   · public.respuestas_preguntas      → última sesión + racha
//   · public.sm2_repetition            → progreso por módulo
//
// Para usuarios recién creados (sin historial), devuelve defaults
// neutros: 0 % probabilidad, 0 días racha, sin brechas detectadas.
// ============================================================

export interface ModuloProgreso {
  nombre: string;
  dominio: number; // 0-100
  tendencia: 'mejorando' | 'estable' | 'decayendo';
}

export interface DashboardStats {
  nombre: string;
  probabilidad: number; // 0-100
  racha_dias: number;
  preguntas_hoy: number;
  preguntas_pendientes: number;
  modulo_mas_debil: string | null;
  ultima_sesion_humano: string; // "Hace 1 día", "Nunca", etc.
  modulos: ModuloProgreso[];
}

const DEFAULT_STATS: DashboardStats = {
  nombre: 'aspirante',
  probabilidad: 0,
  racha_dias: 0,
  preguntas_hoy: 0,
  preguntas_pendientes: 0,
  modulo_mas_debil: null,
  ultima_sesion_humano: 'Nunca',
  modulos: [],
};

// Mapeo categoría del corpus → etiqueta legible para el dashboard
const ETIQUETA_MODULO: Record<string, string> = {
  '01_constitucion_y_organos_control': 'Constitución y Órganos de Control',
  '02_regimen_disciplinario': 'Derecho Disciplinario',
  '03_pgn_regimen_interno': 'PGN — Régimen Interno',
  '04_procedimiento_administrativo': 'Procedimiento Administrativo',
  '05_contratacion_estatal': 'Contratación Estatal',
  '06_transparencia_anticorrupcion': 'Transparencia y Anticorrupción',
  '07_mecanismos_resolucion_conflictos': 'Conciliación y MASC',
  '09_acciones_constitucionales': 'Acciones Constitucionales',
  '10_derecho_procesal_y_probatorio': 'Procesal y Probatorio',
  '11_derechos_humanos_victimas_infancia': 'DDHH, Víctimas e Infancia',
  '12_especialidades_sectoriales': 'Especialidades Sectoriales',
};

function humanizarUltimaSesion(isoDate: string | null): string {
  if (!isoDate) return 'Nunca';
  const ahora = Date.now();
  const sesion = new Date(isoDate).getTime();
  if (Number.isNaN(sesion)) return 'Nunca';
  const diffMin = Math.round((ahora - sesion) / (1000 * 60));
  if (diffMin < 60) return diffMin <= 1 ? 'Hace un momento' : `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 0) return 'Hoy';
  if (diffD === 1) return 'Hace 1 día';
  if (diffD < 30) return `Hace ${diffD} días`;
  const diffMes = Math.round(diffD / 30);
  return `Hace ${diffMes} ${diffMes === 1 ? 'mes' : 'meses'}`;
}

function calcularRachaDias(fechasRespuestas: string[]): number {
  if (fechasRespuestas.length === 0) return 0;
  // Días únicos (YYYY-MM-DD) en orden descendente.
  const dias = [
    ...new Set(
      fechasRespuestas
        .map((f) => new Date(f).toISOString().slice(0, 10))
        .filter((d) => d.length === 10)
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (dias.length === 0) return 0;

  // Racha = días consecutivos desde hoy o ayer hacia atrás.
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (dias[0] !== hoy && dias[0] !== ayer) return 0;

  let racha = 1;
  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]);
    const curr = new Date(dias[i]);
    const diffDias = (prev.getTime() - curr.getTime()) / 86_400_000;
    if (diffDias === 1) racha += 1;
    else break;
  }
  return racha;
}

interface FilaSM2 {
  tema_relacionado: string | null;
  e_factor: number;
  repetition_count: number;
  next_review_date: string;
  updated_at: string;
}

function agregarModulos(filas: FilaSM2[]): {
  modulos: ModuloProgreso[];
  preguntas_pendientes: number;
  modulo_mas_debil: string | null;
} {
  if (filas.length === 0) {
    return { modulos: [], preguntas_pendientes: 0, modulo_mas_debil: null };
  }

  // Agrupar por categoría (extraída del tema_relacionado si lo guardamos
  // con prefijo "categoria/tema") o por tema directo si no hay categoría.
  const agrupado = new Map<string, { suma: number; n: number; pendientes: number }>();
  const ahora = Date.now();
  let pendientesTotales = 0;

  for (const f of filas) {
    if (!f.tema_relacionado) continue;
    // Asumimos que tema_relacionado puede tener formato "categoria_id/tema"
    // o directamente "tema". Extraemos categoría si aplica.
    const parteCat = f.tema_relacionado.split('/')[0];
    const cat = ETIQUETA_MODULO[parteCat] ? parteCat : 'general';
    const etiqueta = ETIQUETA_MODULO[cat] ?? f.tema_relacionado;

    const bucket = agrupado.get(etiqueta) ?? { suma: 0, n: 0, pendientes: 0 };
    // Dominio aproximado: e-factor normalizado a 0-100.
    // e-factor mínimo 1.3 → 0%, máximo 2.5 → 100%.
    const dominio = Math.round(((f.e_factor - 1.3) / (2.5 - 1.3)) * 100);
    bucket.suma += Math.max(0, Math.min(100, dominio));
    bucket.n += 1;
    if (new Date(f.next_review_date).getTime() <= ahora) {
      bucket.pendientes += 1;
      pendientesTotales += 1;
    }
    agrupado.set(etiqueta, bucket);
  }

  const modulos: ModuloProgreso[] = [...agrupado.entries()].map(([nombre, b]) => {
    const dominio = Math.round(b.suma / b.n);
    const tendencia: 'mejorando' | 'estable' | 'decayendo' =
      dominio >= 70 ? 'mejorando' : dominio >= 50 ? 'estable' : 'decayendo';
    return { nombre, dominio, tendencia };
  });

  // Módulo más débil = el de menor dominio (siempre que existan datos).
  const masDebil = modulos.length
    ? modulos.reduce((peor, m) => (m.dominio < peor.dominio ? m : peor)).nombre
    : null;

  return { modulos, preguntas_pendientes: pendientesTotales, modulo_mas_debil: masDebil };
}

/**
 * Obtiene los stats reales del dashboard para el aspirante autenticado.
 * Nunca lanza: si Supabase falla o el usuario no tiene historial, devuelve
 * el bloque DEFAULT_STATS con saludo neutro y todo en cero.
 */
export async function obtenerDashboardStats(): Promise<DashboardStats> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return DEFAULT_STATS;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return DEFAULT_STATS;

    // Nombre del usuario: de user_metadata.nombre, fallback al prefijo del email.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nombreMeta = typeof meta.nombre === 'string' ? meta.nombre : null;
    const nombrePorEmail = user.email
      ? user.email.split('@')[0].split('.')[0].replace(/^./, (c) => c.toUpperCase())
      : 'aspirante';
    const nombre = nombreMeta?.trim() || nombrePorEmail;

    // Tres queries en paralelo: perfil, respuestas recientes (90d), SM-2.
    const desdeISO = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const hoyISO = new Date().toISOString().slice(0, 10);

    const [{ data: perfil }, { data: respuestas, count: countRespuestasHoy }, { data: sm2 }] =
      await Promise.all([
        supabase
          .from('usuarios')
          .select('probabilidad_aprobar_actual')
          .eq('id', user.id)
          .maybeSingle<{ probabilidad_aprobar_actual: number | null }>(),
        supabase
          .from('respuestas_preguntas')
          .select('created_at', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', desdeISO)
          .order('created_at', { ascending: false }),
        supabase
          .from('sm2_repetition')
          .select('tema_relacionado, e_factor, repetition_count, next_review_date, updated_at')
          .eq('user_id', user.id),
      ]);

    const probabilidad = Math.round(
      Math.max(0, Math.min(100, perfil?.probabilidad_aprobar_actual ?? 0))
    );

    const fechasRespuestas: string[] = (respuestas ?? []).map(
      (r) => (r as { created_at: string }).created_at
    );
    const racha_dias = calcularRachaDias(fechasRespuestas);
    const preguntas_hoy = fechasRespuestas.filter((f) => f.startsWith(hoyISO)).length;
    const ultima_sesion_humano = humanizarUltimaSesion(fechasRespuestas[0] ?? null);

    const { modulos, preguntas_pendientes, modulo_mas_debil } = agregarModulos(
      (sm2 ?? []) as FilaSM2[]
    );

    void countRespuestasHoy; // reservado para métricas futuras

    return {
      nombre,
      probabilidad,
      racha_dias,
      preguntas_hoy,
      preguntas_pendientes,
      modulo_mas_debil,
      ultima_sesion_humano,
      modulos,
    };
  } catch (error) {
    console.warn('[Dashboard] obtenerDashboardStats falló:', error);
    return DEFAULT_STATS;
  }
}
