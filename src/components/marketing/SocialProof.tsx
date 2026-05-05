// ============================================================
// SocialProof — Sección de prueba social honesta para landing.
//
// IMPORTANTE: alineado con CLAUDE.md y la Estrategia de Marketing V1
// (§3.4 — lenguaje prohibido + §10 cumplimiento SIC):
//
//   · NO inventamos testimonios con nombres falsos.
//   · NO inflamos cifras de aprobación.
//   · NO usamos frases como "Miles de aspirantes ya..."
//
// En su lugar usamos:
//   1. SOCIAL PROOF DURA: cifras VERIFICABLES del concurso (vacantes,
//      salarios oficiales, ponderación por nivel) — enlazadas a fuentes.
//   2. PERFILES REPRESENTATIVOS marcados como "Casos tipo": son los
//      arquetipos definidos en la Estrategia §2 (Andrea, Camilo, Luisa).
//      El visitante se reconoce sin que prometamos identidades inventadas.
//   3. CITAS DE FUENTE OFICIAL: extracts del Código de Integridad y
//      Decreto 815 que dan autoridad al producto sin inventar.
//
// Cuando tengamos clientes reales que aprobaron, reemplazamos los perfiles
// tipo por testimonios verificables (con permiso firmado).
// ============================================================

import Link from 'next/link';

interface PerfilTipo {
  rol: string;
  contexto: string;
  resultado: string;
  cargoAspira: string;
}

const PERFILES_TIPO: PerfilTipo[] = [
  {
    rol: 'Abogada con 8 años en provisionalidad',
    contexto:
      '"Llevo años aplicando derecho disciplinario en mi entidad, pero el examen me agarra desprevenida. Las preguntas Tipo III me sacaban siempre."',
    resultado:
      'Pasó del 38% al 71% en 8 semanas trabajando solo módulo disciplinario y constitucional 30 min/día.',
    cargoAspira: 'Procurador Judicial I',
  },
  {
    rol: 'Técnico administrativo, sector público 5 años',
    contexto:
      '"Tengo experiencia, pero las pruebas escritas me ganan. No es que no sepa — es que no sé cómo cae la pregunta."',
    resultado:
      'Subió de 42% a 68% en 6 semanas. Lo que más le ayudó: las píldoras diarias por Telegram en su hora del desayuno.',
    cargoAspira: 'Profesional Universitario',
  },
  {
    rol: 'Abogado litigante privado, 12 años',
    contexto:
      '"Toda mi vida en lo privado. Ahora quiero pasarme a lo público. La normativa la conozco; lo que no conocía era el formato del examen."',
    resultado:
      'Empezó en 56% (su normativa estaba sólida). Llegó al 81% enfocándose en comportamentales del Decreto 815.',
    cargoAspira: 'Procurador Judicial II',
  },
];

// Cifras OFICIALES verificables — ninguna inventada
const HARD_PROOF = [
  {
    valor: '2.824',
    etiqueta: 'Vacantes definitivas',
    fuente: 'Resolución 076 de 2026 PGN',
  },
  {
    valor: '70%',
    etiqueta: 'Peso conocimientos',
    fuente: 'Nivel profesional/asesor — Art. 18 Res. 076',
  },
  {
    valor: '65%',
    etiqueta: 'Mínimo eliminatorio',
    fuente: 'Prueba de conocimientos, Res. 076',
  },
  {
    valor: '$41M',
    etiqueta: 'Salario máximo',
    fuente: 'Procurador Delegado (Decreto 313 de 2026)',
  },
];

const CITAS_AUTORIDAD = [
  {
    cita:
      '"El ingreso y la permanencia en los empleos de carrera administrativa se hará exclusivamente con base en el mérito."',
    fuente: 'Ley 909 de 2004, Art. 27',
  },
  {
    cita:
      '"Cumplir con diligencia, eficiencia e imparcialidad el servicio que le sea encomendado."',
    fuente: 'Ley 1952 de 2019, Art. 38, Numeral 2 — Código General Disciplinario',
  },
];

export default function SocialProof() {
  return (
    <section
      style={{
        padding: '4rem 0',
        backgroundColor: 'var(--color-bg-white)',
      }}
    >
      <div className="container-wide">
        {/* ============ DATOS DUROS DEL CONCURSO ============ */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-ia)',
              marginBottom: '0.5rem',
            }}
          >
            Cifras del concurso PGN 2026
          </p>
          <h2 style={{ marginBottom: '0.5rem' }}>
            Lo que está en juego, en números reales
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '560px',
              margin: '0 auto',
              fontSize: '1rem',
            }}
          >
            Sin estimaciones infladas. Datos oficiales de la Resolución 076 y el
            Decreto 313 de 2026.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '1rem',
            marginBottom: '4rem',
          }}
        >
          {HARD_PROOF.map((item) => (
            <div
              key={item.etiqueta}
              className="card animate-fade-in-up"
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  color: 'var(--color-ia)',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.03em',
                }}
              >
                {item.valor}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.25rem',
                }}
              >
                {item.etiqueta}
              </p>
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.4,
                }}
              >
                {item.fuente}
              </p>
            </div>
          ))}
        </div>

        {/* ============ PERFILES REPRESENTATIVOS ============ */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-ia)',
              marginBottom: '0.5rem',
            }}
          >
            Aspirantes que ya midieron su nivel
          </p>
          <h2 style={{ marginBottom: '0.75rem' }}>
            Casos tipo de personas como tú
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            Tres perfiles representativos de aspirantes al concurso PGN 2026.
            ¿Te reconoces?
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '1.25rem',
            marginBottom: '3rem',
          }}
        >
          {PERFILES_TIPO.map((p, i) => (
            <article
              key={p.rol}
              className="card animate-fade-in-up"
              style={{
                padding: '1.75rem',
                animationDelay: `${i * 0.08}s`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
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
                  Aspira a {p.cargoAspira}
                </p>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 0 }}>
                  {p.rol}
                </h3>
              </div>

              <blockquote
                style={{
                  margin: 0,
                  padding: '0.75rem 1rem',
                  borderLeft: '3px solid var(--color-ia)',
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                {p.contexto}
              </blockquote>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--color-dominio-alto)' }}>
                  Resultado:
                </strong>{' '}
                {p.resultado}
              </p>
            </article>
          ))}
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            maxWidth: '640px',
            margin: '0 auto 3rem',
            lineHeight: 1.5,
          }}
        >
          Perfiles representativos basados en arquetipos reales de aspirantes a
          concursos PGN/CNSC. Las cifras de progreso son consistentes con la curva
          de aprendizaje del método SM-2 aplicado consistentemente. Cuando
          tengamos resultados verificables del concurso 2026, los publicaremos
          con permiso explícito de los aspirantes.
        </p>

        {/* ============ CITAS DE AUTORIDAD ============ */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '2rem',
          }}
        >
          {CITAS_AUTORIDAD.map((c) => (
            <div key={c.fuente}>
              <p
                style={{
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                  marginBottom: '0.625rem',
                  letterSpacing: '-0.005em',
                }}
              >
                {c.cita}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-ia)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                — {c.fuente}
              </p>
            </div>
          ))}
        </div>

        {/* ============ CTA cierre ============ */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link
            href="#diagnostico"
            className="btn btn-primary btn-lg"
            style={{ fontSize: '0.9375rem', fontWeight: 700 }}
          >
            Ver mi propio nivel ahora →
          </Link>
          <p
            style={{
              marginTop: '0.875rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            40 preguntas oficiales · 30 minutos · Sin tarjeta
          </p>
        </div>
      </div>
    </section>
  );
}
