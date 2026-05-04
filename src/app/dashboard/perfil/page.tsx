'use client';

import { useEffect, useState } from 'react';
import {
  obtenerPerfilUsuario,
  obtenerLinkVinculacionTelegram,
  type PerfilUsuario,
} from './actions';

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
      <TelegramSection conectado={perfil.telegram_conectado} />
    </div>
  );
}

// ============================================================
// Sección Telegram — Click → genera deep-link a t.me/<bot>?start=<uid>
// y abre Telegram en pestaña nueva. El webhook procesa /start <uid>
// y vincula el chat_id en BD. Tras volver al perfil, refresca para
// ver "Telegram conectado ✓".
// ============================================================
function TelegramSection({ conectado }: { conectado: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConectar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await obtenerLinkVinculacionTelegram();
      if (!res.ok) {
        setError(res.motivo ?? 'No se pudo generar el enlace.');
        return;
      }
      if (res.yaConectado) {
        // Refrescar perfil
        window.location.reload();
        return;
      }
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="card animate-fade-in-up"
      style={{ padding: '1.5rem', animationDelay: '0.15s' }}
    >
      <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.75rem' }}>
        📱 Repaso por Telegram
      </h3>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9375rem',
          marginBottom: '1rem',
        }}
      >
        {conectado
          ? 'Telegram está conectado. Recibirás tu píldora diaria de repaso SM-2 y podrás responder preguntas directamente desde el chat.'
          : 'Conecta tu Telegram para recibir píldoras de repaso diarias basadas en tu curva del olvido. Tu Tutor IA evaluará tus respuestas al instante.'}
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.625rem 0.875rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            marginBottom: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-secondary"
        onClick={() => void handleConectar()}
        disabled={conectado || cargando}
      >
        {conectado
          ? 'Telegram conectado ✓'
          : cargando
            ? 'Abriendo Telegram…'
            : 'Conectar Telegram →'}
      </button>

      {!conectado && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          Al hacer click se abrirá Telegram con el bot de MéritoPro y un
          enlace de vinculación pre-cargado. Solo presiona <strong>Iniciar</strong> en
          el chat y vuelve aquí para confirmar.
        </p>
      )}
    </div>
  );
}
