// ============================================================
// TarjetaConectarTelegram — Promo del bot Asesor en el dashboard.
//
// Solo se renderiza cuando el usuario aún NO ha vinculado Telegram.
// Una vez conectado, el componente padre la oculta. Su objetivo es
// que la persona aproveche el bot como canal de estudio asíncrono
// — el más eficiente del producto.
// ============================================================

import Link from 'next/link';

const VENTAJAS = [
  {
    icon: '⏱️',
    titulo: 'Estudia sin abrir el computador',
    desc: 'Píldoras de repaso en tu chat — al desayuno, en el bus, en el almuerzo.',
  },
  {
    icon: '🧠',
    titulo: 'Curva del olvido controlada',
    desc: 'El algoritmo SM-2 elige qué pregunta repasar justo antes de que la olvides.',
  },
  {
    icon: '⚖️',
    titulo: 'Consultas normativas al instante',
    desc: 'Pregunta por la Ley 1952, el Decreto 262 o la Resolución 076 y cita la norma exacta.',
  },
  {
    icon: '📊',
    titulo: 'Tu progreso a un mensaje',
    desc: 'Pulsa "Mi progreso" y ves tu Índice de Preparación al instante.',
  },
];

export default function TarjetaConectarTelegram() {
  return (
    <section
      className="animate-fade-in-up"
      style={{
        marginTop: '2rem',
        padding: '1.75rem',
        background:
          'linear-gradient(135deg, var(--color-bg-white) 0%, #f5f3ff 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        animationDelay: '0.25s',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Columna izquierda: pitch + CTA */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3125rem 0.75rem',
              backgroundColor: 'var(--color-ia-light)',
              color: 'var(--color-ia)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.875rem',
            }}
          >
            <span aria-hidden="true">📱</span>
            <span>Recomendado · Asesor MéritoPro</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              marginBottom: '0.5rem',
            }}
          >
            Conecta tu Telegram y estudia sin sentarte.
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
              maxWidth: '420px',
            }}
          >
            El Asesor te envía una pregunta calibrada cada mañana, evalúa tu
            respuesta al instante y resuelve dudas normativas con cita exacta —
            todo desde el chat que ya usas.
          </p>
          <Link
            href="/dashboard/perfil#telegram"
            className="btn btn-primary"
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            Conectar Telegram →
          </Link>
          <p
            style={{
              marginTop: '0.625rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Toma menos de 30 segundos · Vinculación con un solo enlace
          </p>
        </div>

        {/* Columna derecha: lista de ventajas */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {VENTAJAS.map((v) => (
            <li
              key={v.titulo}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: 1.4,
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-ia-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {v.icon}
              </span>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    marginBottom: '0.125rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {v.titulo}
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {v.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
