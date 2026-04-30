'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAcceptedAll } from '@/components/marketing/CookieBanner';

// ============================================================
// GA4 — Carga condicionada al consentimiento de cookies analíticas.
//
// Misma lógica que MetaPixel: el script SOLO se inserta si el usuario
// aceptó "todas" en el banner. Reutilizamos `hasAcceptedAll()` para no
// dispersar la fuente de verdad del consent.
//
// ID de propiedad GA4 vía NEXT_PUBLIC_GA4_ID. Si falta, el componente
// no monta nada (a diferencia del Pixel, GA4 no tiene fallback público
// — se asigna por proyecto).
//
// El initial PageView se dispara automáticamente porque NO seteamos
// `send_page_view: false`. SPA route changes pueden trackearse manual
// con `trackEvent('page_view', { page_path })` desde el código.
// ============================================================

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID ?? '';

export default function GoogleAnalytics() {
  const [puedeCargar, setPuedeCargar] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (GA_ID && hasAcceptedAll()) {
        setPuedeCargar(true);
      }
    });
  }, []);

  if (!puedeCargar || !GA_ID) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });
          `,
        }}
      />
    </>
  );
}
