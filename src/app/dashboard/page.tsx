'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Demo data — in production, fetched from Supabase via DiagnosticoUsuario
const DEMO_USER = {
  nombre: 'Carlos',
  probabilidad: 42,
  racha_dias: 3,
  preguntas_hoy: 15,
  preguntas_pendientes: 12,
  modulo_mas_debil: 'Derecho Disciplinario',
  ultima_sesion: 'Hace 1 día',
};

const MODULOS_PROGRESO = [
  { nombre: 'Normas del Servicio Público', dominio: 68, tendencia: 'mejorando' as const },
  { nombre: 'Derecho Disciplinario', dominio: 35, tendencia: 'decayendo' as const },
  { nombre: 'Aptitud Verbal', dominio: 72, tendencia: 'estable' as const },
  { nombre: 'Gestión Documental', dominio: 55, tendencia: 'mejorando' as const },
  { nombre: 'Ofimática', dominio: 81, tendencia: 'estable' as const },
];

function getDominioColor(dominio: number): string {
  if (dominio >= 70) return 'var(--color-dominio-alto)';
  if (dominio >= 50) return 'var(--color-dominio-medio)';
  return 'var(--color-dominio-brecha)';
}

function getTendenciaIcon(tendencia: 'mejorando' | 'estable' | 'decayendo'): string {
  if (tendencia === 'mejorando') return '📈';
  if (tendencia === 'estable') return '➡️';
  return '📉';
}

export default function DashboardPage() {
  const [animatedProb, setAnimatedProb] = useState(0);

  // Animate probability counter on mount
  useEffect(() => {
    const target = DEMO_USER.probabilidad;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedProb(target);
        clearInterval(timer);
      } else {
        setAnimatedProb(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  const probabilidadColor =
    DEMO_USER.probabilidad >= 65
      ? 'var(--color-dominio-alto)'
      : DEMO_USER.probabilidad >= 50
        ? 'var(--color-dominio-medio)'
        : 'var(--color-dominio-brecha)';

  // SVG circle params for probability gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProb / 100) * circumference;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* ============ GREETING ============ */}
      <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Hola, {DEMO_USER.nombre} 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Tu última sesión fue {DEMO_USER.ultima_sesion}. Tienes{' '}
          <strong style={{ color: 'var(--color-ia)' }}>{DEMO_USER.preguntas_pendientes} preguntas</strong>{' '}
          pendientes de repaso hoy.
        </p>
      </div>

      {/* ============ TOP ROW: PROBABILITY + TRAIN BUTTON ============ */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
          animationDelay: '0.1s',
        }}
      >
        {/* Probability Gauge Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1.25rem',
            }}
          >
            Probabilidad de Aprobar
          </p>

          {/* SVG Circular Gauge */}
          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '1rem' }}>
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={probabilidadColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            {/* Percentage text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  color: probabilidadColor,
                  lineHeight: 1,
                }}
              >
                {animatedProb}%
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Meta: 65%
              </span>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              maxWidth: '240px',
            }}
          >
            {DEMO_USER.probabilidad < 65
              ? `Te faltan ${65 - DEMO_USER.probabilidad} puntos para el mínimo aprobatorio`
              : '¡Vas bien! Sigue reforzando tus módulos débiles'}
          </p>
        </div>

        {/* Train Today Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            border: 'none',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧠</div>
          <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>
            Misión de Hoy
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem',
              maxWidth: '280px',
            }}
          >
            {DEMO_USER.preguntas_pendientes} preguntas de repaso + 5 nuevas.
            Tiempo estimado: 30–45 min.
          </p>

          <Link href="/dashboard/entrenar" className="btn btn-primary btn-xl" style={{ width: '100%', maxWidth: '280px' }}>
            Entrenar Hoy →
          </Link>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-cta)' }}>
                {DEMO_USER.racha_dias}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Días racha</p>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-cta)' }}>
                {DEMO_USER.preguntas_hoy}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sesión hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODULES PROGRESS ============ */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem' }}>Progreso por Módulo</h2>
          <Link
            href="/dashboard/diagnostico"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-ia)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Ver detalle →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {MODULOS_PROGRESO.map((modulo) => (
            <div
              key={modulo.nombre}
              className="card"
              style={{ padding: '1rem 1.25rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.625rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>{getTendenciaIcon(modulo.tendencia)}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{modulo.nombre}</span>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: getDominioColor(modulo.dominio),
                  }}
                >
                  {modulo.dominio}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${modulo.dominio}%`,
                    background: getDominioColor(modulo.dominio),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ WEAK AREA ALERT ============ */}
      <div
        className="animate-fade-in-up"
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          animationDelay: '0.3s',
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
            Área de riesgo: {DEMO_USER.modulo_mas_debil}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Tu dominio está por debajo del 50%. El sistema priorizará preguntas de este módulo en tu próxima sesión de entrenamiento.
          </p>
        </div>
      </div>
    </div>
  );
}
