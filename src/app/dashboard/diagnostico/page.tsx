'use client';

import { useEffect, useState } from 'react';
import { obtenerDiagnosticoModulos, type ModuloDiagnostico } from './actions';

const MODULOS_INICIAL: ModuloDiagnostico[] = [
  {
    nombre: 'Normas del Servicio Público',
    dominio: 0,
    tendencia: 'estable' as const,
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Derecho Disciplinario',
    dominio: 0,
    tendencia: 'estable' as const,
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Aptitud Verbal',
    dominio: 0,
    tendencia: 'estable' as const,
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Gestión Documental',
    dominio: 0,
    tendencia: 'estable' as const,
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
  {
    nombre: 'Ofimática',
    dominio: 0,
    tendencia: 'estable' as const,
    tasa_acierto: 0,
    temas_debiles: [],
    temas_fuertes: [],
    rendimiento: { tipo_I: 0, tipo_II: 0, tipo_III: 0 },
  },
];

function getDominioColor(d: number) {
  if (d >= 70) return 'var(--color-dominio-alto)';
  if (d >= 50) return 'var(--color-dominio-medio)';
  return 'var(--color-dominio-brecha)';
}

function getTendencia(t: 'mejorando' | 'estable' | 'decayendo') {
  if (t === 'mejorando') return { icon: '📈', label: 'Mejorando', color: 'var(--color-dominio-alto)' };
  if (t === 'estable') return { icon: '➡️', label: 'Estable', color: 'var(--color-dominio-medio)' };
  return { icon: '📉', label: 'Decayendo', color: 'var(--color-dominio-brecha)' };
}

export default function DiagnosticoDashboardPage() {
  const [modulos, setModulos] = useState<ModuloDiagnostico[]>(MODULOS_INICIAL);

  useEffect(() => {
    let cancelado = false;
    void obtenerDiagnosticoModulos()
      .then((data) => {
        if (!cancelado) setModulos(data);
      })
      .catch((err) => {
        console.warn('[Diagnostico] error cargando módulos:', err);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const totalDominio = Math.round(modulos.reduce((s, m) => s + m.dominio, 0) / modulos.length);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="animate-fade-in-up">
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Mi Diagnóstico
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Análisis detallado de tu preparación por módulo y tipo de pregunta
        </p>
      </div>

      {/* Global Score */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          animationDelay: '0.05s',
        }}
      >
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Índice de Preparación Global
          </p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: getDominioColor(totalDominio) }}>
            {totalDominio}%
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dominio-alto)' }}>
              {modulos.filter((m) => m.dominio >= 70).length}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Fuertes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dominio-medio)' }}>
              {modulos.filter((m) => m.dominio >= 50 && m.dominio < 70).length}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>En desarrollo</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dominio-brecha)' }}>
              {modulos.filter((m) => m.dominio < 50).length}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Brecha crítica</p>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modulos.map((mod, i) => {
          const tend = getTendencia(mod.tendencia);

          return (
            <div
              key={mod.nombre}
              className="card animate-fade-in-up"
              style={{ padding: '1.25rem', animationDelay: `${0.1 + i * 0.05}s` }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.125rem' }}>{mod.nombre}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>{tend.icon}</span>
                    <span style={{ fontSize: '0.8125rem', color: tend.color, fontWeight: 500 }}>{tend.label}</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getDominioColor(mod.dominio) }}>
                  {mod.dominio}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="progress-bar" style={{ height: '6px', marginBottom: '1rem' }}>
                <div className="progress-bar-fill" style={{ width: `${mod.dominio}%`, background: getDominioColor(mod.dominio) }} />
              </div>

              {/* Rendimiento por tipo */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {(['tipo_I', 'tipo_II', 'tipo_III'] as const).map((tipo) => (
                  <div
                    key={tipo}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: 'var(--color-bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {tipo.replace('_', ' ').toUpperCase()}:{' '}
                    </span>
                    <span style={{ fontWeight: 700, color: getDominioColor(mod.rendimiento[tipo]) }}>
                      {mod.rendimiento[tipo]}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Temas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {mod.temas_debiles.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-dominio-brecha)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      ⚠ Débiles
                    </p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {mod.temas_debiles.map((t) => (
                        <li key={t} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {mod.temas_fuertes.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-dominio-alto)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      ✓ Fuertes
                    </p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {mod.temas_fuertes.map((t) => (
                        <li key={t} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
