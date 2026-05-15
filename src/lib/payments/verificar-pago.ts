// ============================================================
// /lib/payments/verificar-pago.ts
//
// Helper único para preguntar "¿este usuario ya pagó?".
// Centralizado aquí para que el middleware, los server actions y las
// páginas usen la misma fuente de verdad: la tabla `intenciones_pago`
// con estado='aprobada'.
//
// Diseño:
//  - El RLS de `intenciones_pago` permite al dueño leer sus propias
//    filas (policy "Usuario lee sus propias intenciones"). Por eso el
//    cliente del usuario funciona sin service role.
//  - En el middleware no podemos importar @/lib/supabase/server porque
//    next/headers no está disponible. Se acepta el cliente Supabase ya
//    creado para evitar dependencias cíclicas.
//
// Si la tabla no existe (Supabase no ha aplicado migración 0004),
// devuelve `false` para fallar cerrado: "no demostramos pago → bloqueado".
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export async function tienePagoAprobado(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('intenciones_pago')
      .select('reference')
      .eq('user_id', userId)
      .eq('estado', 'aprobada')
      .limit(1)
      .maybeSingle();

    if (error) {
      // Si la tabla no existe o RLS bloquea, fail-closed.
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
