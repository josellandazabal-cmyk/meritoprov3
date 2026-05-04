'use client';

// ============================================================
// BloqueoSinDiagnostico — Pantalla "haz tu diagnóstico inicial primero"
//
// Se renderiza en /dashboard/entrenar y /dashboard/tutor cuando el
// usuario aún no ha hecho el simulacro de 40 preguntas. Sin punto
// de partida no hay forma de medir progreso, así que bloqueamos el
// acceso (con UX clara, no error técnico) y guiamos al diagnóstico.
// ============================================================

import Link from 'next/link';

interface Props {
  seccion: 'entrenar' | 'tutor';
}

const COPY = {
  entrenar: {
    titulo: 'Primero conozcamos tu nivel real',
    explicacion:
      'El entrenamiento adaptativo necesita un punto de partida. Haz el diagnóstico inicial de 40 preguntas (~30 minutos) y desbloquea el Bucle Diario hiperpersonalizado a tus brechas.',
    cta: 'Hacer diagnóstico inicial →',
  },
  tutor: {
    titulo: 'El Tutor IA necesita conocer tu nivel',
    explicacion:
      'Para hiper-personalizar las explicaciones a tu cargo y tus brechas reales, primero haz el diagnóstico inicial. Sin punto de partida no podemos calibrar el contenido.',
    cta: 'Hacer diagnóstico inicial →',
  },
};

export default function BloqueoSinDiagnostico({ seccion }: Props) {
  const copy = COPY[seccion];
  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '4rem auto',
        padding: '0 1rem',
      }}
    >
      <div
        className="card animate-fade-in-up"
        style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '2px dashed var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-ia-light)',
            color: 'var(--color-ia)',
            fontSize: '2rem',
            marginBottom: '1.25rem',
          }}
        >
          🔒
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.625rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '0.625rem',
          }}
        >
          {copy.titulo}
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          {copy.explicacion}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}
        >
          {[
            '40 preguntas con metodología oficial (Tipo I, II, III + Comportamental)',
            'Reloj de 45 minutos · UI Pearson VUE',
            'Resultado por módulo + plan personalizado al terminar',
          ].map((linea, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span style={{ color: 'var(--color-ia)' }}>✓</span>
              <span>{linea}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/diagnostico-inicial"
          className="btn btn-primary btn-xl"
          style={{ width: '100%', display: 'block', textAlign: 'center' }}
        >
          {copy.cta}
        </Link>

        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
