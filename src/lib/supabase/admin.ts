// ============================================================
// Cliente admin con SERVICE ROLE — bypassa RLS.
//
// Úsalo SOLO en endpoints sin sesión autenticada (webhooks, cron jobs)
// donde necesitas leer/escribir tablas con RLS estricta. NUNCA lo
// expongas al cliente: este cliente tiene permisos totales.
//
// Casos de uso:
//   · /api/webhooks/telegram → vincular chat_id a usuario por UUID
//   · /api/cron/repaso       → leer sm2_repetition de todos los users
//   · /api/cron/remarketing  → leer leads no convertidos
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan env vars: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
