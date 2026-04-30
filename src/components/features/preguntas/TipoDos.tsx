'use client';

import type { PreguntaTipoII } from '@/types';

interface TipoDosProps {
  pregunta: PreguntaTipoII;
  onAnswer: (id: string) => void;
  selectedId?: string;
  showResult?: boolean;
}

export default function TipoDos({
  pregunta,
  onAnswer,
  selectedId,
  showResult,
}: TipoDosProps) {
  return (
    // Card autocontenida: bg blanco + color oscuro explícito.
    // Funciona tanto en page claro (entrenar) como oscuro (simulacro).
    <div
      className="animate-slide-in-right"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
      }}
    >
      {/* Enunciado */}
      <p
        style={{
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          marginBottom: '1.25rem',
        }}
      >
        {pregunta.enunciado}
      </p>

      {/* Afirmaciones numeradas (1, 2, 3, 4) */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          Afirmaciones
        </p>
        <ol
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {pregunta.afirmaciones.map((af) => (
            <li
              key={af.id}
              style={{
                display: 'flex',
                gap: '0.5rem',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                // color explícito: la caja contenedora es blanca y el page del
                // simulacro fuerza color:white en su raíz.
                color: 'var(--color-text-primary)',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--color-ia)',
                  flexShrink: 0,
                  minWidth: '1.25rem',
                }}
              >
                {af.id}.
              </span>
              <span>{af.texto}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Opciones de combinación (A, B, C, D) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {pregunta.opciones.map((opcion) => {
          let className = 'question-option';
          if (selectedId === opcion.id) className += ' selected';
          if (showResult && opcion.id === pregunta.correcta_id) className += ' correct';
          if (showResult && selectedId === opcion.id && opcion.id !== pregunta.correcta_id)
            className += ' incorrect';

          return (
            <button
              key={opcion.id}
              className={className}
              onClick={() => !showResult && onAnswer(opcion.id)}
              disabled={showResult}
            >
              <span className="question-option-letter">{opcion.id}</span>
              <span>{opcion.texto}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
