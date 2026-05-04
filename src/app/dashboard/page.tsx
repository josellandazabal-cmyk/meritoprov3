'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  obtenerDashboardStats,
  type DashboardStats,
  type ModuloProgreso,
} from './actions';
import RespuestasRapidasSwipe from '@/components/dashboard/RespuestasRapidasSwipe';
import RecomendacionesRefuerzo from '@/components/dashboard/RecomendacionesRefuerzo';
import GuiaInscripcion from '@/components/dashboard/GuiaInscripcion';
import { consultarPerfilCompleto } from '@/app/dashboard/completar-perfil/actions';

// Estado inicial mientras carga el server action — todo en cero, saludo
// neutro. Los DEMO_USER hardcodeados quedaron eliminados.
const STATS_INICIAL: DashboardStats = {
  nombre: 'aspirante',
  probabilidad: 0,
  diagnostico_inicial: 0,
  porcentaje_actual: 0,
  delta_progreso: 0,
  tiene_diagnostico: false,
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
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);

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
    void consultarPerfilCompleto()
      .then((r) => {
        if (!cancelado) setPerfilCompleto(r.completo);
      })
      .catch(() => {
        if (!cancelado) setPerfilCompleto(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // El gauge muestra "Hoy" (dinámico) como número grande para motivar el
  // avance. La animación arranca DESDE el % inicial (línea base fija) y
  // crece hasta el % actual — el usuario ve literalmente el progreso
  // moverse desde su punto de partida.
  useEffect(() => {
    const inicio = stats.diagnostico_inicial;
    const target = stats.porcentaje_actual;

    if (!stats.tiene_diagnostico) {
      queueMicrotask(() => setAnimatedProb(0));
      return;
    }
    if (target === inicio) {
      queueMicrotask(() => setAnimatedProb(target));
      return;
    }

    const duration = 1800;
    const steps = 70;
    const incremento = (target - inicio) / steps;
    let current = inicio;
    queueMicrotask(() => setAnimatedProb(inicio));
    const timer = setInterval(() => {
      current += incremento;
      const reachedTarget =
        (incremento >= 0 && current >= target) ||
        (incremento < 0 && current <= target);
      if (reachedTarget) {
        setAnimatedProb(target);
        clearInterval(timer);
      } else {
        setAnimatedProb(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [stats.diagnostico_inicial, stats.porcentaje_actual, stats.tiene_diagnostico]);

  const probabilidadColor =
    stats.porcentaje_actual >= 65
      ? 'var(--color-dominio-alto)'
      : stats.porcentaje_actual >= 50
        ? 'var(--color-dominio-medio)'
        : 'var(--color-dominio-brecha)';

  // Arcos del gauge: dos capas concéntricas
  // - Capa 1 (faint): muestra el inicial como referencia fija (gris claro).
  // - Capa 2 (bright): muestra el % animado actual con el color de dominio.
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetActual =
    circumference - (animatedProb / 100) * circumference;
  const strokeDashoffsetInicial =
    circumference - (stats.diagnostico_inicial / 100) * circumference;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* ============ BANNER COMPLETAR PERFIL (si falta) ============ */}
      {perfilCompleto === false && (
        <div
          className="animate-fade-in-up"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>👤</span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#78350f', marginBottom: '0.125rem' }}>
              Completa tu perfil para personalizar tu preparación
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#854d0e', lineHeight: 1.4 }}>
              Sin tu cargo objetivo y nivel jerárquico, las preguntas y el Tutor IA serán genéricos.
            </p>
          </div>
          <Link
            href="/dashboard/completar-perfil"
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            Completar perfil →
          </Link>
        </div>
      )}

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
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            {stats.tiene_diagnostico ? 'Tu progreso actual' : 'Probabilidad de Aprobar'}
          </p>
          {stats.tiene_diagnostico && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginBottom: '1rem',
              }}
            >
              {stats.delta_progreso > 0
                ? `Avanzaste ${stats.delta_progreso} pp desde tu diagnóstico`
                : stats.delta_progreso === 0
                  ? 'Aún en tu línea base — entrena para avanzar'
                  : 'Repasa los módulos débiles para recuperar terreno'}
            </p>
          )}

          {/* ===========================================================
              SVG Circular Gauge — DOBLE ARCO con animación de progreso.

              · Arco fondo: gris claro (riel completo).
              · Arco "inicial" (faint): muestra dónde estaba la línea base
                con un trazo punteado y color tenue. Sirve de referencia
                visual fija para que el usuario vea su punto de partida.
              · Arco "actual" (bright): se anima desde inicial → actual,
                en color de dominio. La transición de stroke-dashoffset
                hace que el usuario VEA literalmente el avance.
              =========================================================== */}
          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '1rem' }}>
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Riel de fondo */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="12"
              />
              {/* Arco INICIAL (línea base, fija) — solo si tiene diagnóstico */}
              {stats.tiene_diagnostico && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--color-dominio-brecha)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`6 4`}
                  strokeDashoffset={strokeDashoffsetInicial}
                  opacity={0.35}
                  style={{
                    strokeDasharray: `${circumference - strokeDashoffsetInicial} ${circumference}`,
                  }}
                />
              )}
              {/* Arco ACTUAL (animado) */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={probabilidadColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetActual}
                style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            {/* Texto central — % HOY (grande) */}
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
                  transition: 'color 0.4s ease',
                }}
              >
                {animatedProb}%
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Hoy · Meta 65%
              </span>
            </div>
          </div>

          {/* PUNTO DE PARTIDA (referencia secundaria, abajo) */}
          {stats.tiene_diagnostico ? (
            <div
              style={{
                width: '100%',
                maxWidth: '260px',
                padding: '0.5rem 0.875rem',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                marginBottom: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-dominio-brecha)',
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Punto de partida:
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {stats.diagnostico_inicial}%
                </span>
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  color:
                    stats.delta_progreso > 0
                      ? 'var(--color-dominio-alto)'
                      : stats.delta_progreso < 0
                        ? 'var(--color-dominio-brecha)'
                        : 'var(--color-text-muted)',
                }}
              >
                {stats.delta_progreso > 0
                  ? `↑ +${stats.delta_progreso} pp`
                  : stats.delta_progreso < 0
                    ? `↓ ${stats.delta_progreso} pp`
                    : '— sin cambio'}
              </span>
            </div>
          ) : null}

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              maxWidth: '260px',
            }}
          >
            {!stats.tiene_diagnostico
              ? 'Haz tu diagnóstico inicial para conocer tu nivel real'
              : stats.porcentaje_actual < 65
                ? `Te faltan ${65 - stats.porcentaje_actual} pp para el mínimo aprobatorio`
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
      {/* Sección visible solo si HAY datos SM-2 reales (entrenamiento ya
          arrancado). Sin datos es ruido visual: el comparativo por módulo
          ya vive en /dashboard/diagnostico, así que cuando aún no hay
          datos SM-2 mostramos un CTA único que dirige allá o invita
          a entrenar (según corresponda). */}
      {stats.modulos.length === 0 && stats.tiene_diagnostico ? (
        <div
          className="card animate-fade-in-up"
          style={{
            animationDelay: '0.2s',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
              Tu diagnóstico está listo
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Ve el desglose por módulo, módulos débiles y plan de refuerzo.
              Empieza a entrenar para que aparezca tu progreso SM-2 aquí.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/dashboard/diagnostico" className="btn btn-primary" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              Ver mi diagnóstico →
            </Link>
            <Link href="/dashboard/entrenar" className="btn btn-secondary" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Entrenar
            </Link>
          </div>
        </div>
      ) : null}

      {stats.modulos.length > 0 && (
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
      )}

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

      {/* ============ RECOMENDACIONES DE REFUERZO ============ */}
      <RecomendacionesRefuerzo moduloDebil={stats.modulo_mas_debil} />

      {/* ============ GUÍA DE INSCRIPCIÓN AL CONCURSO ============ */}
      <GuiaInscripcion />
    </div>
  );
}
