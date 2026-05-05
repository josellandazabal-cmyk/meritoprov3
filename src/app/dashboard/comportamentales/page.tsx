// ============================================================
// /dashboard/comportamentales — Simulacro de pruebas comportamentales
//
// La prueba comportamental NO se basa en normas memorizables sino en
// aptitudes evaluadas según el Decreto 815/2018 + Código de Integridad.
// Esta página explica al aspirante qué se evalúa, qué espera la PGN
// como conducta del servidor, y le permite iniciar un simulacro
// 100% comportamental (todas las preguntas tipo Likert situacional).
// ============================================================

import Link from 'next/link';

export const metadata = {
  title: 'Simulacro Comportamental · MéritoPro',
  description:
    'Practica las pruebas comportamentales del concurso PGN 2026. Decreto 815/2018 + Código de Integridad.',
};

const VALORES_INTEGRIDAD = [
  {
    nombre: 'Honestidad',
    descripcion:
      'Actúa con base en la verdad, cumple deberes con transparencia, favorece el interés general.',
    conducta:
      'Al detectar una irregularidad, la reportas al canal correspondiente — incluso si involucra a un superior.',
  },
  {
    nombre: 'Respeto',
    descripcion:
      'Reconoce y trata con dignidad a todas las personas sin distinción de origen, cargo o condición.',
    conducta:
      'Atiendes con amabilidad y equidad a un usuario alterado, sin reflejar su mismo tono.',
  },
  {
    nombre: 'Compromiso',
    descripcion:
      'Asume el rol de servidor público con conciencia del impacto institucional.',
    conducta:
      'Frente a una solicitud legítima fuera de tu horario, evalúas atenderla o canalizarla — no la postergas sin razón.',
  },
  {
    nombre: 'Diligencia',
    descripcion:
      'Cumple deberes con atención, prontitud y eficiencia, optimizando los recursos del Estado.',
    conducta:
      'Entregas a tiempo respetando estándares; si se demora, comunicas el motivo antes del plazo.',
  },
  {
    nombre: 'Justicia',
    descripcion:
      'Actúa con imparcialidad, equidad y sin discriminación, garantizando los derechos.',
    conducta:
      'Tomas decisiones con base en evidencias y reglas claras, no en preferencias personales.',
  },
];

const COMPETENCIAS_NIVEL = [
  {
    nivel: 'Nivel directivo / asesor',
    aplica: 'Procurador Delegado, Asesor, Jefe de División',
    competencias: [
      'Visión estratégica',
      'Liderazgo efectivo',
      'Toma de decisiones',
      'Gestión del desarrollo de las personas',
      'Resolución de conflictos',
    ],
  },
  {
    nivel: 'Nivel profesional',
    aplica: 'Procurador Judicial I/II, Profesional Universitario',
    competencias: [
      'Aporte técnico-profesional',
      'Comunicación efectiva',
      'Gestión de procedimientos',
      'Instrumentación de decisiones',
      'Experticia profesional',
    ],
  },
  {
    nivel: 'Nivel técnico',
    aplica: 'Técnico Investigador, Sustanciador, Técnico Administrativo',
    competencias: ['Confiabilidad técnica', 'Disciplina', 'Responsabilidad'],
  },
  {
    nivel: 'Nivel asistencial / administrativo',
    aplica: 'Secretario Ejecutivo, Auxiliar Administrativo, Oficinista',
    competencias: ['Manejo de la información', 'Relaciones interpersonales', 'Colaboración'],
  },
];

const COMUNES = [
  'Aprendizaje continuo',
  'Orientación a resultados',
  'Orientación al usuario y al ciudadano',
  'Compromiso con la organización',
  'Trabajo en equipo',
  'Adaptación al cambio',
];

