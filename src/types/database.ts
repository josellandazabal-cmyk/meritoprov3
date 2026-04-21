// ============================================================
// MéritoPro V3 — Interfaces de Base de Datos (Supabase)
// ============================================================

// -----------------------------------------------
// Pre-pago — Captura ligera de leads
// -----------------------------------------------
export interface Lead {
  id: string;
  nombre: string;
  email: string;
  celular: string;
  cargo_aspira: string;
  fuente: 'landing' | 'remarketing' | 'referido';
  created_at: string;
  diagnostico_id?: string;
  convertido: boolean;
}

// -----------------------------------------------
// Post-pago — Niveles jerárquicos PGN
// -----------------------------------------------
export type NivelJerarquico =
  | 'directivo'
  | 'asesor'
  | 'ejecutivo'
  | 'profesional'
  | 'tecnico'
  | 'administrativo'
  | 'operativo';

export type EjeEspecifico =
  | 'eje_disciplinario'
  | 'eje_constitucional_ddhh'
  | 'eje_administrativo_cpaca'
  | 'eje_gestion_transparencia'
  | 'eje_financiero_contable'
  | 'eje_sistemas_tecnologia'
  | 'eje_forense_criminalistica'
  | 'eje_infraestructura_obras';

// -----------------------------------------------
// Post-pago — Usuario autenticado
// -----------------------------------------------
export interface Usuario {
  id: string; // auth.users.id
  lead_id: string;
  profesion: string;
  opec_seleccionada: string;
  nivel_cargo: NivelJerarquico;
  ejes_asignados: EjeEspecifico[];
  telegram_chat_id?: string;
  fecha_examen: string;
  probabilidad_aprobar_actual: number; // 0-100
  created_at: string;
}

// -----------------------------------------------
// Motor Cognitivo — Spaced Repetition SM-2
// -----------------------------------------------
export interface SM2Repetition {
  id: string;
  user_id: string;
  pregunta_id: string;
  repetition_count: number;
  interval_days: number;
  e_factor: number; // Dificultad (1.3 a 2.5)
  next_review_date: string;
  tema_relacionado: string;
}

// -----------------------------------------------
// Diagnóstico del usuario
// -----------------------------------------------
export interface DiagnosticoUsuario {
  id: string;
  user_id?: string;
  lead_id?: string;
  ultima_actualizacion: string;
  modulos: DiagnosticoModulo[];
  indice_preparacion: number; // 0–100
  modulo_mas_fuerte: string;
  modulo_mas_debil: string;
  temas_prioritarios_hoy: string[];
}

export interface DiagnosticoModulo {
  modulo_clave: string;
  etiqueta: string;
  puntaje_dominio: number;
  tendencia: 'mejorando' | 'estable' | 'decayendo';
  tasa_acierto: number;
  temas_debiles: TemaDebil[];
  temas_fuertes: string[];
  rendimiento_por_tipo: {
    tipo_I: number;
    tipo_II: number;
    tipo_III: number;
  };
}

export interface TemaDebil {
  tema: string;
  tasa_error: number;
  repaso_pendiente: boolean;
  veces_fallado: number;
  norma_relacionada?: string;
}
