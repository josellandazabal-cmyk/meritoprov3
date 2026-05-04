'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { crearLead, type LeadFormState } from './actions';
import FAQ from '@/components/marketing/FAQ';
import CookieBanner from '@/components/marketing/CookieBanner';
import BannerUrgenciaInscripciones from '@/components/marketing/BannerUrgenciaInscripciones';

// Lista oficial de cargos de carrera administrativa convocados, según
// Resolución 076 de 2026 + Resolución 108 del 23 ABR 2026 (correctiva).
// Excluye cargos de libre nombramiento y remoción (no son del concurso).
// Fuente: COMPILADO DE CONVOCATORIAS VR03_28042026.pdf
const CARGOS_PGN = [
  { grupo: 'Asesor', cargos: ['Asesor', 'Jefe de División'] },
  { grupo: 'Profesional', cargos: ['Procurador Judicial II', 'Procurador Judicial I', 'Profesional Universitario', 'Coordinador Administrativo'] },
  { grupo: 'Técnico', cargos: ['Técnico Investigador', 'Sustanciador', 'Técnico Administrativo'] },
  { grupo: 'Administrativo', cargos: ['Secretario Ejecutivo', 'Secretario', 'Auxiliar Administrativo', 'Oficinista'] },
  { grupo: 'Operativo', cargos: ['Conductor', 'Citador', 'Auxiliar de Servicios Generales', 'Auxiliar de Mantenimiento'] },
];

const STATS = [
  { valor: '2.824', etiqueta: 'Vacantes disponibles' },
  { valor: '40', etiqueta: 'Preguntas diagnóstico' },
  { valor: '30 min', etiqueta: 'Tiempo estimado' },
  { valor: 'Gratis', etiqueta: 'Sin compromiso' },
];

const METODOLOGIA = [
  {
    icon: '🧠',
    titulo: 'Pensar, no subrayar',
    desc: 'Resuelves casos como los que caen en la prueba. Subrayar el código se le olvida en una semana. Pensarlo se queda fijo — la diferencia entre un litigante y un memorista.',
  },
  {
    icon: '🔄',
    titulo: 'Curva del olvido controlada',
    desc: 'El cerebro pierde el 90% de lo estudiado en 7 días. Por eso quien estudia "el día anterior" se quema en la prueba. Aquí repasas lo que estás a punto de olvidar — justo antes.',
  },
  {
    icon: '🎯',
    titulo: 'Calibrado a tu cargo real',
    desc: 'Si vas por Procurador Judicial, practicas casos de intervención judicial. Si vas por Profesional Universitario, los tuyos. Cada cargo tiene su Manual de Funciones — nosotros lo conocemos.',
  },
  {
    icon: '📊',
    titulo: 'Tu Índice de Preparación',
    desc: 'Cada día ves tu porcentaje moverse. Sin medallitas ni rachas vacías — el dato real de cuánto has avanzado y cuánto te falta para el 65% eliminatorio.',
  },
];

