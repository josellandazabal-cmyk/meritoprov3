// ============================================================
// MéritoPro V3 — Algoritmo SM-2 (Spaced Repetition)
// Basado en el algoritmo original de Piotr Wozniak.
// ============================================================

export interface SM2Input {
  calidad: number;          // 0-5: calidad de la respuesta del usuario
  eFactorPrevio: number;    // Factor de facilidad previo (mínimo 1.3)
  repeticionesPrevias: number; // Número de repeticiones exitosas consecutivas
  intervaloPrevio: number;  // Intervalo previo en días
}

export interface SM2Output {
  eFactor: number;
  repeticiones: number;
  intervalo: number;        // Nuevo intervalo en días
  nextReviewDate: string;   // Fecha ISO de la próxima revisión
}

/**
 * Calcula los nuevos parámetros SM-2 basado en la calidad de respuesta.
 *
 * Escala de calidad:
 * 5 — Respuesta perfecta, sin hesitación
 * 4 — Respuesta correcta tras breve hesitación
 * 3 — Respuesta correcta con dificultad seria
 * 2 — Respuesta incorrecta, pero al ver la correcta se recordó
 * 1 — Respuesta incorrecta, respuesta correcta se recuerda vagamente
 * 0 — Respuesta incorrecta completa (blackout)
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { calidad, eFactorPrevio, repeticionesPrevias, intervaloPrevio } = input;

  let eFactor: number;
  let repeticiones: number;
  let intervalo: number;

  if (calidad >= 3) {
    // Respuesta exitosa — calcular nuevo e-factor
    eFactor = Math.max(
      1.3,
      eFactorPrevio + 0.1 - (5 - calidad) * (0.08 + (5 - calidad) * 0.02)
    );

    repeticiones = repeticionesPrevias + 1;

    // Calcular intervalo según número de repeticiones
    if (repeticiones === 1) {
      intervalo = 1;
    } else if (repeticiones === 2) {
      intervalo = 6;
    } else {
      intervalo = Math.round(intervaloPrevio * eFactor);
    }
  } else {
    // Respuesta fallida — reiniciar repeticiones
    eFactor = Math.max(
      1.3,
      eFactorPrevio + 0.1 - (5 - calidad) * (0.08 + (5 - calidad) * 0.02)
    );
    repeticiones = 0;
    intervalo = 1; // Repasar mañana
  }

  // Calcular fecha de próxima revisión
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalo);

  return {
    eFactor: Math.round(eFactor * 100) / 100, // Redondear a 2 decimales
    repeticiones,
    intervalo,
    nextReviewDate: nextDate.toISOString(),
  };
}

/**
 * Convierte una respuesta de pregunta a calidad SM-2 (0-5).
 * - Correcta rápida (< 10s) → 5
 * - Correcta normal (< 30s) → 4
 * - Correcta lenta (> 30s, < 60s) → 3
 * - Incorrecta (recordaba algo) → 2
 * - Incorrecta (no recordaba) → 1
 * - Incorrecta total → 0
 */
export function respuestaACalidadSM2(
  correcta: boolean,
  tiempoRespuestaMs: number
): number {
  if (correcta) {
    if (tiempoRespuestaMs < 10_000) return 5;
    if (tiempoRespuestaMs < 30_000) return 4;
    return 3;
  } else {
    // Para respuestas incorrectas, por defecto usar calidad 1
    // Se puede ajustar según si el usuario vio la retroalimentación
    return 1;
  }
}
