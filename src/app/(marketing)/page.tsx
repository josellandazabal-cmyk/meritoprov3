'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { crearLead, type LeadFormState } from './actions';
import FAQ from '@/components/marketing/FAQ';
import CookieBanner from '@/components/marketing/CookieBanner';
import BannerUrgenciaInscripciones from '@/components/marketing/BannerUrgenciaInscripciones';
import SocialProof from '@/components/marketing/SocialProof';

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
    desc: 'Cada día observas tu porcentaje desplazarse. Sin medallas ni indicadores cosméticos: el dato exacto de tu avance y de la brecha hacia el 65% eliminatorio.',
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

              <h1 style={{ marginBottom: '1.25rem', maxWidth: '620px' }}>
                Dominas la normativa.{' '}
                <span className="text-gradient">
                  La pregunta es si tu preparación está a la altura del concurso.
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
                  maxWidth: '540px',
                  lineHeight: 1.7,
                }}
              >
                Diagnóstico institucional de 40 ítems calibrados con la{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  estructura oficial de la convocatoria
                </strong>{' '}
                — Tipo I, II, III y comportamentales del Decreto 815 de 2018.
                En 30 minutos obtienes tu Índice de Preparación con la brecha
                exacta hacia el 65% eliminatorio.{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  Acceso inmediato. Sin tarjeta. Sin trámites.
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

      {/* ============ SOCIAL PROOF (cifras reales + perfiles tipo) ============ */}
      <SocialProof />

      {/* ============ FAQ ============ */}
      <FAQ />

      {/* ============ SEO CONTENT — Información oficial del concurso ============ */}
      {/* Bloque de contenido orgánico para indexación de long-tail.
          Útil para usuarios que buscan datos específicos del concurso PGN. */}
      <section
        style={{
          padding: '3rem 0',
          backgroundColor: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="container-narrow" style={{ maxWidth: '780px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
            Información oficial del concurso PGN 2026
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                ¿Qué es el concurso de méritos PGN 2026?
              </h3>
              <p>
                Es el proceso de selección abierto convocado por la{' '}
                <strong>Procuraduría General de la Nación</strong> mediante la{' '}
                <strong>Resolución 076 del 24 de marzo de 2026</strong>, modificada por la{' '}
                <strong>Resolución 108 del 23 de abril de 2026</strong>. Ofrece <strong>2.824 vacantes definitivas</strong> distribuidas en 291 convocatorias, agrupadas por nivel jerárquico (asesor, profesional, técnico, administrativo y operativo). El concurso es operado por la <strong>Universidad de Antioquia</strong>.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Fechas críticas y cronograma
              </h3>
              <p>
                Las <strong>inscripciones al concurso PGN</strong> se realizan del{' '}
                <strong>1 al 12 de junio de 2026</strong> en el portal habilitado por la
                Universidad de Antioquia. La PGN no concede prórroga después de las
                16:00 hora Colombia del último día. Tras el cierre se publican las fechas
                de aplicación de pruebas, consolidación de listas de elegibles y posesión.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Pruebas y ponderación
              </h3>
              <p>
                <strong>Nivel profesional, asesor y ejecutivo:</strong> conocimientos
                70% (eliminatoria, mínimo 65%), comportamentales 20%, antecedentes 10%.{' '}
                <strong>Nivel técnico, administrativo y operativo:</strong> conocimientos
                60% (eliminatoria, mínimo 65%), comportamentales 20%, antecedentes 20%.
                La prueba de conocimientos evalúa cuatro tipos de pregunta: Tipo I
                (selección múltiple única), Tipo II (afirmaciones combinadas), Tipo III
                (afirmación-razón) y comportamentales tipo Likert basadas en el{' '}
                <strong>Decreto 815 de 2018</strong>.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Normativa que se evalúa
              </h3>
              <p>
                Los temarios giran en torno a la{' '}
                <strong>Constitución Política de Colombia</strong>, la{' '}
                <strong>Ley 1952 de 2019</strong> (Código General Disciplinario), el{' '}
                <strong>Decreto Ley 262 de 2000</strong> (estructura y funciones de la
                PGN), la <strong>Ley 909 de 2004</strong> (carrera administrativa), la{' '}
                <strong>Ley 1437 de 2011</strong> (CPACA), la{' '}
                <strong>Ley 80 de 1993</strong> (contratación estatal), la{' '}
                <strong>Ley 1712 de 2014</strong> (transparencia), el{' '}
                <strong>Decreto 2591 de 1991</strong> (acción de tutela), la{' '}
                <strong>Ley 594 de 2000</strong> (gestión documental), y el{' '}
                <strong>Código de Integridad</strong> del servicio público colombiano.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Cargos convocados (no exhaustivo)
              </h3>
              <p>
                Procurador Judicial I, Procurador Judicial II, Profesional Universitario,
                Coordinador Administrativo, Asesor, Jefe de División, Técnico Investigador,
                Sustanciador, Técnico Administrativo, Secretario Ejecutivo, Auxiliar
                Administrativo, Oficinista, Conductor, Citador, Auxiliar de Servicios
                Generales, entre otros. Los salarios se rigen por el Decreto 313 de 2026
                con incremento del 7% retroactivo a enero, y oscilan entre $2 millones
                (operativo) y $41 millones (Procurador Delegado).
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.0625rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Fuentes oficiales
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <li>
                  <a href="https://www.procuraduria.gov.co" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ia)' }}>
                    Procuraduría General de la Nación
                  </a>{' '}— sitio oficial.
                </li>
                <li>
                  <a href="https://www.cnsc.gov.co" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ia)' }}>
                    Comisión Nacional del Servicio Civil (CNSC)
                  </a>{' '}— marco general de concursos públicos.
                </li>
                <li>
                  <a href="http://www.secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ia)' }}>
                    Ley 1952 de 2019 — Código General Disciplinario
                  </a>
                </li>
                <li>
                  <a href="http://www.secretariasenado.gov.co/senado/basedoc/decreto_0262_2000.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ia)' }}>
                    Decreto Ley 262 de 2000 — Estructura PGN
                  </a>
                </li>
                <li>
                  <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=86304" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ia)' }}>
                    Decreto 815 de 2018 — Competencias comportamentales
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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
