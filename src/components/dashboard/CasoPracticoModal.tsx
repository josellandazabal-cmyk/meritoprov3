'use client';

// ============================================================
// CasoPracticoModal — Modal con caso práctico desarrollado del hack.
//
// Reemplaza la expansión inline anterior. Layout más cómodo de leer
// (más ancho, mejor jerarquía visual, scroll independiente del page).
// ============================================================

import { useEffect } from 'react';
import type { HackExamen } from '@/lib/contenido/hacks-examen';

interface Props {
  hack: HackExamen;
  onClose: () => void;
}

export default function CasoPracticoModal({ hack, onClose }: Props) {
  // Cerrar con tecla Escape + bloquear scroll del body
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!hack.casoPractico) return null;
  const c = hack.casoPractico;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Caso práctico: ${c.titulo}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{
          backgroundColor: 'var(--color-bg-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '0',
          maxWidth: '640px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
        }}
      >
        {/* Header con cierre */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.5rem 1.5rem 0.875rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-ia)',
                marginBottom: '0.375rem',
              }}
            >
              📘 Caso práctico desarrollado
            </p>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                marginBottom: 0,
                lineHeight: 1.3,
              }}
            >
              {c.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: 'var(--color-text-muted)',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            Técnica aplicada
          </p>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.55,
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-ia-light)',
              borderLeft: '3px solid var(--color-ia)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <strong style={{ color: 'var(--color-ia)', display: 'block', marginBottom: '0.25rem' }}>
              {hack.titulo}
            </strong>
            {hack.cuerpo}
          </p>

          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            Enunciado
          </p>
          <div
            style={{
              padding: '1rem 1.125rem',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              whiteSpace: 'pre-line',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              color: 'var(--color-text-primary)',
            }}
          >
            {c.enunciado}
          </div>

          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.625rem',
            }}
          >
            Resolución paso a paso
          </p>
          <ol
            style={{
              paddingLeft: '1.5rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            {c.desarrollo.map((paso, i) => (
              <li key={i}>{paso}</li>
            ))}
          </ol>

          <div
            style={{
              padding: '1rem 1.125rem',
              backgroundColor: 'var(--color-ia-light)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--color-ia)',
            }}
          >
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-ia)',
                marginBottom: '0.375rem',
              }}
            >
              Conclusión
            </p>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
              {c.conclusion}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', fontWeight: 600 }}
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
