'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAcceptedAll } from '@/components/marketing/CookieBanner';

// ============================================================
// Meta Pixel — Carga condicionada al consentimiento de cookies
//
// Cumple Ley 1581/2012 + buena práctica: el script SOLO se inserta
// cuando el usuario aceptó "todas" en el banner de cookies. Si todavía
// no decidió o aceptó "solo esenciales", el componente no monta nada.
//
// El Pixel ID se lee de NEXT_PUBLIC_META_PIXEL_ID; si falta, usa el
// fallback hard-coded (sirve mientras se configura producción).
// Para apagarlo del todo, dejar la env var en string vacía.
//
// Helpers exportados:
//   trackEvent(eventName, params?) — para disparar eventos custom
//                                    (Lead, CompleteRegistration, Purchase…)
// ============================================================

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '965357529240670';

// El window.fbq global se declara en src/lib/analytics.ts (donde vive
// el `trackEvent` unificado que dispara a GA4 + Meta + GTM). No
// duplicamos la declaración aquí para mantener una sola fuente de tipos.

// Re-export del helper unificado por compatibilidad con código que aún
// hacía `import { trackEvent } from '@/components/analytics/MetaPixel'`.
// Internamente delega a la implementación canónica de @/lib/analytics.
export { trackEvent } from '@/lib/analytics';

export default function MetaPixel() {
  // Render condicional: sólo cargamos el script si:
  //   1. Hay PIXEL_ID configurado (no string vacío).
  //   2. El usuario aceptó cookies analíticas.
  // El estado arranca en false para no flashar el script en SSR.
  const [puedeCargar, setPuedeCargar] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (PIXEL_ID && hasAcceptedAll()) {
        setPuedeCargar(true);
      }
    });
  }, []);

  if (!puedeCargar) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
          `,
        }}
      />
      {/* Fallback noscript para usuarios que bloquean JS en su navegador.
          NextJS no genera <noscript> automáticamente desde JSX, pero el
          uso de <noscript> es válido en App Router al renderizar como HTML. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
