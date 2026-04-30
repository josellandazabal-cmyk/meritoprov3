'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { actualizarPassword, type LoginFormState } from '../actions';

// ============================================================
// /login/restablecer · Aterrizaje del enlace de recuperación
//
// Supabase redirige aquí desde el correo. El SDK del cliente —vía
// las cookies que el middleware ya gestiona— deja una sesión
// "recovery" activa, suficiente para llamar `auth.updateUser`.
// El server action `actualizarPassword` valida y aplica el cambio.
// ============================================================

const ESTADO_INICIAL: LoginFormState = {};

export default function RestablecerPasswordPage() {
  const [estado, accion, pending] = useActionState(
    actualizarPassword,
    ESTADO_INICIAL
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <header
        style={{
          padding: '1.25rem 0',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-white)',
        }}
      >
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--color-text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
            </span>
          </Link>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: 'var(--color-bg-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.04)',
          }}
        >
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
              color: 'var(--color-text-primary)',
            }}
          >
            Crea tu nueva contraseña
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-muted)',
              marginBottom: '1.75rem',
              lineHeight: 1.5,
            }}
          >
            Elige una contraseña segura — mínimo 8 caracteres. Vas a iniciar
            sesión automáticamente al confirmarla.
          </p>

          {estado.errors?._form && (
            <div
              role="alert"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              {estado.errors._form[0]}
            </div>
          )}

          <form
            action={accion}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <Campo
              label="Nueva contraseña"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              error={estado.errors?.password?.[0]}
              required
            />

            <Campo
              label="Confirmar contraseña"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              error={estado.errors?.password_confirm?.[0]}
              required
            />

            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                marginTop: '0.5rem',
                opacity: pending ? 0.7 : 1,
                cursor: pending ? 'wait' : 'pointer',
              }}
            >
              {pending ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            <Link
              href="/login"
              style={{
                color: 'var(--color-ia)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
        }}
      >
        © {new Date().getFullYear()} MéritoPro · Concurso PGN 2026
      </footer>
    </div>
  );
}

// Subcomponente local — copia del de /login/page.tsx para no exportar
// otra función desde un módulo "use client".
function Campo({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
  placeholder: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label
        htmlFor={name}
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        style={{
          padding: '0.75rem 0.875rem',
          fontSize: '0.9375rem',
          border: `1px solid ${error ? '#fca5a5' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-white)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          transition: 'border-color var(--transition-fast)',
        }}
      />
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: '#dc2626',
            marginTop: '0.125rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
