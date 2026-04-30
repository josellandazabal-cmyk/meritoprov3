'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  iniciarSesion,
  registrar,
  solicitarRecuperacion,
  type LoginFormState,
} from './actions';

const ESTADO_INICIAL: LoginFormState = {};

type Modo = 'iniciar' | 'registrar' | 'recuperar';

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>('iniciar');
  const [estadoLogin, accionLogin, loginPending] = useActionState(
    iniciarSesion,
    ESTADO_INICIAL
  );
  const [estadoRegistro, accionRegistro, registroPending] = useActionState(
    registrar,
    ESTADO_INICIAL
  );
  const [estadoRecuperar, accionRecuperar, recuperarPending] = useActionState(
    solicitarRecuperacion,
    ESTADO_INICIAL
  );

  const estado =
    modo === 'iniciar'
      ? estadoLogin
      : modo === 'registrar'
        ? estadoRegistro
        : estadoRecuperar;
  const pending =
    modo === 'iniciar'
      ? loginPending
      : modo === 'registrar'
        ? registroPending
        : recuperarPending;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Header simple con branding */}
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

      {/* Cuerpo centrado */}
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
          {/* Tabs */}
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: '0.25rem',
              padding: '0.25rem',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.75rem',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'iniciar' || modo === 'recuperar'}
              onClick={() => setModo('iniciar')}
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm, 0.375rem)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor:
                  modo === 'iniciar' || modo === 'recuperar'
                    ? 'var(--color-bg-white)'
                    : 'transparent',
                color:
                  modo === 'iniciar' || modo === 'recuperar'
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                boxShadow:
                  modo === 'iniciar' || modo === 'recuperar'
                    ? '0 1px 2px rgba(15,23,42,0.06)'
                    : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'registrar'}
              onClick={() => setModo('registrar')}
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm, 0.375rem)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor:
                  modo === 'registrar' ? 'var(--color-bg-white)' : 'transparent',
                color:
                  modo === 'registrar'
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                boxShadow:
                  modo === 'registrar' ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Crear cuenta
            </button>
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
              color: 'var(--color-text-primary)',
            }}
          >
            {modo === 'iniciar'
              ? 'Bienvenido de vuelta'
              : modo === 'registrar'
                ? 'Crea tu cuenta'
                : 'Recupera tu contraseña'}
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-muted)',
              marginBottom: '1.75rem',
              lineHeight: 1.5,
            }}
          >
            {modo === 'iniciar'
              ? 'Continúa tu preparación para el concurso PGN 2026.'
              : modo === 'registrar'
                ? 'Empieza gratis — diagnóstico de 40 preguntas, sin tarjeta.'
                : 'Te enviaremos un enlace seguro para que crees una nueva contraseña.'}
          </p>

          {/* Mensaje de éxito (registro con confirm email) */}
          {estado.mensaje && (
            <div
              role="status"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-ia-light)',
                color: 'var(--color-ia)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              {estado.mensaje}
            </div>
          )}

          {/* Error de formulario global */}
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

          {/* Formulario */}
          <form
            action={
              modo === 'iniciar'
                ? accionLogin
                : modo === 'registrar'
                  ? accionRegistro
                  : accionRecuperar
            }
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {modo === 'registrar' && (
              <Campo
                label="Nombre completo"
                name="nombre"
                type="text"
                autoComplete="name"
                placeholder="Tu nombre y apellido"
                error={estado.errors?.nombre?.[0]}
                required
              />
            )}

            <Campo
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@dominio.com"
              error={estado.errors?.email?.[0]}
              required
            />

            {modo !== 'recuperar' && (
              <div>
                <Campo
                  label="Contraseña"
                  name="password"
                  type="password"
                  autoComplete={modo === 'iniciar' ? 'current-password' : 'new-password'}
                  placeholder={modo === 'iniciar' ? '••••••••' : 'Mínimo 8 caracteres'}
                  error={estado.errors?.password?.[0]}
                  required
                />
                {modo === 'iniciar' && (
                  <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setModo('recuperar')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--color-ia)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>
            )}

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
              {pending
                ? modo === 'iniciar'
                  ? 'Entrando...'
                  : modo === 'registrar'
                    ? 'Creando cuenta...'
                    : 'Enviando enlace...'
                : modo === 'iniciar'
                  ? 'Iniciar sesión'
                  : modo === 'registrar'
                    ? 'Crear cuenta'
                    : 'Enviar enlace de recuperación'}
            </button>
          </form>

          {/* Pie del card */}
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
            {modo === 'iniciar' && (
              <>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setModo('registrar')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-ia)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 'inherit',
                  }}
                >
                  Regístrate gratis
                </button>
              </>
            )}
            {modo === 'registrar' && (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setModo('iniciar')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-ia)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 'inherit',
                  }}
                >
                  Inicia sesión
                </button>
              </>
            )}
            {modo === 'recuperar' && (
              <button
                type="button"
                onClick={() => setModo('iniciar')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--color-ia)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'inherit',
                }}
              >
                ← Volver a iniciar sesión
              </button>
            )}
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

// ============================================================
// Subcomponente: Campo de formulario con label y error inline
// ============================================================
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
