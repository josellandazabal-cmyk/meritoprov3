'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

// ============================================================
// TrackPurchase — dispara fbq('track', 'Purchase', {...}) UNA sola vez
// al montarse, con guardado anti-duplicado en sessionStorage para que
// si el usuario refresca /dashboard/bienvenida no se cuente dos veces.
//
// Pensado para usarse desde server components: render <TrackPurchase
// reference="..." valueCop={297000} /> y olvidarse.
// ============================================================

interface Props {
  reference: string;
  valueCop: number;
  currency?: string;
  contentName?: string;
}

const STORAGE_KEY = 'meritopro_purchase_tracked_v1';

export default function TrackPurchase({
  reference,
  valueCop,
  currency = 'COP',
  contentName = 'plan_meritopro',
}: Props) {
  const yaDisparado = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (yaDisparado.current) return;
      try {
        const trackeadas = JSON.parse(
          window.sessionStorage.getItem(STORAGE_KEY) ?? '[]'
        ) as string[];
        if (trackeadas.includes(reference)) return;
        // `purchase` (GA4 standard) → mapeado a `Purchase` para Meta.
        trackEvent('purchase', {
          value: valueCop,
          currency,
          content_name: contentName,
          content_type: 'product',
          transaction_id: reference,
        });
        trackeadas.push(reference);
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trackeadas));
        yaDisparado.current = true;
      } catch {
        // sessionStorage puede fallar en navegadores con privacy mode
        // muy estricto; en ese caso intentamos al menos disparar el evento.
        trackEvent('purchase', {
          value: valueCop,
          currency,
          content_name: contentName,
          transaction_id: reference,
        });
        yaDisparado.current = true;
      }
    });
  }, [reference, valueCop, currency, contentName]);

  return null;
}
