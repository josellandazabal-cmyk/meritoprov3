// ============================================================
// MéritoPro CRM — Clasificación de Buyer Persona
// Clasifica un lead como carolina / andres / gloria según su perfil.
//
// carolina: Profesional frustrada, 30-38, abogada, ya intentó antes.
// andres:   Egresado en limbo, 24-28, recién graduado.
// gloria:   Funcionaria que quiere estabilizar, 38-50.
// ============================================================

export type PersonaTipo = 'carolina' | 'andres' | 'gloria';

export interface ClasificacionInput {
  cargo_aspira: string;
  nivel_educativo?: string;
  edad_estimada?: number;
  diagnostico_score_total?: number;
  utm_source?: string;
  utm_medium?: string;
}

/**
 * Clasifica al lead en uno de los tres buyer personas.
 * Precedencia: andres → gloria → carolina (default).
 */
export function clasificarPersona(datos: ClasificacionInput): PersonaTipo {
  const cargo = datos.cargo_aspira.toLowerCase();
  const utm_source = (datos.utm_source ?? '').toLowerCase();
  const utm_medium = (datos.utm_medium ?? '').toLowerCase();
  const score = datos.diagnostico_score_total ?? 100;

  // --- Andres: egresado recién graduado, cargos entry-level, bajo score, TikTok ---
  const esCargoAndres =
    cargo.includes('profesional universitario') ||
    cargo.includes('procurador judicial i');

  const esTikTok = utm_source.includes('tiktok');

  if ((esCargoAndres && score < 60) || esTikTok) {
    return 'andres';
  }

  // --- Gloria: técnico/administrativo, Google Search (búsqueda activa), o madura ---
  const esCargoGloria =
    cargo.includes('tecnico') ||
    cargo.includes('técnico') ||
    cargo.includes('administrativo') ||
    cargo.includes('auxiliar') ||
    cargo.includes('secretari') ||
    cargo.includes('oficinista');

  const esGoogleSearch = utm_medium === 'google_search' || utm_medium === 'cpc';

  const edadGloria =
    datos.edad_estimada !== undefined && datos.edad_estimada >= 38;

  if (esCargoGloria || esGoogleSearch || edadGloria) {
    return 'gloria';
  }

  // --- Carolina: default — abogada, profesional con aspiraciones de cargo alto ---
  return 'carolina';
}
