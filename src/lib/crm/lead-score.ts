// ============================================================
// MéritoPro CRM — Cálculo de Lead Score (0-100)
// Pondera factores de engagement y señales de compra.
// ============================================================

export interface LeadScoreFactores {
  completoDiagnostico: boolean;
  abrioPrimerEmail: boolean;
  visitoPaywall: boolean;
  scoreModuloDebil?: number;   // si < 40 → +20 (más motivado para comprar)
  salarioCargo?: number;       // si > 5_000_000 → +15 (ROI claro)
  respondioTelegram: boolean;
  diasSinAbrirEmail: number;   // si > 7 → -20 (enfriamiento)
  utm_source?: string;         // 'google' → +20, 'linkedin' → +15
}

/**
 * Calcula el lead score acumulando y restando puntos por factor.
 * Resultado siempre entre 0 y 100.
 */
export function calcularLeadScore(factores: LeadScoreFactores): number {
  let score = 0;

  // Acciones de alto valor
  if (factores.completoDiagnostico) score += 25;
  if (factores.visitoPaywall) score += 20;
  if (factores.abrioPrimerEmail) score += 10;
  if (factores.respondioTelegram) score += 10;

  // Señales de urgencia / ROI
  if (
    factores.scoreModuloDebil !== undefined &&
    factores.scoreModuloDebil < 40
  ) {
    score += 20; // debilidad detectada → mayor necesidad
  }

  if (
    factores.salarioCargo !== undefined &&
    factores.salarioCargo > 5_000_000
  ) {
    score += 15; // ROI claro del cargo aspirado
  }

  // Fuente de tráfico
  const src = (factores.utm_source ?? '').toLowerCase();
  if (src.includes('google')) score += 20;
  else if (src.includes('linkedin')) score += 15;

  // Señales de enfriamiento
  if (factores.diasSinAbrirEmail > 7) score -= 20;

  // Clamp 0-100
  return Math.max(0, Math.min(100, score));
}
