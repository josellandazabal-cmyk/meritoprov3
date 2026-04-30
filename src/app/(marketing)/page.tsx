'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { crearLead, type LeadFormState } from './actions';
import FAQ from '@/components/marketing/FAQ';
import CookieBanner from '@/components/marketing/CookieBanner';

// Cargos PGN agrupados para el select
const CARGOS_PGN = [
  { grupo: 'Directivo', cargos: ['Procurador Delegado', 'Procurador Auxiliar', 'Director', 'Procurador Regional', 'Procurador Distrital', 'Procurador Provincial'] },
  { grupo: 'Asesor', cargos: ['Jefe de Oficina', 'Asesor'] },
  { grupo: 'Profesional', cargos: ['Procurador Judicial II', 'Procurador Judicial I', 'Profesional Universitario', 'Coordinador Administrativo'] },
  { grupo: 'Técnico', cargos: ['Técnico Investigador', 'Técnico en Criminalística', 'Sustanciador', 'Técnico Administrativo'] },
  { grupo: 'Administrativo', cargos: ['Secretario Ejecutivo', 'Auxiliar Administrativo', 'Oficinista', 'Cajero'] },
  { grupo: 'Operativo', cargos: ['Conductor', 'Citador', 'Auxiliar de Servicios Generales'] },
];

const STATS = [
  { valor: '2.826', etiqueta: 'Vacantes disponibles' },
  { valor: '40', etiqueta: 'Preguntas diagnóstico' },
  { valor: '30 min', etiqueta: 'Tiempo estimado' },
  { valor: 'Gratis', etiqueta: 'Sin compromiso' },
];

const METODOLOGIA = [
  {
    icon: '🧠',
    titulo: 'Recuperación Activa',
    desc: 'Resuelves problemas reales, no lees PDFs. La teoría aparece solo cuando la necesitas.',
  },
  {
    icon: '🔄',
    titulo: 'Repetición Espaciada',
    desc: 'El sistema decide qué repasar basado en tu curva del olvido personal (SM-2).',
  },
  {
    icon: '🎯',
    titulo: 'Metodología Oficial',
    desc: 'Preguntas Tipo I, II, III y Likert — exactamente como en el examen real de la PGN.',
  },
  {
    icon: '📊',
    titulo: 'Probabilidad de Aprobar',
    desc: 'No puntos abstractos. Te decimos tu porcentaje real de aprobar el concurso.',
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
                🏛️ Concurso PGN 2026 — 2.826 vacantes
              </div>

              <h1 style={{ marginBottom: '1.25rem', maxWidth: '560px' }}>
                ¿Cuánta probabilidad tienes de{' '}
                <span className="text-gradient">aprobar el concurso?</span>
              </h1>

              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '2rem',
                  maxWidth: '500px',
                  lineHeight: 1.7,
                }}
              >
                Diagnóstico gratuito de 40 preguntas con la{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>metodología oficial</strong> del examen.
                Descubre tus fortalezas y debilidades antes de invertir un solo peso.
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
                  Diagnóstico Gratuito
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                  Descubre tu nivel real en 30 minutos
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
                  Sin costo · 40 preguntas · Resultados inmediatos
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
              Metodología basada en{' '}
              <span className="text-gradient">Neurociencia Cognitiva</span>
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '560px',
                margin: '0 auto',
                fontSize: '1.0625rem',
              }}
            >
              No estudiamos más. Estudiamos mejor. Cada minuto cuenta cuando tu carrera está en juego.
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
            Tu primer salario en la PGN recupera la inversión
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '1.0625rem',
              marginBottom: '2rem',
              maxWidth: '480px',
              margin: '0 auto 2rem',
            }}
          >
            Con más de 2.826 vacantes, esta es la oportunidad de tu carrera.
            Pero primero, necesitas saber dónde estás parado.
          </p>
          <a href="#diagnostico" className="btn btn-primary btn-xl">
            Tomar Diagnóstico Gratuito →
          </a>
        </div>
      </section>

      {/* Banner de cookies — primer ingreso */}
      <CookieBanner />
    </>
  );
}
