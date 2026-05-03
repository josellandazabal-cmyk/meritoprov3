'use client';

import { useEffect, useState } from 'react';
import { obtenerPerfilUsuario, type PerfilUsuario } from './actions';

const PERFIL_INICIAL: PerfilUsuario = {
  nombre: 'Cargando…',
  iniciales: '·',
  email: '',
  cargo_aspira: '—',
  nivel_cargo: '—',
  profesion: '—',
  fecha_examen_humana: '—',
  telegram_conectado: false,
  estadisticas: {
    dias_activos: 0,
    preguntas_resueltas: 0,
    racha_dias: 0,
    tiempo_total_horas: 0,
  },
};

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<PerfilUsuario>(PERFIL_INICIAL);

  useEffect(() => {
    let cancelado = false;
    void obtenerPerfilUsuario()
      .then((data) => {
        if (!cancelado) setPerfil(data);
      })
      .catch((err) => {
        console.warn('[Perfil] obtenerPerfilUsuario falló:', err);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="animate-fade-in-up">
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Mi Perfil
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Información personal y configuración
        </p>
      </div>

      {/* Profile Card */}
      <div
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.05s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-ia), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            {perfil.iniciales}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>{perfil.nombre}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              {perfil.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <span className="form-label">Cargo al que aspira</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{perfil.cargo_aspira}</p>
          </div>
          <div className="form-group">
            <span className="form-label">Nivel jerárquico</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{perfil.nivel_cargo}</p>
          </div>
          <div className="form-group">
            <span className="form-label">Profesión</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{perfil.profesion}</p>
          </div>
          <div className="form-group">
            <span className="form-label">Fecha examen estimada</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{perfil.fecha_examen_humana}</p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}
      >
        <h3 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>Estadísticas de estudio</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
          }}
        >
          {[
            {
              label: 'Días activos',
              value: String(perfil.estadisticas.dias_activos),
              color: 'var(--color-ia)',
            },
            {
              label: 'Preguntas resueltas',
              value: String(perfil.estadisticas.preguntas_resueltas),
              color: 'var(--color-cta-hover)',
            },
            {
              label: 'Racha actual',
              value:
                perfil.estadisticas.racha_dias === 1
                  ? '1 día'
                  : `${perfil.estadisticas.racha_dias} días`,
              color: 'var(--color-dominio-alto)',
            },
            {
              label: 'Tiempo total',
              value: `${perfil.estadisticas.tiempo_total_horas} hrs`,
              color: 'var(--color-text-primary)',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
        {perfil.estadisticas.preguntas_resueltas === 0 && (
          <p
            style={{
              marginTop: '0.875rem',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            Aún no has respondido preguntas. Empieza con el diagnóstico para empezar a generar tus estadísticas.
          </p>
        )}
      </div>

      {/* Telegram Integration */}
      <div className="card animate-fade-in-up" style={{ padding: '1.5rem', animationDelay: '0.15s' }}>
        <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.75rem' }}>📱 Repaso por Telegram</h3>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.9375rem',
            marginBottom: '1rem',
          }}
        >
          {perfil.telegram_conectado
            ? 'Telegram está conectado. Recibirás tu píldora diaria a la hora configurada.'
            : 'Conecta tu Telegram para recibir píldoras de repaso diarias basadas en tu curva del olvido.'}
        </p>
        <button className="btn btn-secondary" disabled={perfil.telegram_conectado}>
          {perfil.telegram_conectado ? 'Telegram conectado ✓' : 'Conectar Telegram'}
        </button>
      </div>
    </div>
  );
}