export default function ComportamentalesPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
      {/* HERO */}
      <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          ← Volver al inicio
        </Link>
        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-ia)',
            marginBottom: '0.5rem',
          }}
        >
          Decreto 815 de 2018 · Código de Integridad
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>
          Simulacro de pruebas comportamentales
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.65,
            maxWidth: '640px',
          }}
        >
          La prueba comportamental no se memoriza. Se entiende. Aquí te
          explicamos qué evalúa la PGN según el Manual Específico de
          Funciones y qué conductas espera ver en sus servidores.
        </p>
      </div>

      {/* CARD DE ARRANQUE — antes de explicar, dar el botón visible */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          background:
            'linear-gradient(135deg, var(--color-bg-white) 0%, #f5f3ff 100%)',
          border: '1px solid var(--color-ia)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          animationDelay: '0.05s',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <p style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
            Iniciar simulacro 100% comportamental
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            10 preguntas tipo Likert situacional, calibradas a tu cargo. Tiempo
            estimado: 15-20 min.
          </p>
        </div>
        <Link
          href="/dashboard/entrenar?tipo=comportamental"
          className="btn btn-primary"
          style={{ fontSize: '0.9375rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          Empezar simulacro →
        </Link>
      </div>

      {/* INSTRUCTIVO — cómo la PGN evalúa */}
      <section
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          📘 Cómo se evalúa
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
            marginBottom: '1rem',
          }}
        >
          La prueba comportamental presenta <strong>situaciones laborales reales</strong> del
          servidor público (un usuario molesto, un compañero que incumple, un cambio normativo
          repentino). Para cada situación se te pide indicar, en escala Likert 1-5, qué tan
          frecuente o probable sería tu respuesta.
        </p>
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-ia-light)',
            borderLeft: '3px solid var(--color-ia)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            lineHeight: 1.55,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--color-ia)' }}>
            Regla central
          </p>
          La prueba <strong>no mide tu personalidad real</strong>. Mide si conoces el
          comportamiento esperado del servidor público según las normas. Responde según
          el Decreto 815/2018 y el Código de Integridad — no según tu instinto personal.
        </div>
      </section>

      {/* LOS 5 VALORES */}
      <section
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.15s' }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          ⚖️ Los 5 valores del Código de Integridad
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          Decreto 1499 de 2017 · Resolución 444 de 2022 PGN. Memoriza la regla nemotécnica:{' '}
          <strong>HRCDJ</strong> (Honestidad, Respeto, Compromiso, Diligencia, Justicia).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {VALORES_INTEGRIDAD.map((v) => (
            <div
              key={v.nombre}
              style={{
                padding: '1rem 1.125rem',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-ia)',
              }}
            >
              <p
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--color-ia)',
                  marginBottom: '0.25rem',
                }}
              >
                {v.nombre}
              </p>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                  marginBottom: '0.5rem',
                }}
              >
                {v.descripcion}
              </p>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  fontStyle: 'italic',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--color-bg-white)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <strong style={{ fontStyle: 'normal' }}>Conducta esperada:</strong>{' '}
                {v.conducta}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPETENCIAS POR NIVEL */}
      <section
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.2s' }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          🎯 Competencias según tu nivel jerárquico
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          Anexos I y II del Decreto 815/2018. Cada nivel evalúa competencias
          específicas. La prueba que recibes está calibrada según tu cargo.
        </p>

        <div
          style={{
            padding: '0.75rem 0.875rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            color: '#854d0e',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          <strong>📌 Comunes a TODOS los niveles:</strong> {COMUNES.join(' · ')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {COMPETENCIAS_NIVEL.map((c) => (
            <div
              key={c.nivel}
              style={{
                padding: '1rem 1.125rem',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  marginBottom: '0.125rem',
                }}
              >
                {c.nivel}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.625rem',
                }}
              >
                Aplica a: {c.aplica}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.375rem',
                }}
              >
                {c.competencias.map((comp) => (
                  <span
                    key={comp}
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 'var(--color-bg-white)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO RESPONDER — reglas */}
      <section
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '2rem', animationDelay: '0.25s' }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          🧭 Reglas para responder bien
        </h2>
        <ol
          style={{
            paddingLeft: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              Identifica la competencia evaluada antes de responder.
            </strong>{' '}
            El enunciado siempre apunta a UNA competencia específica.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              Si el enunciado describe la conducta deseable
            </strong>{' '}
            (alineada con los 5 valores) → responde 4 o 5. Si describe la indeseable → 1 o 2.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              Evita los extremos automáticos.
            </strong>{' '}
            "Nunca" (1) y "Siempre" (5) suelen reflejar conductas extremas; la PGN valora
            servidores equilibrados — la opción 4 suele ganar a la 5 en conductas deseables.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              Responde como debe ser, no como tú harías.
            </strong>{' '}
            La prueba mide conocimiento del comportamiento esperado, no introspección personal.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              No salgas del marco normativo.
            </strong>{' '}
            Toda respuesta debe poder defenderse citando el Decreto 815, el Código de
            Integridad o el Manual de Funciones del cargo.
          </li>
        </ol>
      </section>

      {/* CTA FINAL */}
      <div
        style={{
          textAlign: 'center',
          padding: '2rem 1rem',
        }}
      >
        <Link
          href="/dashboard/entrenar?tipo=comportamental"
          className="btn btn-primary btn-lg"
          style={{ fontSize: '0.9375rem', fontWeight: 700 }}
        >
          Empezar simulacro comportamental →
        </Link>
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          10 preguntas Likert · Calibradas a tu cargo · 15-20 min
        </p>
      </div>
    </div>
  );
}
