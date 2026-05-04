// ============================================================
// Datos oficiales del Concurso de Méritos PGN 2026
//
// Fuente:
//   · Resolución 076 del 24 de marzo de 2026 (norma reguladora)
//   · Resolución 108 del 23 de abril de 2026 (correctiva)
//   · COMPILADO DE CONVOCATORIAS VR03_28042026.pdf (291 convocatorias)
//
// Este archivo es la única fuente de verdad. NO duplicar estos números
// en otros archivos — importar desde aquí.
// ============================================================

export const CONCURSO_PGN_2026 = {
  // Totales (post-correctiva Res. 108)
  totalVacantes: 2824, // 2826 originales − 1 (Conv. 86) − 1 (Conv. 89) = 2824
  totalConvocatorias: 291,
  convocatoriaExcluida: 86,
  convocatoriaModificada: { numero: 89, cargosFinales: 61 },

  // Resoluciones
  resolucionBase: {
    numero: '076',
    fecha: '24 de marzo de 2026',
    fechaIso: '2026-03-24',
  },
  resolucionCorrectiva: {
    numero: '108',
    fecha: '23 de abril de 2026',
    fechaIso: '2026-04-23',
  },

  // Inscripciones
  inscripciones: {
    fechaInicio: '01 de junio de 2026',
    fechaFin: '12 de junio de 2026',
    fechaInicioIso: '2026-06-01',
    fechaFinIso: '2026-06-12',
    diasCalendario: 12,
    horarioInicio: '08:00',
    horarioFin: '16:00',
    rango: '1 al 12 de junio de 2026',
    rangoCorto: '1-12 jun 2026',
  },

  // Sitios oficiales
  sitiosOficiales: {
    procuraduria: 'https://www.procuraduria.gov.co',
    operador: 'https://www.meritoconstruyendoexcelencia.com.co',
  },

  // Pruebas (Art. 18 Res. 076 + Tablas corregidas en Res. 108 Art. 1)
  pruebas: {
    nivelProfesionalAsesorEjecutivo: {
      conocimientos: { caracter: 'Eliminatorio', minimo: 65, peso: 0.7 },
      comportamentales: { caracter: 'Clasificatorio', peso: 0.2 },
      antecedentes: { caracter: 'Clasificatorio', peso: 0.1 },
    },
    nivelTecnicoAdminOperativo: {
      conocimientos: { caracter: 'Eliminatorio', minimo: 65, peso: 0.6 },
      comportamentales: { caracter: 'Clasificatorio', peso: 0.2 },
      antecedentes: { caracter: 'Clasificatorio', peso: 0.2 },
    },
    puntajeMinimoListaElegibles: 70, // % del puntaje final
  },
} as const;

// Lista oficial de cargos de carrera administrativa convocados.
// Excluye cargos de libre nombramiento y remoción.
// Estructura: agrupada por nivel jerárquico para uso en selects/UI.
export const CARGOS_CARRERA_PGN = [
  {
    grupo: 'Asesor',
    cargos: ['Asesor', 'Jefe de División'],
  },
  {
    grupo: 'Profesional',
    cargos: [
      'Procurador Judicial II',
      'Procurador Judicial I',
      'Profesional Universitario',
      'Coordinador Administrativo',
    ],
  },
  {
    grupo: 'Técnico',
    cargos: ['Técnico Investigador', 'Sustanciador', 'Técnico Administrativo'],
  },
  {
    grupo: 'Administrativo',
    cargos: [
      'Secretario Ejecutivo',
      'Secretario',
      'Auxiliar Administrativo',
      'Oficinista',
    ],
  },
  {
    grupo: 'Operativo',
    cargos: [
      'Conductor',
      'Citador',
      'Auxiliar de Servicios Generales',
      'Auxiliar de Mantenimiento',
    ],
  },
] as const;

// Niveles jerárquicos canónicos (matchea con tabla `usuarios.nivel_cargo`).
export const NIVELES_JERARQUICOS = [
  { slug: 'asesor', label: 'Asesor' },
  { slug: 'ejecutivo', label: 'Ejecutivo' },
  { slug: 'profesional', label: 'Profesional' },
  { slug: 'tecnico', label: 'Técnico' },
  { slug: 'administrativo', label: 'Administrativo' },
  { slug: 'operativo', label: 'Operativo' },
] as const;

