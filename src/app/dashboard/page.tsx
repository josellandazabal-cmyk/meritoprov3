'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  obtenerDashboardStats,
  type DashboardStats,
  type ModuloProgreso,
} from './actions';
import RespuestasRapidasSwipe from '@/components/dashboard/RespuestasRapidasSwipe';

// Estado inicial mientras carga el server action — todo en cero, saludo
// neutro. Los DEMO_USER hardcodeados quedaron eliminados.
const STATS_INICIAL: DashboardStats = {
  nombre: 'aspirante',
  probabilidad: 0,
  racha_dias: 0,
  preguntas_hoy: 0,
  preguntas_pendientes: 0,
  modulo_mas_debil: null,
  ultima_sesion_humano: 'Cargando...',
  modulos: [],
};

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
  const [stats, setStats] = useState<DashboardStats>(STATS_INICIAL);
  const [animatedProb, setAnimatedProb] = useState(0);

  // Cargamos stats reales del aspirante autenticado al montar.
  useEffect(() => {
    let cancelado = false;
    void obtenerDashboardStats()
      .then((data) => {
        if (!cancelado) setStats(data);
      })
      .catch((err) => {
        console.warn('[Dashboard] obtenerDashboardStats falló:', err);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Animar el contador de probabilidad cuando los stats cambian.
  // queueMicrotask difiere el setState síncrono inicial para cumplir
  // la regla react-hooks/set-state-in-effect.
  useEffect(() => {
    const target = stats.probabilidad;
    if (target === 0) {
      queueMicrotask(() => setAnimatedProb(0));
      return;
    }
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
  }, [stats.probabilidad]);

  const probabilidadColor =
    stats.probabilidad >= 65
      ? 'var(--color-dominio-alto)'
      : stats.probabilidad >= 50
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
          Hola, {stats.nombre} 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          {stats.ultima_sesion_humano === 'Nunca' ? (
            <>
              Bienvenido a MéritoPro. Empieza con el{' '}
              <Link href="/dashboard/diagnostico-inicial" style={{ color: 'var(--color-ia)', fontWeight: 600 }}>
                diagnóstico inicial
              </Link>{' '}
              para conocer tu nivel real.
            </>
          ) : stats.preguntas_pendientes === 0 ? (
            <>Tu última sesión fue {stats.ultima_sesion_humano}. Estás al día — ¡buen trabajo!</>
          ) : (
            <>
              Tu última sesión fue {stats.ultima_sesion_humano}. Tienes{' '}
              <strong style={{ color: 'var(--color-ia)' }}>{stats.preguntas_pendientes} preguntas</strong>{' '}
              pendientes de repaso hoy.
            </>
          )}
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
            {stats.probabilidad < 65
              ? `Te faltan ${65 - stats.probabilidad} puntos para el mínimo aprobatorio`
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
            {stats.preguntas_pendientes} preguntas de repaso + 5 nuevas.
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
                {stats.racha_dias}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Días racha</p>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-cta)' }}>
                {stats.preguntas_hoy}
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
          {stats.modulos.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '0.9375rem',
              }}
            >
              Aún no tienes datos por módulo. Empieza tu primera sesión de
              entrenamiento para ver tu progreso aquí.
            </div>
          ) : null}
          {stats.modulos.map((modulo: ModuloProgreso) => (
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

      {/* ============ RESPUESTAS RÁPIDAS A BRECHAS (carrusel swipe) ============ */}
      {/* Sólo aparece si el usuario tiene brechas SM-2 reales detectadas.
          No renderiza nada para usuarios al día o sin historial. */}
      <RespuestasRapidasSwipe />

      {/* ============ WEAK AREA ALERT ============ */}
      {/* Sólo mostramos la alerta si hay un módulo más débil identificado
          y su dominio está realmente por debajo del 50 %. Para usuarios
          nuevos sin historial SM-2 no aplica. */}
      {stats.modulo_mas_debil &&
        stats.modulos.find((m) => m.nombre === stats.modulo_mas_debil)?.dominio !== undefined &&
        (stats.modulos.find((m) => m.nombre === stats.modulo_mas_debil)?.dominio ?? 100) < 50 && (
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
                Área de riesgo: {stats.modulo_mas_debil}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Tu dominio está por debajo del 50%. El sistema priorizará preguntas de este módulo en tu próxima sesión de entrenamiento.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
