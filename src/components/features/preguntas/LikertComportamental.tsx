'use client';

import type { PreguntaComportamental } from '@/types';

interface LikertProps {
  pregunta: PreguntaComportamental;
  onAnswer: (valor: number) => void;
  selectedValue?: number;
}

const LABELS_FRECUENCIA = ['Nunca', 'Casi nunca', 'A veces', 'Casi siempre', 'Siempre'];
const LABELS_ACUERDO = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Totalmente de acuerdo',
];

export default function LikertComportamental({
  pregunta,
  onAnswer,
  selectedValue,
}: LikertProps) {
  const labels = pregunta.escala === 'frecuencia' ? LABELS_FRECUENCIA : LABELS_ACUERDO;
  const escalaLabel = pregunta.escala === 'frecuencia' ? 'Frecuencia' : 'Nivel de acuerdo';

  return (
    <div className="animate-slide-in-right">
      {/* Badge de competencia */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: 'var(--color-ia-light)',
          color: 'var(--color-ia)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        📋 {pregunta.competencia_evaluada}
      </div>

      {/* Enunciado situacional */}
      <p
        style={{
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          marginBottom: '2rem',
          color: 'var(--color-text-primary)',
        }}
      >
        {pregunta.enunciado_situacional}
      </p>

      {/* Escala label */}
      <p
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {escalaLabel}
      </p>

      {/* Botones 1-5 */}
      <div className="likert-scale">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            className={`likert-btn ${selectedValue === valor ? 'selected' : ''}`}
            onClick={() => onAnswer(valor)}
          >
            {valor}
          </button>
        ))}
      </div>

      {/* Labels debajo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          padding: '0 0.25rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            maxWidth: '80px',
            textAlign: 'center',
          }}
        >
          {labels[0]}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            maxWidth: '80px',
            textAlign: 'center',
          }}
        >
          {labels[4]}
        </span>
      </div>
    </div>
  );
}
