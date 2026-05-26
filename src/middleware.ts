import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Orígenes autorizados para llamar la API desde el browser.
// Webhooks (MP, Wompi, Telegram) son server-to-server y no envían Origin.
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? [
        'https://meritoprocol.com',
        'https://www.meritoprocol.com',
      ]
    : [
        'https://meritoprocol.com',
        'https://www.meritoprocol.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  const origin = request.headers.get('origin');

  // ── Preflight CORS (OPTIONS) ─────────────────────────────────────────
  if (isApiRoute && request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Vary', 'Origin');
    }
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // ── Sesión Supabase + paywall ────────────────────────────────────────
  const response = await updateSession(request);

  // ── Añadir CORS al header de respuesta real ──────────────────────────
  if (isApiRoute && origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
    // Si el Origin no está en la lista, NO añadimos Access-Control-Allow-Origin
    // → el browser rechaza la respuesta (CORS bloqueado).
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
