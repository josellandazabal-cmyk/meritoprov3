'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ============================================================
// Banner de cookies — Cumplimiento Ley 1581/2012 + buena práctica.
//
// Modo opt-in: el banner se muestra hasta que el usuario decide
// "Aceptar todas" o "Solo esenciales". La decisión queda guardada en
// localStorage bajo `meritopro_cookies_v1`. Pixel Meta y GA4 se
// inicializan SÓLO si el usuario aceptó (ver CookieBanner.has() helper).
// ============================================================

const KEY = 'meritopro_cookies_v1';

type Decision = 'all' | 'essential' | null;

export function getCookieDecision(): Decision {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(KEY);
  if (v === 'all' || v === 'essential') return v;
  return null;
}

export function hasAcceptedAll(): boolean {
  return getCookieDecision() === 'all';
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // queueMicrotask defer evita la regla react-hooks/set-state-in-effect:
    // no se permite setState síncrono dentro del cuerpo del effect.
    queueMicrotask(() => {
      if (getCookieDecision() === null) {
        setVisible(true);
      }
    });
  }, []);

  function decidir(d: Exclude<Decision, null>) {
    window.localStorage.setItem(KEY, d);
    setVisible(false);
    // Recargamos para que los scripts condicionales (Pixel/GA4) se monten.
    if (d === 'all') {
      window.location.reload();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        maxWidth: 880,
        margin: '0 auto',
        backgroundColor: 'var(--color-bg-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.18)',
        padding: 'clamp(1rem, 3vw, 1.5rem)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      <div>
        <p
          id="cookie-banner-title"
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '0.375rem',
          }}
        >
          Cookies y tu privacidad
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Usamos cookies esenciales para que el sitio funcione, y cookies
          analíticas (Meta Pixel + Google Analytics) para entender cómo lo usas
          y mejorarlo. Puedes aceptar todas o sólo las esenciales. Más info en{' '}
          <Link
            href="/legal/cookies"
            style={{ color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Política de cookies
          </Link>
          .
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.625rem',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={() => decidir('essential')}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem', padding: '0.625rem 1rem' }}
        >
          Solo esenciales
        </button>
        <button
          type="button"
          onClick={() => decidir('all')}
          className="btn btn-primary"
          style={{ fontSize: '0.875rem', padding: '0.625rem 1rem' }}
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}
