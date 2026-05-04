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

// Copy persuasivo afilado — apela al ego ("antes que la mayoría"),
// a la capacidad ("ya estás más cerca") y a la necesidad de aprobación
// ("decisivo en tu carrera"). Sin promesas vacías.
function copyPersuasivo(estado: EstadoInscripciones): {
  titulo: string;
  bajada: string;
  cta: string;
} {
  if (estado.fase === 'pre') {
    return {
      titulo:
        estado.diasFaltantes === 1
          ? 'día para llegar listo'
          : 'días para llegar listo',
      bajada:
        'El concurso PGN abre el 1 de junio. Sé de los pocos aspirantes que llegan con su nivel real medido — no con corazonadas.',
      cta: 'Empieza con tu diagnóstico gratuito',
    };
  }
  if (estado.fase === 'abiertas') {
    if (estado.diasParaCierre === 0) {
      return {
        titulo: 'Último día para inscribirte',
        bajada:
          'Cierra hoy a las 16:00 hora Colombia. Próxima oportunidad: ~2028. Esto se decide hoy.',
        cta: 'Inscríbete ahora',
      };
    }
    return {
      titulo:
        estado.diasParaCierre === 1
          ? 'día para asegurar tu cupo'
          : 'días para asegurar tu cupo',
      bajada:
        'La PGN cierra el portal el 12 de junio sin prórroga. Quien decide hoy, llega al examen con ventaja real sobre el resto.',
      cta: 'Inscríbete ya',
    };
  }
  return {
    titulo: 'Inscripciones cerradas',
    bajada:
      'Próximo concurso PGN proyectado para ~2028. Empieza ya tu preparación: cuando se abra, llegarás muy adelante.',
    cta: 'Hacer mi diagnóstico',
  };
}

// ============================================================
// PALETA por fase — alineada al brand (indigo) en lugar de amber.
// La paleta amber chocaba con el CTA amarillo y rompía la jerarquía
// visual del hero. Ahora indigo = pre (institucional, premium),
// rose = abiertas (urgencia sobria), slate = cerradas.
// ============================================================
function paletaFase(estado: EstadoInscripciones) {
  if (estado.fase === 'cerradas') {
    return {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)',
      borde: '#cbd5e1',
      acento: '#64748b',
      numero: '#334155',
    };
  }
  if (estado.fase === 'abiertas') {
    // Rose-coral: urgencia sin choque con el CTA amarillo
    return {
      bg: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
      borde: '#fca5a5',
      acento: '#b91c1c',
      numero: '#7f1d1d',
    };
  }
  // pre → indigo (color brand, premium e institucional)
  return {
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    borde: '#c4b5fd',
    acento: '#6d28d9',
    numero: '#4f46e5', // var(--color-ia)
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
