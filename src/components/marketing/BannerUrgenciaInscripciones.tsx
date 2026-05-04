'use client';

// ============================================================
// BannerUrgenciaInscripciones — Banner de urgencia con countdown
//
// Muestra el estado dinámico de las inscripciones (pre/abiertas/
// cerradas) calculado en runtime sobre la fecha del cliente.
// Es 'use client' para evitar hydration mismatches por timezone.
//
// Variantes:
//   - 'hero'     → grande, hero de la landing (fondo destacado)
//   - 'inline'   → banner compacto inline (post-diagnóstico, checkout)
//   - 'pill'     → píldora pequeña (badges)
// ============================================================

import { useState, useEffect } from 'react';
import { estadoInscripciones, type EstadoInscripciones } from '@/lib/concurso/datos-oficiales';

type Variante = 'hero' | 'inline' | 'pill';

interface Props {
  variante?: Variante;
}

export default function BannerUrgenciaInscripciones({ variante = 'inline' }: Props) {
  // Estado inicial pre-render (SSR-safe): calculado al primer render.
  // Recalcular en client-mount para asegurar fecha local del usuario.
  const [estado, setEstado] = useState<EstadoInscripciones>(() => estadoInscripciones());

  useEffect(() => {
    setEstado(estadoInscripciones());
  }, []);

  // Color por fase (urgencia escalada)
  const colorTexto =
    estado.fase === 'cerradas'
      ? '#64748b'
      : estado.fase === 'abiertas'
        ? '#b91c1c'
        : '#854d0e';
  const colorFondo =
    estado.fase === 'cerradas'
      ? '#f1f5f9'
      : estado.fase === 'abiertas'
        ? '#fef2f2'
        : '#fefce8';
  const colorBorde =
    estado.fase === 'cerradas'
      ? '#cbd5e1'
      : estado.fase === 'abiertas'
        ? '#fecaca'
        : '#fde68a';

  const icono =
    estado.fase === 'cerradas' ? '⛔' : estado.fase === 'abiertas' ? '🔴' : '⏳';

  if (variante === 'pill') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: colorFondo,
          color: colorTexto,
          border: `1px solid ${colorBorde}`,
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
        }}
      >
        <span>{icono}</span>
        <span>{estado.mensajeCorto}</span>
      </span>
    );
  }

  if (variante === 'hero') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          backgroundColor: colorFondo,
          color: colorTexto,
          border: `1px solid ${colorBorde}`,
          borderRadius: 'var(--radius-lg)',
          maxWidth: '480px',
        }}
      >
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icono}</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
            {estado.mensajeCorto}
          </p>
          <p style={{ fontSize: '0.8125rem', opacity: 0.85, lineHeight: 1.4 }}>
            {estado.mensajeLargo}
          </p>
        </div>
      </div>
    );
  }

  // inline (default)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.875rem',
        backgroundColor: colorFondo,
        color: colorTexto,
        border: `1px solid ${colorBorde}`,
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: 600,
      }}
    >
      <span>{icono}</span>
      <span>{estado.mensajeCorto}</span>
    </div>
  );
}
