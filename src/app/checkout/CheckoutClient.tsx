'use client';

// ============================================================
// CheckoutClient — Componente cliente para el botón de compra
//
// Llama a /api/checkout/iniciar con los datos del lead y
// redirige al Web Checkout de Wompi. Maneja estados de loading,
// error, y un campo opcional de código de descuento.
// ============================================================

import { useState } from 'react';

interface Props {
  leadId: string;
  email: string;
  nombre: string;
}

export default function CheckoutClient({ leadId, email, nombre }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  async function handleComprar() {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        lead_id: leadId,
        email,
        nombre,
        curso_slug: 'pgn-2026',
      };
      if (codigo.trim()) {
        body.codigo_descuento = codigo.trim().toUpperCase();
      }

      const res = await fetch('/api/checkout/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar la compra. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Redirigir al Web Checkout de Wompi
      window.location.href = data.redirectUrl;
    } catch {
      setError('No pudimos conectar con la pasarela. Verifica tu conexión e intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Código de descuento (colapsable) */}
      <div style={{ marginBottom: '1rem' }}>
        {!mostrarCodigo ? (
          <button
            type="button"
            onClick={() => setMostrarCodigo(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ia)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              fontFamily: 'inherit',
            }}
          >
            ¿Tienes un código de descuento?
          </button>
        ) : (
          <div
            className="animate-fade-in"
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="MERITO50-XXXX"
              className="form-input"
              style={{
                flex: 1,
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            />
            <button
              type="button"
              onClick={() => {
                setMostrarCodigo(false);
                setCodigo('');
              }}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6875rem 0.75rem',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Botón CTA */}
      <button
        type="button"
        onClick={handleComprar}
        disabled={loading}
        className="btn btn-primary btn-xl"
        style={{
          width: '100%',
          fontSize: '1.125rem',
          fontWeight: 800,
          padding: '1.25rem 2rem',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'wait' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: '20px',
                height: '20px',
                border: '2.5px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }}
            />
            Conectando con la pasarela...
          </>
        ) : (
          'Comprar ahora — COP $297.000 →'
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
