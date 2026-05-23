// ============================================================
// MéritoPro CRM — Configuración dinámica desde tabla `configuracion`
// Lee clave/valor y cachea por proceso (no por request) para
// evitar múltiples roundtrips en un mismo cron.
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin';

let cache: Record<string, string> | null = null;
let cacheAt: number = 0;
const CACHE_TTL_MS = 60_000; // 1 minuto

export async function getAllConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('configuracion')
    .select('clave, valor');

  if (error) {
    throw new Error(`[CRM config] Error leyendo configuracion: ${error.message}`);
  }

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.clave && row.valor !== null) {
      result[row.clave as string] = String(row.valor);
    }
  }

  cache = result;
  cacheAt = now;
  return result;
}

export async function getConfig(clave: string): Promise<string> {
  const all = await getAllConfig();
  const val = all[clave];
  if (val === undefined) {
    throw new Error(`[CRM config] Clave no encontrada: ${clave}`);
  }
  return val;
}

export async function getConfigNumber(clave: string): Promise<number> {
  const val = await getConfig(clave);
  const num = Number(val);
  if (isNaN(num)) {
    throw new Error(`[CRM config] Clave "${clave}" no es un número: "${val}"`);
  }
  return num;
}
