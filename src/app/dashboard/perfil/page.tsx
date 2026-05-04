'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  obtenerPerfilUsuario,
  obtenerLinkVinculacionTelegram,
  verificarVinculacionTelegram,
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

      {/* Footer: link sutil al panel admin de Telegram (sin destacar) */}
      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}
      >
        ¿El bot no responde?{' '}
        <Link
          href="/dashboard/admin/telegram"
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline' }}
        >
          Configurar webhook
        </Link>
      </p>
    </div>
  );
}

// ============================================================
// Sección Telegram — flujo en 3 pasos:
//   1. Idle: usuario ve botón "Conectar Telegram"
//   2. Click → abre Telegram en pestaña nueva con deep-link
//      → estado pasa a "esperando" + arranca polling cada 3s por 60s
//   3. Cuando el webhook guarda el chat_id, la BD se actualiza y el
//      polling detecta la conexión → estado "conectado".
//
// El usuario también tiene un botón manual "Ya lo hice, verificar"
// por si el polling se pierde.
// ============================================================
type TelegramFase = 'idle' | 'esperando' | 'conectado' | 'error';

function TelegramSection({ conectado: conectadoInicial }: { conectado: boolean }) {
  const [fase, setFase] = useState<TelegramFase>(
    conectadoInicial ? 'conectado' : 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);

  // Polling: cada 3s mientras estamos en "esperando", hasta 60s.
  useEffect(() => {
    if (fase !== 'esperando') return;
    const interval = setInterval(() => {
      void verificarVinculacionTelegram().then((r) => {
        if (r.conectado) {
          setFase('conectado');
        }
      });
      setIntentos((n) => n + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [fase]);

  // Si llegamos a 20 intentos (60s) sin éxito, paramos polling pero
  // dejamos al usuario verificar manualmente.
  useEffect(() => {
    if (intentos >= 20 && fase === 'esperando') {
      // queueMicrotask para cumplir react-hooks/set-state-in-effect.
      queueMicrotask(() => {
        setFase('idle');
        setError(
          'No detectamos la conexión todavía. Asegúrate de presionar "Iniciar" en Telegram, o pulsa "Ya lo hice" para verificar.'
        );
      });
    }
  }, [intentos, fase]);

  const handleConectar = async () => {
    setError(null);
    try {
      const res = await obtenerLinkVinculacionTelegram();
      if (!res.ok) {
        setError(res.motivo ?? 'No se pudo generar el enlace.');
        setFase('error');
        return;
      }
      if (res.yaConectado) {
        setFase('conectado');
        return;
      }
      if (res.url) {
        setLink(res.url);
        window.open(res.url, '_blank', 'noopener,noreferrer');
        setFase('esperando');
        setIntentos(0);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setFase('error');
    }
  };

  const handleVerificar = async () => {
    setError(null);
    const r = await verificarVinculacionTelegram();
    if (r.conectado) {
      setFase('conectado');
    } else {
      setError(
        'Aún no detectamos la conexión. Asegúrate de presionar "Iniciar" en el chat con el bot.'
      );
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

      {/* Estado: CONECTADO */}
      {fase === 'conectado' && (
        <>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.9375rem',
              marginBottom: '1rem',
            }}
          >
            Telegram está conectado. Recibirás tu píldora diaria de repaso
            SM-2 y podrás responder preguntas directamente desde el chat.
          </p>
          <button className="btn btn-secondary" disabled>
            Telegram conectado ✓
          </button>
        </>
      )}

      {/* Estado: IDLE o ERROR */}
      {(fase === 'idle' || fase === 'error') && (
        <>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.9375rem',
              marginBottom: '1rem',
            }}
          >
            Conecta tu Telegram para recibir píldoras de repaso diarias
            basadas en tu curva del olvido. Tu Tutor IA evaluará tus
            respuestas al instante.
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

          <button className="btn btn-secondary" onClick={() => void handleConectar()}>
            Conectar Telegram →
          </button>

          <ol
            style={{
              marginTop: '0.875rem',
              paddingLeft: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            <li>Click en &ldquo;Conectar Telegram&rdquo; — abre el chat con nuestro bot.</li>
            <li>Presiona <strong>Iniciar</strong> dentro del chat de Telegram.</li>
            <li>Vuelve aquí — la conexión se detecta automáticamente.</li>
          </ol>
        </>
      )}

      {/* Estado: ESPERANDO (polling activo) */}
      {fase === 'esperando' && (
        <>
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid #854d0e',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#854d0e' }}>
                Esperando que presiones &ldquo;Iniciar&rdquo; en Telegram…
              </p>
              <p style={{ fontSize: '0.75rem', color: '#854d0e', opacity: 0.8 }}>
                Verificando cada 3 segundos automáticamente.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => void handleVerificar()}
              style={{ fontSize: '0.875rem' }}
            >
              Ya lo hice, verificar ahora
            </button>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                Volver a abrir Telegram
              </a>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setFase('idle');
                setError(null);
                setIntentos(0);
              }}
              style={{ fontSize: '0.875rem' }}
            >
              Cancelar
            </button>
          </div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </>
      )}
    </div>
  );
}
