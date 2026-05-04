'use client';

// ============================================================
// /dashboard/admin/telegram — Panel admin del webhook de Telegram
//
// Página accesible solo desde URL directa (no en sidebar) para el
// owner. Permite:
//   1. Ver el estado actual del webhook (bot, URL configurada, errores).
//   2. Configurar/re-configurar el webhook con un click. Sin curl.
//   3. Diagnosticar por qué el bot no responde a /start.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  diagnosticarWebhook,
  configurarWebhook,
  type DiagnosticoWebhook,
} from './actions';

export default function AdminTelegramPage() {
  const [diag, setDiag] = useState<DiagnosticoWebhook | null>(null);
  const [cargando, setCargando] = useState(true);
  const [configurando, setConfigurando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDiagnostico = async () => {
    setCargando(true);
    setMensajeExito(null);
    const r = await diagnosticarWebhook();
    setDiag(r);
    setCargando(false);
  };

  useEffect(() => {
    // queueMicrotask difiere el setState del cargarDiagnostico para
    // cumplir react-hooks/set-state-in-effect.
    queueMicrotask(() => void cargarDiagnostico());
  }, []);

  const handleConfigurar = async () => {
    setConfigurando(true);
    setMensajeExito(null);
    const r = await configurarWebhook();
    setDiag(r);
    setConfigurando(false);
    if (r.ok && r.configurado_correctamente) {
      setMensajeExito('✅ Webhook configurado correctamente. Tu bot ya responde a /start.');
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1rem' }}>
      <div className="animate-fade-in-up">
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
          }}
        >
          ⚙️ Admin · Solo owner
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Telegram Webhook
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Configura el webhook que permite que el bot de Telegram reciba los mensajes de los usuarios. Es necesario hacerlo después de cada deploy con dominio nuevo.
        </p>
      </div>

      {/* Diagnóstico actual */}
      {cargando ? (
        <div
          className="card"
          style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}
        >
          Consultando estado del bot…
        </div>
      ) : diag?.ok ? (
        <DiagnosticoCard diag={diag} />
      ) : (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>❌ Error</p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{diag?.error}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {mensajeExito && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontWeight: 600,
          }}
        >
          {mensajeExito}
        </div>
      )}

      {/* Acciones */}
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          gap: '0.625rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => void handleConfigurar()}
          disabled={configurando || cargando}
        >
          {configurando
            ? 'Configurando…'
            : diag?.configurado_correctamente
              ? 'Re-configurar webhook'
              : 'Configurar webhook ahora'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => void cargarDiagnostico()}
          disabled={cargando || configurando}
        >
          🔄 Refrescar diagnóstico
        </button>
        <Link href="/dashboard/perfil" className="btn btn-ghost">
          ← Volver al perfil
        </Link>
      </div>

      {/* Instrucciones */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          📚 ¿Cómo funciona?
        </p>
        <ol
          style={{
            paddingLeft: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--color-text-secondary)',
          }}
        >
          <li>
            <strong>setWebhook</strong>: le dice a Telegram a qué URL enviar los mensajes que reciba tu bot. Sin esto, los mensajes se acumulan en cola y nunca llegan.
          </li>
          <li>
            <strong>URL configurada</strong>: <code>https://[tu-dominio]/api/webhooks/telegram</code> — esa ruta procesa <code>/start &lt;user_id&gt;</code>, vincula el chat_id del usuario y responde.
          </li>
          <li>
            <strong>Cuándo re-configurar</strong>: si cambia el dominio (deploy nuevo, custom domain), o si el diagnóstico arriba muestra una URL distinta a la actual.
          </li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================
// Card con el diagnóstico actual del webhook
// ============================================================
function DiagnosticoCard({ diag }: { diag: DiagnosticoWebhook }) {
  const ok = diag.configurado_correctamente;
  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        border: ok ? '2px solid var(--color-dominio-alto)' : '2px solid #f59e0b',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{ok ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 700 }}>
            {ok ? 'Webhook configurado correctamente' : 'Webhook NO configurado'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {ok
              ? 'El bot recibe los mensajes de Telegram en este deploy.'
              : 'El bot no podrá responder a /start hasta que configures el webhook.'}
          </p>
        </div>
      </div>

      <Field label="Bot username" value={diag.bot_username ? `@${diag.bot_username}` : '—'} />
      <Field label="Bot ID" value={String(diag.bot_id ?? '—')} />
      <Field
        label="URL configurada"
        value={diag.webhook_url || '(ninguna)'}
        mono
        warn={!diag.webhook_url}
      />
      <Field
        label="Updates pendientes"
        value={String(diag.pending_updates ?? 0)}
        warn={(diag.pending_updates ?? 0) > 5}
      />
      {diag.ultimo_error && (
        <Field
          label="Último error reportado"
          value={`${diag.ultimo_error} (${diag.ultimo_error_fecha ?? '—'})`}
          warn
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      <span
        style={{
          color: warn ? '#b45309' : 'var(--color-text-primary)',
          fontWeight: 600,
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? '0.75rem' : '0.875rem',
          textAlign: 'right',
          wordBreak: 'break-all',
          maxWidth: '60%',
        }}
      >
        {value}
      </span>
    </div>
  );
}
