'use client';

// ============================================================
// HackDelDia — Tarjeta con técnica del día para el examen.
//
// Selecciona un hack estable por fecha (todos los usuarios ven el
// mismo hack durante 24h) — facilita conversaciones y referencias.
//
// Variantes:
//   · 'destacada' → grande, para dashboard inicio.
//   · 'inline'    → compacta, para sidebar / entre secciones.
// ============================================================

import { useEffect, useState } from 'react';
import {
  hackDelDia,
  hackParaTipo,
  hackParaModulo,
  type HackExamen,
} from '@/lib/contenido/hacks-examen';

type Variante = 'destacada' | 'inline';

interface Props {
  variante?: Variante;
  /** Filtrar por tipo de pregunta (en /entrenar para hack contextual). */
  tipoPregunta?: 'tipo_I' | 'tipo_II' | 'tipo_III' | 'comportamental';
  /** Filtrar por módulo (en /diagnostico cards de módulo). */
  modulo?: string;
}

const ETIQUETA_CATEGORIA: Record<string, string> = {
  estructura_examen: 'Estrategia general',
  tipo_I: 'Pregunta Tipo I',
  tipo_II: 'Pregunta Tipo II',
  tipo_III: 'Pregunta Tipo III',
  comportamental: 'Comportamentales',
  lectura: 'Comprensión lectora',
  tematico: 'Hack temático',
};

export default function HackDelDia({
  variante = 'destacada',
  tipoPregunta,
  modulo,
}: Props) {
  const [hack, setHack] = useState<HackExamen | null>(null);
  const [mostrarCaso, setMostrarCaso] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      // Prioridad: tipo > módulo > hack del día.
      let elegido: HackExamen | null = null;
      if (tipoPregunta) elegido = hackParaTipo(tipoPregunta);
      if (!elegido && modulo) elegido = hackParaModulo(modulo);
      if (!elegido) elegido = hackDelDia();
      setHack(elegido);
      setMostrarCaso(false); // resetea expansión al cambiar de hack
    });
  }, [tipoPregunta, modulo]);

  if (!hack) return null;

  const etiqueta = ETIQUETA_CATEGORIA[hack.categoria] ?? 'Técnica de examen';

  if (variante === 'inline') {
    return (
      <div
        style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--color-ia-light)',
          borderLeft: '3px solid var(--color-ia)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.375rem',
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>💡</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-ia)',
            }}
          >
            {etiqueta}
          </span>
        </div>
        <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
          {hack.titulo}
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>{hack.cuerpo}</p>
        {hack.ejemplo && (
          <p
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.625rem',
              backgroundColor: 'var(--color-bg-white)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            <strong style={{ fontStyle: 'normal' }}>Ejemplo:</strong>{' '}
            {hack.ejemplo}
          </p>
        )}
        {hack.casoPractico && (
          <button
            type="button"
            onClick={() => setMostrarCaso((v) => !v)}
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--color-ia)',
              padding: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {mostrarCaso ? '↑ Ocultar caso práctico' : '🔍 Ver caso práctico desarrollado'}
          </button>
        )}
        {hack.casoPractico && mostrarCaso && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-bg-white)',
              border: '1px solid var(--color-ia)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              lineHeight: 1.55,
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              {hack.casoPractico.titulo}
            </p>
            <p style={{ whiteSpace: 'pre-line', marginBottom: '0.5rem' }}>
              {hack.casoPractico.enunciado}
            </p>
            <ol style={{ paddingLeft: '1rem', marginBottom: '0.5rem' }}>
              {hack.casoPractico.desarrollo.map((p, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  {p}
                </li>
              ))}
            </ol>
            <p
              style={{
                padding: '0.375rem 0.5rem',
                backgroundColor: 'var(--color-ia-light)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}
            >
              <strong>Conclusión: </strong>
              {hack.casoPractico.conclusion}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Variante destacada (dashboard)
  return (
    <section
      className="animate-fade-in-up"
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background:
          'linear-gradient(135deg, var(--color-bg-white) 0%, #fef3c7 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        animationDelay: '0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: '1.25rem',
            width: 36,
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-cta)',
            color: 'var(--color-cta-text)',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
          }}
        >
          💡
        </span>
        <div>
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-muted)',
              marginBottom: '0.0625rem',
            }}
          >
            Técnica del día · {etiqueta}
          </p>
          <h2
            style={{
              fontSize: '1.0625rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              marginBottom: 0,
            }}
          >
            {hack.titulo}
          </h2>
        </div>
      </div>

      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          marginBottom: hack.ejemplo ? '0.875rem' : 0,
        }}
      >
        {hack.cuerpo}
      </p>

      {hack.ejemplo && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-bg-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            marginBottom: hack.casoPractico ? '0.625rem' : 0,
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-ia)',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Ejemplo aplicado
          </span>
          {hack.ejemplo}
        </div>
      )}

      {hack.casoPractico && !mostrarCaso && (
        <button
          type="button"
          onClick={() => setMostrarCaso(true)}
          style={{
            background: 'none',
            border: '1px dashed var(--color-ia)',
            color: 'var(--color-ia)',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          🔍 Ver caso práctico desarrollado
        </button>
      )}

      {hack.casoPractico && mostrarCaso && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '0.5rem',
            padding: '1rem 1.125rem',
            backgroundColor: 'var(--color-bg-white)',
            border: '1px solid var(--color-ia)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
          }}
        >
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
            📘 {hack.casoPractico.titulo}
          </p>

          <div
            style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '0.75rem',
              whiteSpace: 'pre-line',
              fontSize: '0.8125rem',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              Enunciado:
            </strong>
            {hack.casoPractico.enunciado}
          </div>

          <p
            style={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem',
            }}
          >
            Cómo se resuelve paso a paso
          </p>
          <ol
            style={{
              paddingLeft: '1.125rem',
              marginBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {hack.casoPractico.desarrollo.map((paso, i) => (
              <li key={i}>{paso}</li>
            ))}
          </ol>

          <div
            style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-ia-light)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--color-ia)',
              fontWeight: 500,
            }}
          >
            <strong style={{ color: 'var(--color-ia)' }}>Conclusión: </strong>
            {hack.casoPractico.conclusion}
          </div>

          <button
            type="button"
            onClick={() => setMostrarCaso(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              padding: '0.5rem 0',
              fontSize: '0.75rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
              textDecoration: 'underline',
            }}
          >
            Ocultar caso práctico
          </button>
        </div>
      )}
    </section>
  );
}
