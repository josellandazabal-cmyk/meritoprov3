// ============================================================
// MéritoPro CRM — Secuencias de Email del Funnel (7 días + reactivación)
// ============================================================

export type TipoEmail =
  | 'resultado_diagnostico'  // Día 0 — inmediato post-diagnóstico
  | 'caso_real'              // Día 1 — conexión emocional
  | 'error_comun'            // Día 2 — educación + dolor
  | 'enemigo_comun'          // Día 3 — ataque "Trampa del Estudio Eterno"
  | 'roi_salarial'           // Día 4 — lógica ROI
  | 'objeciones'             // Día 5 — quema objeciones
  | 'urgencia_cierre'        // Día 6 — urgencia
  | 'ultima_llamada'         // Día 7 — CTA final
  | 'reactivacion_1'         // Reactivación día 1
  | 'reactivacion_7'         // Reactivación día 7
  | 'reactivacion_30';       // Reactivación día 30

export interface EmailSecuenciaItem {
  tipo: TipoEmail;
  delay_horas: number;
  es_nutricion: boolean;      // true = educativo, false = persuasión
  aplica_etapas: string[];    // etapas CRM que reciben este email
}

export const SECUENCIA_EMAIL: EmailSecuenciaItem[] = [
  {
    tipo: 'resultado_diagnostico',
    delay_horas: 0,
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'caso_real',
    delay_horas: 24,
    es_nutricion: true,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'error_comun',
    delay_horas: 48,
    es_nutricion: true,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'enemigo_comun',
    delay_horas: 72,
    es_nutricion: true,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'roi_salarial',
    delay_horas: 96,
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO', 'PAYWALL_VISTO'],
  },
  {
    tipo: 'objeciones',
    delay_horas: 120,
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO', 'PAYWALL_VISTO'],
  },
  {
    tipo: 'urgencia_cierre',
    delay_horas: 144,
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO', 'PAYWALL_VISTO'],
  },
  {
    tipo: 'ultima_llamada',
    delay_horas: 168,
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO', 'PAYWALL_VISTO'],
  },
  {
    tipo: 'reactivacion_1',
    delay_horas: 720,   // 30 días
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'reactivacion_7',
    delay_horas: 888,   // 37 días
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
  {
    tipo: 'reactivacion_30',
    delay_horas: 1440,  // 60 días
    es_nutricion: false,
    aplica_etapas: ['DIAGNOSTICADO'],
  },
];

/**
 * Devuelve el tipo de email que le corresponde a un lead según los días
 * transcurridos desde su diagnóstico y su lead score.
 *
 * Reglas:
 * - Lead score >= 70: secuencia persuasión (a partir de día 4).
 * - Lead score < 70: secuencia nutrición educativa primero.
 * - Devuelve null si no hay email programado para ese día.
 */
export function emailDelDia(
  diasDesdeDiagnostico: number,
  leadScore: number
): TipoEmail | null {
  // Para hot leads (score >= 70) acelerar a persuasión desde día 4
  if (leadScore >= 70 && diasDesdeDiagnostico >= 4) {
    const persuasionMap: Record<number, TipoEmail> = {
      4: 'roi_salarial',
      5: 'objeciones',
      6: 'urgencia_cierre',
      7: 'ultima_llamada',
    };
    const tipo = persuasionMap[diasDesdeDiagnostico];
    return tipo ?? null;
  }

  // Secuencia base por día
  const secuenciaBase: Record<number, TipoEmail> = {
    0: 'resultado_diagnostico',
    1: 'caso_real',
    2: 'error_comun',
    3: 'enemigo_comun',
    4: 'roi_salarial',
    5: 'objeciones',
    6: 'urgencia_cierre',
    7: 'ultima_llamada',
    30: 'reactivacion_1',
    37: 'reactivacion_7',
    60: 'reactivacion_30',
  };

  return secuenciaBase[diasDesdeDiagnostico] ?? null;
}
