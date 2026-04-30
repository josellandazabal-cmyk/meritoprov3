'use client';

// ============================================================
// Analytics — helper unificado para GA4 + Meta Pixel + GTM dataLayer.
//
// Llamar `trackEvent(name, params)` dispara el evento en las tres
// plataformas a la vez. Si alguna no está cargada (consent denied,
// env var vacía, plataforma todavía no inicializada), su llamada es
// no-op y las demás siguen funcionando.
//
// Convenciones de naming (importante):
//   - Usamos nombres GA4 en snake_case (purchase, generate_lead,
//     sign_up, view_item).
//   - El mapping META_NAME_MAP traduce al nombre canónico de Meta
//     (Purchase, Lead, CompleteRegistration). Si un nombre no está
//     mapeado, va como `trackCustom`.
//   - GTM recibe siempre el nombre tal cual en `event`.
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const META_NAME_MAP: Record<string, string> = {
  purchase: 'Purchase',
  generate_lead: 'Lead',
  lead: 'Lead',
  sign_up: 'CompleteRegistration',
  add_to_cart: 'AddToCart',
  view_item: 'ViewContent',
  begin_checkout: 'InitiateCheckout',
};

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined') return;

  // 1) Google Analytics 4
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }

  // 2) Meta Pixel
  if (typeof window.fbq === 'function') {
    const metaName = META_NAME_MAP[name];
    if (metaName) {
      window.fbq('track', metaName, params);
    } else {
      // Si no está en el mapping lo enviamos como evento custom de Meta.
      window.fbq('trackCustom', name, params);
    }
  }

  // 3) GTM dataLayer
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...params });
  }
}
