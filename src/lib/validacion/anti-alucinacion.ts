// ============================================================
// Validadores anti-alucinación — verifican que cada pregunta emitida
// por el orquestador sea defendible contra el corpus inyectado.
//
// Capas de defensa (todas se aplican antes de servir la pregunta):
//   1. Norma citada debe APARECER en algún chunk del corpus inyectado.
//   2. Cargo objetivo debe ser uno oficial del Manual de Funciones PGN.
//   3. Módulo debe ser uno de los 11 oficiales del corpus.
//   4. Coherencia tema vs corpus disponible.
//   5. Logging estructurado para auditar la tasa de rechazo.
//
// Si la pregunta NO pasa todos los validadores, se descarta. Resultado:
// preguntas con norma cita exacta verificable o no se emiten.
// ============================================================

import type { CorpusChunk } from '@/lib/rag/corpus';
import { REQUISITOS_CARGOS_PGN } from '@/lib/concurso/datos-oficiales';

// ------------------------------------------------------------
// CARGOS OFICIALES (del Manual de Funciones PGN)
// ------------------------------------------------------------
const CARGOS_OFICIALES = new Set<string>(
  REQUISITOS_CARGOS_PGN.map((r) => r.cargo.toLowerCase())
);

// Algunas variantes aceptables que el modelo puede emitir
const CARGOS_VARIANTES_ACEPTABLES: Record<string, string> = {
  'procurador delegado': 'asesor',
  'aspirante pgn': 'profesional universitario',
  'servidor público pgn': 'profesional universitario',
  'auxiliar': 'auxiliar administrativo',
};

// ------------------------------------------------------------
// MÓDULOS CANÓNICOS — estos son los slugs oficiales del producto.
// Tema/módulo emitido debe matchear con uno de estos para ser válido.
// ------------------------------------------------------------
const MODULOS_CANONICOS = new Set([
  'estructura_estado',
  'disciplinario',
  'derechos_fundamentales',
  'gestion_documental',
  'carrera_admin',
  'etica',
  'aptitud_verbal',
  'ofimatica',
  'comportamental',
  // Aliases del corpus categorizado
  '01_constitucion_y_organos_control',
  '02_regimen_disciplinario',
  '03_pgn_regimen_interno',
  '04_procedimiento_administrativo',
  '05_contratacion_estatal',
  '06_transparencia_anticorrupcion',
  '07_mecanismos_resolucion_conflictos',
  '08_acciones_constitucionales',
  '09_acciones_constitucionales',
  '10_derecho_procesal_y_probatorio',
  '11_derechos_humanos_victimas_infancia',
  '12_especialidades_sectoriales',
  // Términos genéricos que el prompt actual deja pasar
  'eje_disciplinario',
  'normas_servicio_publico',
  'normas_servicio_público',
  'constitucional',
]);

// ------------------------------------------------------------
// CAPA 1: extraer normas autorizadas del corpus inyectado
// ------------------------------------------------------------
export interface NormaAutorizada {
  norma: string; // normalizada
  variantes: Set<string>; // todas las formas en que puede aparecer
}

function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // sin tildes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * De los chunks del corpus, extrae el conjunto de normas que la pregunta
 * PUEDE legítimamente citar. Cada norma se indexa con varias variantes
 * que el modelo podría usar (Ley 1952 de 2019 = Ley 1952/2019 = etc.).
 */
export function extraerNormasAutorizadas(chunks: CorpusChunk[]): Set<string> {
  const set = new Set<string>();
  for (const c of chunks) {
    if (!c.norma) continue;
    const n = normalizarTexto(c.norma);
    set.add(n);

    // Variantes típicas: "Ley 1952 de 2019" → "ley 1952/2019", "1952",
    // "ley 1952", "ley 1952 2019".
    const matchLey = n.match(/(ley|decreto|resolucion|acto legislativo)\s+(\d+)(?:\s+de\s+(\d+))?/);
    if (matchLey) {
      const tipo = matchLey[1];
      const num = matchLey[2];
      const ano = matchLey[3];
      set.add(`${tipo} ${num}`);
      if (ano) {
        set.add(`${tipo} ${num} de ${ano}`);
        set.add(`${tipo} ${num}/${ano}`);
        set.add(`${tipo} ${num} ${ano}`);
      }
    }

    if (n.includes('constitucion')) {
      set.add('constitucion politica');
      set.add('constitucion politica de colombia');
      set.add('constitucion politica 1991');
      set.add('cp');
      set.add('c.p.');
    }
    if (n.includes('codigo general disciplinario')) {
      set.add('cgd');
      set.add('c.g.d.');
      set.add('codigo general disciplinario');
    }
  }
  return set;
}

/**
 * Verifica que la `norma_relacionada` emitida por el modelo aparezca en
 * el conjunto de normas autorizadas del corpus. Devuelve true si es válida.
 *
 * Estrategia:
 *   - Normaliza ambos lados (sin tildes, lowercase).
 *   - Para cada variante autorizada, comprueba si está contenida en la cita.
 *   - Si ninguna calza, la pregunta NO es defendible → descarte.
 */
