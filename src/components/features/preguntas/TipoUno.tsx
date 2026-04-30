'use client';

import type { PreguntaTipoI } from '@/types';

interface TipoUnoProps {
  pregunta: PreguntaTipoI;
  onAnswer: (id: string) => void;
  selectedId?: string;
  showResult?: boolean;
}

export default function TipoUno({
  pregunta,
  onAnswer,
  selectedId,
  showResult,
}: TipoUnoProps) {
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
          marginBottom: '1.5rem',
        }}
      >
        {pregunta.enunciado}
      </p>

      {/* Opciones A, B, C, D */}
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