// Áreas de evaluación oficiales (Anexo del Manual de Funciones + Res. 076).
// Usadas por el simulacro y dashboard de diagnóstico.
export const AREAS_EVALUACION = [
  'Constitución Política de Colombia 1991',
  'Ley 1952 de 2019 — Código General Disciplinario',
  'Decreto Ley 262 de 2000 — Régimen interno PGN',
  'Funciones del Ministerio Público',
  'Derechos Fundamentales y Acción de Tutela',
  'Gestión Documental (Ley 594 de 2000)',
  'Carrera Administrativa (Ley 909 de 2004)',
  'Competencias Comportamentales del Servidor Público',
] as const;

/**
 * Determina si un cargo declarado por el usuario pertenece al
 * "Nivel Profesional/Asesor/Ejecutivo" (peso conocimientos 70%) o al
 * "Nivel Técnico/Administrativo/Operativo" (peso conocimientos 60%).
 */
export function inferirNivelPrueba(
  cargoAspira: string
): 'profesional_asesor_ejecutivo' | 'tecnico_admin_operativo' {
  const c = cargoAspira.toLowerCase();
  if (
    c.includes('asesor') ||
    c.includes('procurador judicial') ||
    c.includes('coordinador administrativo') ||
    c.includes('jefe de divisi') ||
    c.includes('profesional universitario') ||
    c === 'profesional'
  ) {
    return 'profesional_asesor_ejecutivo';
  }
  return 'tecnico_admin_operativo';
}

// ============================================================
// Estado dinámico de las inscripciones — usado en banners de
// urgencia en landing, sumario de diagnóstico, checkout y emails.
// ============================================================

export type EstadoInscripciones =
  | { fase: 'pre'; diasFaltantes: number; mensajeCorto: string; mensajeLargo: string }
  | { fase: 'abiertas'; diasParaCierre: number; mensajeCorto: string; mensajeLargo: string }
  | { fase: 'cerradas'; mensajeCorto: string; mensajeLargo: string };

/**
 * Calcula el estado actual de las inscripciones al concurso PGN 2026
 * basado en la fecha de hoy. Server-safe: funciona en SSR y en cliente.
 *
 * Fases:
 *   - pre        → faltan N días para que abran (urgencia "prepárate")
 *   - abiertas   → están abiertas, cierran en N días (urgencia máxima)
 *   - cerradas   → ya pasó la ventana (mensaje de cierre)
 */
export function estadoInscripciones(hoy: Date = new Date()): EstadoInscripciones {
  // -05:00 = hora Colombia (Bogotá). Importante para no off-by-one al
  // cruzar medianoche en servidores en UTC.
  const inicio = new Date(CONCURSO_PGN_2026.inscripciones.fechaInicioIso + 'T00:00:00-05:00');
  const fin = new Date(CONCURSO_PGN_2026.inscripciones.fechaFinIso + 'T23:59:59-05:00');

  const ms = 86_400_000;
  const diasParaInicio = Math.ceil((inicio.getTime() - hoy.getTime()) / ms);
  const diasParaCierre = Math.ceil((fin.getTime() - hoy.getTime()) / ms);

  if (diasParaInicio > 0) {
    return {
      fase: 'pre',
      diasFaltantes: diasParaInicio,
      mensajeCorto: `Faltan ${diasParaInicio} días para inscripciones`,
      mensajeLargo: `Las inscripciones abren el 1 de junio de 2026. Tienes ${diasParaInicio} días para llegar preparado.`,
    };
  }
  if (diasParaCierre >= 0) {
    return {
      fase: 'abiertas',
      diasParaCierre,
      mensajeCorto:
        diasParaCierre === 0
          ? '¡Hoy es el último día para inscribirte!'
          : `Inscripciones abiertas — cierran en ${diasParaCierre} días`,
      mensajeLargo:
        diasParaCierre === 0
          ? 'Hoy 12 de junio es el último día para inscribirse al concurso PGN 2026. Hasta las 16:00 hora Colombia.'
          : `Inscripciones abiertas hasta el 12 de junio de 2026. Te quedan ${diasParaCierre} días.`,
    };
  }
  return {
    fase: 'cerradas',
    mensajeCorto: 'Inscripciones cerradas',
    mensajeLargo:
      'Las inscripciones del concurso PGN 2026 cerraron el 12 de junio. Mantén tu preparación activa para el examen.',
  };
}
