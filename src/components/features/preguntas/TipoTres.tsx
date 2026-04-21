'use client';

import type { PreguntaTipoIII } from '@/types';

interface TipoTresProps {
  pregunta: PreguntaTipoIII;
  onAnswer: (id: string) => void;
  selectedId?: string;
  showResult?: boolean;
}

export default function TipoTres({
  pregunta,
  onAnswer,
  selectedId,
  showResult,
}: TipoTresProps) {
  return (
    <div className="animate-slide-in-right">
      {/* Afirmación PORQUE Razón */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Afirmación */}
        <div style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-ia)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem',
            }}
          >
            Afirmación
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.7 }}>{pregunta.afirmacion}</p>
        </div>

        {/* Conector PORQUE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '0.75rem 0',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: 'var(--color-border)',
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.875rem',
              color: 'var(--color-cta-hover)',
              letterSpacing: '0.1em',
            }}
          >
            PORQUE
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: 'var(--color-border)',
            }}
          />
        </div>

        {/* Razón */}
        <div>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-dominio-brecha)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem',
            }}
          >
            Razón
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.7 }}>{pregunta.razon}</p>
        </div>
      </div>

      {/* Opciones A-E */}
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
              style={{ fontSize: '0.875rem' }}
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
