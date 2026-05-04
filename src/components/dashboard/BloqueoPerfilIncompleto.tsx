// ============================================================
// BloqueoPerfilIncompleto — Pantalla "completa tu perfil primero"
//
// Se renderiza ANTES del diagnóstico inicial (gate más estricto que
// BloqueoSinDiagnostico). Sin cargo/nivel/profesión/fecha_examen no se
// puede personalizar: las preguntas serían genéricas, el Tutor no
// citaría normativa relevante al cargo, y el remarketing sería ciego.
// ============================================================

import Link from 'next/link';

interface Props {
  /** Sección desde la que se intentó acceder (para copy contextualizado). */
  seccion: 'diagnostico' | 'entrenar' | 'tutor';
}

const COPY: Record<Props['seccion'], { titulo: string; explicacion: string }> = {
  diagnostico: {
    titulo: 'Antes del diagnóstico, cuéntanos sobre ti',
    explicacion:
      'El simulacro de 40 preguntas se adapta a tu cargo y nivel jerárquico. Sin esos datos las preguntas serían genéricas y el resultado, inútil.',
  },
  entrenar: {
    titulo: 'Primero completa tu perfil',
    explicacion:
      'Para que el Bucle Diario adaptativo y la curva del olvido SM-2 funcionen contigo, necesitamos saber tu cargo objetivo, profesión y fecha estimada de examen.',
  },
  tutor: {
    titulo: 'Tu Tutor IA necesita conocerte',
    explicacion:
      'Para que el Tutor cite normativa relevante a tu cargo (Procurador Judicial, Técnico Investigador, etc.) y adapte las explicaciones, primero completa tu perfil.',
  },
};

export default function BloqueoPerfilIncompleto({ seccion }: Props) {
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
          border: '2px solid var(--color-ia)',
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
          👤
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
            'Cargo y nivel jerárquico al que aspiras',
            'Profesión o formación académica',
            'Fecha estimada del examen',
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
          href="/dashboard/completar-perfil"
          className="btn btn-primary btn-xl"
          style={{ width: '100%', display: 'block', textAlign: 'center' }}
        >
          Completar mi perfil → (1 minuto)
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
