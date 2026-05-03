'use client';

import { useEffect, useRef, useState } from 'react';
import {
  obtenerRespuestasRapidas,
  type RespuestaRapida,
} from '@/app/dashboard/respuestas-rapidas-actions';

// ============================================================
// Carrusel horizontal de tarjetas con respuestas rápidas para las
// brechas SM-2 detectadas del usuario. Usa CSS scroll-snap (touch
// nativo en mobile, scroll horizontal con mouse en desktop) + 2
// botones < > de navegación accesible para teclado.
//
// Si no hay brechas → no renderiza nada (cero ruido en la UI para
// usuarios al día o sin historial).
// ============================================================

export default function RespuestasRapidasSwipe() {
  const [tarjetas, setTarjetas] = useState<RespuestaRapida[]>([]);
  const [cargando, setCargando] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelado = false;
    void obtenerRespuestasRapidas()
      .then((data) => {
        if (!cancelado) {
          setTarjetas(data);
          setCargando(false);
        }
      })
      .catch((err) => {
        console.warn('[RespuestasRapidas] error:', err);
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function scrollHorizontal(direccion: 'prev' | 'next') {
    const sc = scrollerRef.current;
    if (!sc) return;
    const cardWidth = sc.firstElementChild?.clientWidth ?? 320;
    const gap = 16;
    sc.scrollBy({
      left: direccion === 'next' ? cardWidth + gap : -(cardWidth + gap),
      behavior: 'smooth',
    });
  }

  if (cargando) return null; // sin skeleton, evitamos ruido visual
  if (tarjetas.length === 0) return null;

  return (
    <section
      className="animate-fade-in-up"
      style={{ marginTop: '2rem', animationDelay: '0.2s' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.875rem',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.0625rem', marginBottom: '0.125rem' }}>
            Respuestas rápidas para tus brechas
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Repaso veloz de los temas donde más fallas. Desliza →
          </p>
        </div>

        {/* Botones navegación desktop — ocultos en mobile (usar swipe) */}
        <div style={{ display: 'flex', gap: '0.375rem' }} className="hide-on-mobile">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollHorizontal('prev')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-white)',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollHorizontal('next')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-white)',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        role="region"
        aria-label="Tarjetas de repaso"
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: '0.25rem',
          paddingBottom: '0.5rem',
          // Ocultar scrollbar en webkit (Chrome/Safari).
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {tarjetas.map((t, i) => (
          <article
            key={`${t.tema}-${i}`}
            style={{
              flex: '0 0 320px',
              maxWidth: 320,
              scrollSnapAlign: 'start',
              padding: '1.125rem 1.25rem',
              backgroundColor: 'var(--color-bg-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <header>
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-dominio-brecha)',
                  marginBottom: '0.25rem',
                }}
              >
                Brecha detectada
              </p>
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.35,
                }}
              >
                {t.tema}
              </h3>
            </header>

            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.55,
                flex: 1,
              }}
            >
              {t.contenido}
            </p>

            <footer
              style={{
                paddingTop: '0.625rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                }}
              >
                {[t.norma, t.articulo, t.numeral].filter(Boolean).join(', ')}
              </p>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
