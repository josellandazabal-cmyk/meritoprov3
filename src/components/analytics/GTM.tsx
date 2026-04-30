'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAcceptedAll } from '@/components/marketing/CookieBanner';

// ============================================================
// Google Tag Manager — Carga condicionada al consentimiento.
//
// GTM permite añadir/cambiar tags (GA4, Pixel, Hotjar, etc.) sin
// redeploy. Si no usas GTM puedes dejar NEXT_PUBLIC_GTM_ID vacío y el
// componente no monta nada.
//
// Exportamos también `GTMNoScript` para el fallback `<noscript>` en el
// body. Ambos respetan el consent.
// ============================================================

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';

function useConsentReady(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      if (GTM_ID && hasAcceptedAll()) setOk(true);
    });
  }, []);
  return ok;
}

export default function GTM() {
  const ready = useConsentReady();
  if (!ready || !GTM_ID) return null;

  return (
    <Script
      id="gtm-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
        `,
      }}
    />
  );
}

export function GTMNoScript() {
  const ready = useConsentReady();
  if (!ready || !GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height={0}
        width={0}
        style={{ display: 'none', visibility: 'hidden' }}
        title="GTM"
      />
    </noscript>
  );
}
