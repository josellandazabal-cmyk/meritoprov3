// LRU-lite in-memory cache for batch question generation.
// Keyed by session ID (= lead_id from the payload).
// TTL 30 min · max 500 concurrent sessions.
// Questions are stored as `unknown` — callers validate with Zod.

export const BATCH_SIZE = 5;

const TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 500;

interface Entry {
  pregunta: unknown;
  nivel: 1 | 2 | 3;
}

interface Sesion {
  preguntas: Map<number, Entry>; // absolute pregunta_actual → entry
  generando: Set<number>;        // batchStart indices currently in-flight
  createdAt: number;
  expiresAt: number;
}

const store = new Map<string, Sesion>();

function evictar(): void {
  const ahora = Date.now();
  for (const [k, s] of store) {
    if (s.expiresAt < ahora) store.delete(k);
  }
  if (store.size <= MAX_SESSIONS) return;
  const sorted = [...store.entries()].sort(([, a], [, b]) => a.createdAt - b.createdAt);
  sorted.slice(0, store.size - MAX_SESSIONS).forEach(([k]) => store.delete(k));
}

function getSesion(sessionId: string): Sesion {
  const ahora = Date.now();
  let s = store.get(sessionId);
  if (!s || s.expiresAt < ahora) {
    s = {
      preguntas: new Map(),
      generando: new Set(),
      createdAt: ahora,
      expiresAt: ahora + TTL_MS,
    };
    store.set(sessionId, s);
  }
  return s;
}

/**
 * Returns the cached raw question for the given absolute index if the nivel
 * matches. Returns null on miss or stale nivel (adaptive difficulty changed).
 */
export function getCached(
  sessionId: string,
  index: number,
  nivel: 1 | 2 | 3,
): unknown | null {
  const s = store.get(sessionId);
  if (!s || s.expiresAt < Date.now()) return null;
  const e = s.preguntas.get(index);
  if (!e) return null;
  if (e.nivel !== nivel) {
    // Adaptive level shifted → discard stale question
    s.preguntas.delete(index);
    return null;
  }
  return e.pregunta;
}

/**
 * Stores a batch of raw questions (already validated by the caller) starting
 * at startIndex. Clears the in-flight marker for startIndex.
 */
export function storeBatch(
  sessionId: string,
  preguntas: unknown[],
  startIndex: number,
  nivel: 1 | 2 | 3,
): void {
  evictar();
  const s = getSesion(sessionId);
  preguntas.forEach((p, i) => s.preguntas.set(startIndex + i, { pregunta: p, nivel }));
  s.generando.delete(startIndex);
}

/**
 * Marks a batch starting at batchStart as currently generating.
 * Prevents duplicate background calls for the same slot.
 */
export function setGenerating(sessionId: string, batchStart: number): void {
  getSesion(sessionId).generando.add(batchStart);
}

/**
 * Returns true when nextIndex is absent from cache AND no background job is
 * already in-flight for that slot — i.e. a refill call is warranted.
 */
export function needsRefill(sessionId: string, nextIndex: number): boolean {
  const s = store.get(sessionId);
  if (!s || s.expiresAt < Date.now()) return false;
  return !s.preguntas.has(nextIndex) && !s.generando.has(nextIndex);
}

/** Exposed for metrics / health checks. */
export function cacheStats(): { sessions: number; totalEntries: number } {
  let totalEntries = 0;
  for (const s of store.values()) totalEntries += s.preguntas.size;
  return { sessions: store.size, totalEntries };
}
