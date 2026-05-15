import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { tienePagoAprobado } from '@/lib/payments/verificar-pago';

// ============================================================
// Middleware de sesión + Paywall
//
// Hace dos cosas en orden:
//   1. Refresca cookies de sesión Supabase (necesario para Server
//      Components que llaman supabase.auth.getUser()).
//   2. Enforce paywall en rutas protegidas: si el usuario está
//      autenticado pero no ha pagado, lo manda a /checkout.
//      Si no está autenticado, lo manda a /login.
//
// Rutas protegidas: cualquier `/dashboard/*` excepto:
//   - /dashboard/bienvenida — pantalla post-pago, valida ?ref= ella misma
// El simulacro de diagnóstico (/diagnostico/*) es público y vive fuera
// de /dashboard, así que NO está protegido aquí (ése es el funnel
// pre-pago intencional).
// ============================================================

const RUTAS_PROTEGIDAS = ['/dashboard'];
const RUTAS_PROTEGIDAS_EXCEPCIONES = [
  '/dashboard/bienvenida', // valida ?ref= ella misma
];

function esProtegida(pathname: string): boolean {
  if (!RUTAS_PROTEGIDAS.some((p) => pathname.startsWith(p))) return false;
  if (RUTAS_PROTEGIDAS_EXCEPCIONES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Refresh session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Paywall enforcement
  const pathname = request.nextUrl.pathname;

  if (esProtegida(pathname)) {
    if (!user) {
      // Sin sesión → al login, guardando el destino para post-login redirect
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    const pago = await tienePagoAprobado(supabase, user.id);
    if (!pago) {
      // Autenticado pero sin pago → forzar checkout
      const url = request.nextUrl.clone();
      url.pathname = '/checkout';
      // Limpiar params pero conservar contexto del intento
      url.search = '';
      url.searchParams.set('motivo', 'paywall');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
