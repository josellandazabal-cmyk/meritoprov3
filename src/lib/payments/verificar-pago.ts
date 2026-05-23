// ============================================================
// /lib/payments/verificar-pago.ts
//
// Helper único para preguntar "¿este usuario ya pagó?".
// Centralizado aquí para que el middleware, los server actions y las
// páginas usen la misma fuente de verdad: la tabla `intenciones_pago`
// con estado='aprobada'.
//
// Diseño:
//  - Usa service role como cliente primario para evitar que problemas
//    de RLS bloqueen a usuarios legítimos en el middleware (edge runtime).
//  - Si service role no está disponible, cae al cliente del usuario.
//  - Si la tabla no existe, devuelve `false` (fail-closed).
// ============================================================

import { createClient as createClientRaw } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

async function checkPagoAdmin(userId: string): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const admin = createClientRaw(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await admin
      .from('intenciones_pago')
      .select('reference')
      .eq('user_id', userId)
      .eq('estado', 'aprobada')
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return null;
  }
}

export async function tienePagoAprobado(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  // Intenta con service role primero (bypassa RLS, funciona en edge runtime)
  const adminResult = await checkPagoAdmin(userId);
  if (adminResult !== null) return adminResult;

  // Fallback: cliente de sesión del usuario (requiere RLS correcta)
  try {
    const { data, error } = await supabase
      .from('intenciones_pago')
      .select('reference')
      .eq('user_id', userId)
      .eq('estado', 'aprobada')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[verificar-pago] supabase error:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (e) {
    console.warn('[verificar-pago] excepción:', e);
    return false;
  }
}

// Helper que resuelve el destino post-auth para un usuario:
//   - paid → /dashboard
//   - no paid → /checkout
// Útil en login, signup, OAuth callback. Centraliza la lógica para
// que cualquier cambio futuro (ej. trial, garantía no caducada) se
// aplique uniformemente.
export async function destinoPostAuth(
  supabase: SupabaseClient,
  userId: string
): Promise<'/dashboard' | '/checkout'> {
  const pago = await tienePagoAprobado(supabase, userId);
  return pago ? '/dashboard' : '/checkout';
}
