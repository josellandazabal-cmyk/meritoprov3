import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── Security headers en todas las rutas ──────────────────────────
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Impide que nuestra app sea embebida en iframes externos (clickjacking)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // ── CORS para rutas API: solo nuestra app desde el browser ───────
      // Los webhooks (MP, Wompi, Telegram) son server-to-server y no
      // envían Origin, por lo que no son afectados por estas cabeceras.
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-client-info, apikey',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
