// ============================================================
// MéritoPro V3 — Interfaces de Preguntas (Metodología Oficial PGN)
// REGLA DE ORO: Estas interfaces son inmutables. El Agente 1
// (Tutor) SOLO puede generar preguntas bajo estas estructuras.
// ============================================================

export type TipoPregunta = 'tipo_I' | 'tipo_II' | 'tipo_III' | 'comportamental';

// -----------------------------------------------
// TIPO I — Selección múltiple con única respuesta
// Formato: Enunciado directo o caso práctico + 4 opciones (A, B, C, D).
// -----------------------------------------------
export interface PreguntaTipoI {
  tipo: 'tipo_I';
  enunciado: string;
  opciones: { id: 'A' | 'B' | 'C' | 'D'; texto: string }[];
  correcta_id: 'A' | 'B' | 'C' | 'D';
}

// -----------------------------------------------
// TIPO II — Selección múltiple con múltiple respuesta
// Formato: Enunciado + 4 afirmaciones numeradas (1, 2, 3, 4).
// Las opciones de respuesta SIEMPRE son combinaciones estáticas.
// -----------------------------------------------
export interface PreguntaTipoII {
  tipo: 'tipo_II';
  enunciado: string;
  afirmaciones: { id: 1 | 2 | 3 | 4; texto: string }[];
  opciones: [
    { id: 'A'; texto: 'Si 1 y 2 son correctas' },
    { id: 'B'; texto: 'Si 1 y 3 son correctas' },
    { id: 'C'; texto: 'Si 2 y 4 son correctas' },
    { id: 'D'; texto: 'Si 1, 2 y 3 son correctas' },
  ];
  correcta_id: 'A' | 'B' | 'C' | 'D';
}

// -----------------------------------------------
// TIPO III — Análisis de Relación (Afirmación PORQUE Razón)
// Dos proposiciones unidas por la palabra PORQUE.
// -----------------------------------------------
export interface PreguntaTipoIII {
  tipo: 'tipo_III';
  afirmacion: string;
  razon: string;
  opciones: [
    { id: 'A'; texto: 'Afirmación es VERDADERA, Razón es VERDADERA y Razón EXPLICA la Afirmación.' },
    { id: 'B'; texto: 'Afirmación es VERDADERA, Razón es VERDADERA pero Razón NO explica la Afirmación.' },
    { id: 'C'; texto: 'Afirmación es VERDADERA, Razón es FALSA.' },
    { id: 'D'; texto: 'Afirmación es FALSA, Razón es VERDADERA.' },
    { id: 'E'; texto: 'Afirmación es FALSA, Razón es FALSA.' },
  ];
  correcta_id: 'A' | 'B' | 'C' | 'D' | 'E';
}

// -----------------------------------------------
// COMPORTAMENTAL — Escala Likert o Juicio Situacional
// Evalúa rasgos de personalidad laboral, no conocimientos técnicos.
// No hay respuestas "malas", hay respuestas con diferente puntaje.
// -----------------------------------------------
export interface PreguntaComportamental {
  tipo: 'comportamental';
  enunciado_situacional: string;
  competencia_evaluada:
    | 'Liderazgo'
    | 'Trabajo en equipo'
    | 'Toma de decisiones'
    | 'Orientación al ciudadano';
  escala: 'frecuencia' | 'acuerdo';
  // frecuencia: Nunca(1) a Siempre(5)
  // acuerdo: Totalmente en desacuerdo(1) a Totalmente de acuerdo(5)
}

// -----------------------------------------------
// Interfaz unificada que debe devolver el Agente 1
// -----------------------------------------------
export interface PreguntaGenerada {
  id: string;
  modulo: string;
  tema: string;
  nivel_dificultad?: number; // V4: 1 (base), 2 (intermedio), 3 (avanzado)
  estructura: PreguntaTipoI | PreguntaTipoII | PreguntaTipoIII | PreguntaComportamental;
  explicacion: string;
  norma_relacionada: string; // OBLIGATORIO: Ej "Ley 1952 de 2019, Art. 38"
}

// -----------------------------------------------
// Tipo para la respuesta del usuario
// -----------------------------------------------
export interface RespuestaUsuario {
  pregunta_id: string;
  respuesta: string | number; // string para tipos I-III, number (1-5) para comportamental
  tiempo_respuesta_ms: number;
  correcta?: boolean;
}