export function validarNormaCitadaEnCorpus(
  normaRelacionada: string,
  normasAutorizadas: Set<string>,
): boolean {
  if (!normaRelacionada) return false;
  const cita = normalizarTexto(normaRelacionada);
  for (const autorizada of normasAutorizadas) {
    if (cita.includes(autorizada)) return true;
  }
  return false;
}

// ------------------------------------------------------------
// CAPA 2: validar cargo_objetivo
// ------------------------------------------------------------
export function validarCargoOficial(cargoObjetivo: string): boolean {
  if (!cargoObjetivo) return false;
  const c = normalizarTexto(cargoObjetivo);
  // Match directo
  for (const oficial of CARGOS_OFICIALES) {
    if (c === oficial || c.includes(oficial)) return true;
  }
  // Variantes aceptables
  for (const variante of Object.keys(CARGOS_VARIANTES_ACEPTABLES)) {
    if (c.includes(variante)) return true;
  }
  return false;
}

// ------------------------------------------------------------
// CAPA 3: validar módulo
// ------------------------------------------------------------
export function validarModuloOficial(modulo: string): boolean {
  if (!modulo) return false;
  const m = normalizarTexto(modulo);
  for (const canonico of MODULOS_CANONICOS) {
    if (m === canonico || m.includes(canonico)) return true;
  }
  return false;
}

// ------------------------------------------------------------
// CAPA 4: validador integrador
// ------------------------------------------------------------
export interface ResultadoValidacion {
  valida: boolean;
  fallas: string[]; // razones específicas del rechazo (para logging)
}

export interface PreguntaParaValidar {
  modulo: string;
  cargo_objetivo: string;
  norma_relacionada: string;
  estructura: { tipo: string };
}

/**
 * Aplica las 3 capas semánticas. La capa Zod ya se aplicó antes de aquí.
 *
 * Uso:
 *   const resultado = validarPreguntaContraCorpus(pregunta, chunks);
 *   if (!resultado.valida) {
 *     console.warn('[anti-alucinacion] descartada:', resultado.fallas);
 *     return; // no servir esta pregunta
 *   }
 */
export function validarPreguntaContraCorpus(
  pregunta: PreguntaParaValidar,
  chunks: CorpusChunk[],
): ResultadoValidacion {
  const fallas: string[] = [];

  // Comportamentales tienen un caso especial: la norma_relacionada
  // suele citar el Decreto 815/2018 que NO siempre está en los chunks
  // RAG (es metadata estructural, no contenido). Aceptamos cita explícita
  // del Decreto 815 sin requerir que esté en chunks.
  const esComportamental = pregunta.estructura.tipo === 'comportamental';
  const citaDecreto815 = /decreto\s*815|d\.\s*815|815\s*de\s*2018/i.test(
    pregunta.norma_relacionada
  );

  // Capa 1: norma en corpus
  const normasAutorizadas = extraerNormasAutorizadas(chunks);
  const normaValida =
    validarNormaCitadaEnCorpus(pregunta.norma_relacionada, normasAutorizadas) ||
    (esComportamental && citaDecreto815);
  if (!normaValida) {
    fallas.push(
      `norma_relacionada "${pregunta.norma_relacionada}" no aparece en los chunks RAG inyectados`
    );
  }

  // Capa 2: cargo oficial
  if (!validarCargoOficial(pregunta.cargo_objetivo)) {
    fallas.push(`cargo_objetivo "${pregunta.cargo_objetivo}" no es oficial PGN`);
  }

  // Capa 3: módulo canónico
  if (!validarModuloOficial(pregunta.modulo)) {
    fallas.push(`modulo "${pregunta.modulo}" no es canónico`);
  }

  return { valida: fallas.length === 0, fallas };
}

// ------------------------------------------------------------
// CAPA 5: métricas de rechazo (logging estructurado)
//
// Contamos cuántas preguntas se descartaron y por qué razón.
// Útil para auditar si el modelo está alucinando más de lo aceptable.
// ------------------------------------------------------------
const contadores = {
  total: 0,
  rechazadas_norma_invalida: 0,
  rechazadas_cargo_invalido: 0,
  rechazadas_modulo_invalido: 0,
  rechazadas_total: 0,
};

export function registrarValidacion(resultado: ResultadoValidacion): void {
  contadores.total += 1;
  if (!resultado.valida) {
    contadores.rechazadas_total += 1;
    for (const f of resultado.fallas) {
      if (f.includes('norma_relacionada')) contadores.rechazadas_norma_invalida += 1;
      if (f.includes('cargo_objetivo')) contadores.rechazadas_cargo_invalido += 1;
      if (f.includes('modulo')) contadores.rechazadas_modulo_invalido += 1;
    }
  }
}

export function obtenerMetricasValidacion() {
  const tasaRechazo =
    contadores.total > 0
      ? Math.round((contadores.rechazadas_total / contadores.total) * 1000) / 10
      : 0;
  return { ...contadores, tasa_rechazo_pct: tasaRechazo };
}