export default function LandingPage() {
  const initialState: LeadFormState = {};
  const [state, formAction, isPending] = useActionState(crearLead, initialState);

  return (
    <>
      {/* ============ HERO + FORMULARIO ============ */}
      <section
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0',
          background: 'linear-gradient(180deg, #ffffff 0%, var(--color-bg-primary) 100%)',
        }}
      >
        <div className="container-wide">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            {/* Hero Text */}
            <div className="animate-fade-in-up">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.875rem',
                  backgroundColor: 'var(--color-ia-light)',
                  color: 'var(--color-ia)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                }}
              >
                🏛️ Concurso PGN 2026 · 2.824 vacantes · salarios hasta $41M
              </div>

              <h1 style={{ marginBottom: '1.25rem', maxWidth: '600px' }}>
                Conoces la Ley 1952 y la 909.{' '}
                <span className="text-gradient">
                  Falta saber si te las sabes como caen en el examen.
                </span>
              </h1>

              {/* Banner de urgencia con countdown dinámico a inscripciones */}
              <div style={{ marginBottom: '1.5rem' }}>
                <BannerUrgenciaInscripciones variante="hero" />
              </div>

              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '2rem',
                  maxWidth: '520px',
                  lineHeight: 1.7,
                }}
              >
                40 preguntas con la{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  estructura oficial
                </strong>{' '}
                de la convocatoria — Tipo I, II, III y comportamentales del
                Decreto 815. En 30 minutos sabes cuántos puntos te faltan
                para el 65% eliminatorio.{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  Sin tarjeta, sin formularios eternos.
                </strong>
              </p>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  maxWidth: '480px',
                }}
              >
                {STATS.map((s) => (
                  <div key={s.etiqueta} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ia)' }}>
                      {s.valor}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {s.etiqueta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario Lead Gen */}
            <div
              id="diagnostico"
              className="card animate-fade-in-up"
              style={{
                padding: '2rem',
                animationDelay: '0.15s',
                maxWidth: '480px',
                justifySelf: 'end',
                width: '100%',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>
                  Empieza por saber dónde estás
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                  30 minutos. 40 preguntas oficiales. Tu Índice de Preparación
                  por escrito.
                </p>
              </div>

              {state.errors?._form && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-dominio-brecha)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  {state.errors._form[0]}
                </div>
              )}

              <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="nombre" className="form-label">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="form-input"
                    placeholder="Ej: María García López"
                    required
                  />
                  {state.errors?.nombre && (
                    <span className="form-error">{state.errors.nombre[0]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="maria@ejemplo.com"
                    required
                  />
                  {state.errors?.email && (
                    <span className="form-error">{state.errors.email[0]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="celular" className="form-label">
                    Celular
                  </label>
                  <input
                    id="celular"
                    name="celular"
                    type="tel"
                    className="form-input"
                    placeholder="300 123 4567"
                    required
                  />
                  {state.errors?.celular && (
                    <span className="form-error">{state.errors.celular[0]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="cargo_aspira" className="form-label">
                    Cargo al que aspiras
                  </label>
                  <select
                    id="cargo_aspira"
                    name="cargo_aspira"
                    className="form-input"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona un cargo
                    </option>
                    {CARGOS_PGN.map((grupo) => (
                      <optgroup key={grupo.grupo} label={grupo.grupo}>
                        {grupo.cargos.map((cargo) => (
                          <option key={cargo} value={cargo}>
                            {cargo}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {state.errors?.cargo_aspira && (
                    <span className="form-error">{state.errors.cargo_aspira[0]}</span>
                  )}
                </div>

                {/* Checkbox de consentimiento — Ley 1581/2012 */}
                <div className="form-group">
                  <label
                    htmlFor="acepta_datos"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      id="acepta_datos"
                      name="acepta_datos"
                      type="checkbox"
                      required
                      style={{
                        marginTop: '0.125rem',
                        width: '16px',
                        height: '16px',
                        flexShrink: 0,
                        accentColor: 'var(--color-ia)',
                      }}
                    />
                    <span>
                      Autorizo el{' '}
                      <Link href="/legal/privacidad" target="_blank" style={{ color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' }}>
                        tratamiento de mis datos personales
                      </Link>{' '}
                      conforme a la Ley 1581 de 2012 y acepto los{' '}
                      <Link href="/legal/terminos" target="_blank" style={{ color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' }}>
                        Términos y Condiciones
                      </Link>.
                    </span>
                  </label>
                  {state.errors?.acepta_datos && (
                    <span className="form-error">{state.errors.acepta_datos[0]}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isPending}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  {isPending ? (
                    <>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid currentColor',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          display: 'inline-block',
                        }}
                      />
                      Procesando...
                    </>
                  ) : (
                    'Iniciar Diagnóstico Gratuito →'
                  )}
                </button>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Sin tarjeta · 40 preguntas oficiales · Resultados al instante
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============ METODOLOGÍA ============ */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>
              No estudias más.{' '}
              <span className="text-gradient">Estudias mejor.</span>
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '620px',
                margin: '0 auto',
                fontSize: '1.0625rem',
                lineHeight: 1.65,
              }}
            >
              Llevas años aplicando normativa o trabajando en lo público — la
              teoría no es el problema. El problema es entrenarla como cae en
              el examen y mantenerla viva los meses que faltan hasta la prueba.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {METODOLOGIA.map((item, i) => (
              <div
                key={item.titulo}
                className="card animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  {item.titulo}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <FAQ />

      {/* ============ CTA FINAL ============ */}
      <section
        style={{
          padding: '4rem 0',
          background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #1e293b 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div className="container-narrow">
          <h2 style={{ marginBottom: '1rem', color: 'white' }}>
            El concurso se gana en los meses anteriores,{' '}
            <span style={{ color: 'var(--color-cta)' }}>no el día del examen.</span>
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '1.0625rem',
              marginBottom: '2rem',
              maxWidth: '560px',
              margin: '0 auto 2rem',
              lineHeight: 1.65,
            }}
          >
            2.824 vacantes definitivas. Inscripciones del 1 al 12 de junio de 2026.
            Si vienes de provisionalidad o de litigar privado, pasarte a carrera
            con un cargo profesional ($7M-$10M de base) o asesor ($16M-$21M)
            cambia tu vida fija. Pero la lista de elegibles se hace con los que
            llegaron preparados — no con los que llegaron a probar suerte.
          </p>
          <a href="#diagnostico" className="btn btn-primary btn-xl">
            Mide tu nivel real ahora →
          </a>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              marginTop: '1rem',
              opacity: 0.75,
            }}
          >
            40 preguntas oficiales · 30 minutos · Sin tarjeta · Resultados al instante
          </p>
        </div>
      </section>

      {/* Banner de cookies — primer ingreso */}
      <CookieBanner />
    </>
  );
}
