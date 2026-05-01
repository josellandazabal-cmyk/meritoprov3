import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// /auth/callback — Aterrizaje de OAuth providers (Google, etc.)
// y de magic links / recovery emails.
//
// Flujo:
//   1. El provider devuelve a esta ruta con ?code=<auth_code> y un
//      ?next=<destino opcional>.
//   2. Llamamos `exchangeCodeForSession(code)` para que Supabase
//      establezca las cookies de sesión.
//   3. Redirect al `next` (o /dashboard por defecto).
//
// Si no hay code o el exchange falla, mandamos al usuario a /login
// con ?error=oauth_callback_failed para mostrar mensaje amigable.
// ============================================================

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  // Hard guard: el `next` debe ser una ruta interna, no un URL externo
  // (para evitar open redirect). Sólo aceptamos paths que empiezan por /.
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

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
  } catch (e) {
    console.error('[Auth callback] excepción:', e);
    return NextResponse.redirect(
      new URL('/login?error=oauth_callback_failed', url.origin),
    );
  }

  return NextResponse.redirect(new URL(destino, url.origin));
}
