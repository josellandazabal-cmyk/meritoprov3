import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tienePagoAprobado } from '@/lib/payments/verificar-pago';

// ============================================================
// /auth/callback — Aterrizaje de OAuth providers (Google, etc.)
// y de magic links / recovery emails.
//
// Flujo:
//   1. El provider devuelve a esta ruta con ?code=<auth_code> y un
//      ?next=<destino opcional>.
//   2. Llamamos `exchangeCodeForSession(code)` para que Supabase
//      establezca las cookies de sesión.
//   3. PAYWALL: si el usuario NO tiene pago aprobado, ignoramos `next`
//      y forzamos /checkout. Excepción: si `next` es un destino legítimo
//      pre-pago (ej. /login/restablecer para reset de password).
//   4. Redirect al `next` (o /dashboard por defecto) si hay pago.
//
// Si no hay code o el exchange falla, mandamos al usuario a /login
// con ?error=oauth_callback_failed para mostrar mensaje amigable.
// ============================================================

// Destinos `next` permitidos sin pago aprobado (rutas pre-pago).
// Cualquier otro destino se sobrescribe con /checkout cuando no hay pago.
const NEXT_PUBLICOS_PERMITIDOS = [
  '/login/restablecer',
  '/checkout',
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  // Hard guard: el `next` debe ser una ruta interna, no un URL externo
  // (para evitar open redirect). Sólo aceptamos paths que empiezan por /.
  const destinoPedido = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_no_code', url.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[Auth callback] exchangeCodeForSession:', error.message);
      return NextResponse.redirect(
        new URL('/login?error=oauth_callback_failed', url.origin),
      );
    }

    // Paywall enforcement post-OAuth: el cliente Supabase ya tiene la
    // sesión en cookies. Verificamos si pagó. Si no, /checkout (a menos
    // que el `next` original sea un destino pre-pago legítimo).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const esNextPublico = NEXT_PUBLICOS_PERMITIDOS.some(
        (p) => destinoPedido === p || destinoPedido.startsWith(`${p}/`)
      );

      if (!esNextPublico) {
        const pago = await tienePagoAprobado(supabase, user.id);
        if (!pago) {
          return NextResponse.redirect(new URL('/checkout?motivo=paywall', url.origin));
        }
      }
    }
  } catch (e) {
    console.error('[Auth callback] excepción:', e);
    return NextResponse.redirect(
      new URL('/login?error=oauth_callback_failed', url.origin),
    );
  }

  return NextResponse.redirect(new URL(destinoPedido, url.origin));
}
