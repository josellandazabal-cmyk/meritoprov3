'use client';

// ============================================================
// BannerUrgenciaInscripciones — Countdown estético al concurso PGN 2026
//
// Diseño V2 (May 2026):
//   - Número de días GRANDE (jerarquía visual de urgencia).
//   - Animación count-up de 0 → diasFaltantes (1.5s, easeOutCubic).
//   - Borde acentuado izquierdo + fondo cream, alineado al sistema.
//   - Sin emojis estridentes — solo iconografía SVG sobria.
//   - Copy persuasivo afilado (Estrategia de Marketing V1, §3).
//
// Variantes:
//   · 'hero'   → grande, hero de la landing (con número XXL).
//   · 'inline' → compacto, post-diagnóstico/checkout (número mediano).
//   · 'pill'   → píldora, badges (sin animación, una sola línea).
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  estadoInscripciones,
  type EstadoInscripciones,
} from '@/lib/concurso/datos-oficiales';

type Variante = 'hero' | 'inline' | 'pill';

interface Props {
  variante?: Variante;
}

// ============================================================
// Hook: anima un valor de 0 al target con easeOutCubic.
// `key` se usa para reiniciar la animación cuando cambia el valor.
// ============================================================
function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    startedAtRef.current = 0;

    const tick = (now: number) => {
      if (!startedAtRef.current) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}

// ============================================================
// Helpers para el número de días según fase (sin afectar el copy)
// ============================================================
function diasDelEstado(estado: EstadoInscripciones): number {
  if (estado.fase === 'pre') return estado.diasFaltantes;
  if (estado.fase === 'abiertas') return estado.diasParaCierre;
  return 0;
}

// Copy persuasivo afilado según fase (alineado con Estrategia §3)
function copyPersuasivo(estado: EstadoInscripciones): {
  titulo: string;
  bajada: string;
  cta: string;
} {
  if (estado.fase === 'pre') {
    return {
      titulo: estado.diasFaltantes === 1 ? 'día para preparar tu candidatura' : 'días para preparar tu candidatura',
      bajada: 'Inscripciones abren el 1 de junio de 2026. Mide tu nivel real antes que cualquier otro aspirante.',
      cta: 'Empieza con tu diagnóstico gratuito',
    };
  }
  if (estado.fase === 'abiertas') {
    if (estado.diasParaCierre === 0) {
      return {
        titulo: 'Hoy cierra inscripciones',
        bajada: 'Hasta las 16:00 hora Colombia. Después, próximo concurso ~2028.',
        cta: 'Inscríbete ahora',
      };
    }
    return {
      titulo: estado.diasParaCierre === 1 ? 'día para inscribirte' : 'días para inscribirte',
      bajada: `Inscripciones abiertas hasta el 12 de junio. Después esperas al próximo concurso (~2028).`,
      cta: 'Inscríbete ya',
    };
  }
  return {
    titulo: 'Inscripciones cerradas',
    bajada: 'Próximo concurso PGN proyectado para ~2028. Mantente preparado con el diagnóstico.',
    cta: 'Hacer mi diagnóstico',
  };
}

// ============================================================
// PALETA por fase (alineada con design tokens)
// ============================================================
function paletaFase(estado: EstadoInscripciones) {
  if (estado.fase === 'cerradas') {
    return {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borde: '#cbd5e1',
      acento: '#64748b',
      numero: '#475569',
    };
  }
  if (estado.fase === 'abiertas') {
    return {
      bg: 'linear-gradient(135deg, #fef9f3 0%, #fef3ec 100%)',
      borde: '#fdba74',
      acento: '#c2410c',
      numero: '#9a3412',
    };
  }
  // pre → tono cálido, persuasivo sin gritar
  return {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    borde: '#fcd34d',
    acento: '#a16207',
    numero: '#854d0e',
  };
}

// ============================================================
// COMPONENTE
// ============================================================
export default function BannerUrgenciaInscripciones({
  variante = 'inline',
}: Props) {
  const [estado, setEstado] = useState<EstadoInscripciones>(() =>
    estadoInscripciones()
  );

  useEffect(() => {
    queueMicrotask(() => setEstado(estadoInscripciones()));
  }, []);

  const dias = diasDelEstado(estado);
  const diasAnimados = useCountUp(dias);
  const copy = copyPersuasivo(estado);
  const paleta = paletaFase(estado);

  // ============================================================
  // VARIANTE PILL — micro badge (sin animación)
  // ============================================================
  if (variante === 'pill') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3125rem 0.875rem',
          background: paleta.bg,
          color: paleta.numero,
          border: `1px solid ${paleta.borde}`,
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {estado.fase !== 'cerradas' && (
          <strong style={{ color: paleta.acento, fontWeight: 800 }}>
            {dias}
          </strong>
        )}
        <span>{estado.fase === 'cerradas' ? 'Inscripciones cerradas' : copy.titulo}</span>
      </span>
    );
  }

  // ============================================================
  // VARIANTE HERO — landing principal (número XXL, copy persuasivo)
  // ============================================================
  if (variante === 'hero') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '1.25rem',
          padding: '1.25rem 1.5rem',
          background: paleta.bg,
          border: `1px solid ${paleta.borde}`,
          borderLeft: `4px solid ${paleta.acento}`,
          borderRadius: 'var(--radius-lg)',
          maxWidth: '560px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {estado.fase !== 'cerradas' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '88px',
              paddingRight: '1.25rem',
              borderRight: `1px solid ${paleta.borde}`,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(2.75rem, 7vw, 3.75rem)',
                fontWeight: 800,
                color: paleta.numero,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {diasAnimados}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: paleta.acento,
                marginTop: '0.25rem',
              }}
            >
              {dias === 1 ? 'DÍA' : 'DÍAS'}
            </span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: paleta.numero,
              marginBottom: '0.25rem',
              letterSpacing: '-0.01em',
            }}
          >
            {estado.fase === 'cerradas' ? copy.titulo : `${copy.titulo}`}
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: paleta.acento,
              lineHeight: 1.5,
              opacity: 0.92,
            }}
          >
            {copy.bajada}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // VARIANTE INLINE (default) — compacta con número mediano animado
  // ============================================================
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.75rem 1rem',
        background: paleta.bg,
        border: `1px solid ${paleta.borde}`,
        borderLeft: `3px solid ${paleta.acento}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      {estado.fase !== 'cerradas' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '48px',
          }}
        >
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: paleta.numero,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
            }}
          >
            {diasAnimados}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: paleta.acento,
              marginTop: '0.125rem',
            }}
          >
            {dias === 1 ? 'DÍA' : 'DÍAS'}
          </span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color: paleta.numero,
            marginBottom: '0.125rem',
          }}
        >
          {copy.titulo}
        </p>
        <p
          style={{
            fontSize: '0.75rem',
            color: paleta.acento,
            lineHeight: 1.4,
            opacity: 0.9,
          }}
        >
          {copy.bajada}
        </p>
      </div>
    </div>
  );
}
