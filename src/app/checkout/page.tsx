// ============================================================
// /checkout — Página de compra
//
// Recibe ?lead_id=<uuid> desde los emails de remarketing o el
// enlace de la landing post-diagnóstico. Carga datos del lead,
// muestra resumen del plan (precio, garantía, beneficios) y un
// botón que llama a /api/checkout/iniciar para generar la sesión
// de Wompi y redirigir al Web Checkout.
//
// Si Wompi no está configurado (sandbox sin keys), muestra un
// aviso amigable en vez de reventar.
// ============================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { wompiConfigurado } from '@/lib/payments/wompi';
import Link from 'next/link';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Activa tu plan · MéritoPro',
  description:
    'Completa tu compra y empieza a prepararte con método científico para el Concurso PGN 2026.',
};

interface PageProps {
  searchParams: Promise<{ lead_id?: string }>;
}

interface Lead {
  id: string;
  nombre: string;
  email: string;
  cargo_aspira: string;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { lead_id } = await searchParams;
  if (!lead_id) redirect('/');

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('id, nombre, email, cargo_aspira')
    .eq('id', lead_id)
    .maybeSingle<Lead>();

  if (!lead) {
    return (
      <CheckoutShell>
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            No encontramos este diagnóstico
          </p>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            El enlace puede haber expirado o el ID es incorrecto. Inicia un diagnóstico
            nuevo desde la página principal.
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{ marginTop: '1.5rem', display: 'inline-flex' }}
          >
            Ir al inicio →
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  const pasarelaActiva = wompiConfigurado();

  // Calcular porcentaje de acierto del diagnóstico (si existe)
  const { data: respuestas } = await supabase
    .from('respuestas_preguntas')
    .select('correcta')
    .eq('lead_id', lead_id)
    .eq('sesion_tipo', 'diagnostico');

  let porcentajeProbabilidad: number | null = null;
  if (respuestas && respuestas.length > 0) {
    const correctas = respuestas.filter((r) => r.correcta).length;
    porcentajeProbabilidad = Math.round((correctas / respuestas.length) * 100);
  }

  return (
    <CheckoutShell>
      <div className="animate-fade-in-up">
        {/* Header de contexto */}
        {porcentajeProbabilidad !== null && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, var(--color-ia-light) 0%, #ede9fe 100%)',
              border: '1px solid #c7d2fe',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--color-ia), #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.125rem',
                flexShrink: 0,
              }}
            >
              {porcentajeProbabilidad}%
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                Tu probabilidad actual de aprobar
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Con MéritoPro llegarás a 75-85% en 8 semanas
              </p>
            </div>
          </div>
        )}

        {/* Título */}
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '0.375rem',
          }}
        >
          Activa tu plan personalizado
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Hola <strong style={{ color: 'var(--color-text-primary)' }}>{lead.nombre}</strong>,
          tu plan está listo para el cargo de{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>{lead.cargo_aspira}</strong>.
        </p>

        {/* Card de producto */}
        <div
          style={{
            border: '2px solid var(--color-cta)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          {/* Badge beta */}
          <div
            style={{
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(90deg, var(--color-cta) 0%, #fde047 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-cta-text)' }}>
              🚀 PRECIO BETA — Oferta limitada
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.8125rem',
                padding: '0.125rem 0.5rem',
                backgroundColor: 'rgba(15,23,42,0.1)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-cta-text)',
              }}
            >
              25% OFF
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  MéritoPro PGN 2026
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Plan completo · Acceso hasta 30 días post-examen
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    textDecoration: 'line-through',
                  }}
                >
                  COP $397.000
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  $297.000
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  Pago único · Sin renovaciones
                </p>
              </div>
            </div>

            {/* Incluido */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.75rem',
                }}
              >
                Tu plan incluye
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'grid',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-primary)',
                }}
              >
                {[
                  '10 preguntas diarias personalizadas con IA',
                  'Repetición Espaciada (algoritmo SM-2)',
                  'Metodología oficial: Tipo I, II, III + Likert',
                  'Citas de ley verificadas en cada respuesta',
                  'Sesiones de 30 min — compatible con tu trabajo',
                  'Pregunta diaria por Telegram al horario que elijas',
                  'Dashboard con probabilidad real de aprobar',
                  'Doble Garantía MéritoPro (ver abajo)',
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-dominio-alto)', fontWeight: 700, flexShrink: 0 }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Doble Garantía */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: '#166534',
              marginBottom: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            🛡️ Doble Garantía MéritoPro
          </p>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', color: '#15803d', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <strong style={{ flexShrink: 0 }}>1.</strong>
              <span>
                <strong>7 días de reembolso 100%</strong> — si no te convence, devolvemos tu dinero sin
                preguntas.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <strong style={{ flexShrink: 0 }}>2.</strong>
              <span>
                <strong>50% off uso único</strong> — si entrenas ≥80% de las sesiones y no clasificas,
                te damos un código de 50% de descuento en cualquier curso del Marketplace por 12 meses.
              </span>
            </div>
          </div>
          <Link
            href="/garantia"
            target="_blank"
            style={{
              display: 'inline-block',
              marginTop: '0.625rem',
              fontSize: '0.8125rem',
              color: '#166534',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Ver política completa →
          </Link>
        </div>

        {/* Métodos de pago */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            Métodos de pago aceptados
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['💳 Tarjeta crédito/débito', '🏦 PSE', '📱 Nequi', '🏪 Efectivo'].map((m) => (
              <span
                key={m}
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                }}
              >
                {m}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Procesado por Wompi (Bancolombia) · Conexión segura SSL
          </p>
        </div>

        {/* CTA — componente cliente */}
        {pasarelaActiva ? (
          <CheckoutClient
            leadId={lead.id}
            email={lead.email}
            nombre={lead.nombre}
          />
        ) : (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#92400e' }}>
              Pasarela de pago en mantenimiento
            </p>
            <p style={{ fontSize: '0.875rem', color: '#a16207', lineHeight: 1.6 }}>
              Estamos configurando la pasarela de pago. Intenta de nuevo en unos minutos
              o escríbenos a{' '}
              <Link href="mailto:soporte@meritopro.co" style={{ fontWeight: 600 }}>
                soporte@meritopro.co
              </Link>
              .
            </p>
          </div>
        )}

        {/* Nota legal */}
        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Al completar la compra aceptas los{' '}
          <Link
            href="/legal/terminos"
            target="_blank"
            style={{ color: 'var(--color-ia)', textDecoration: 'underline' }}
          >
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link
            href="/legal/privacidad"
            target="_blank"
            style={{ color: 'var(--color-ia)', textDecoration: 'underline' }}
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </div>
    </CheckoutShell>
  );
}

// Shell layout consistente
function CheckoutShell({ children }: { children: React.ReactNode }) {
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
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            🔒 Compra segura
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'clamp(1.5rem, 4vw, 3rem) 1rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: 560 }}>{children}</div>
      </main>

      <footer
        style={{
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        © {new Date().getFullYear()} MéritoPro · Concurso PGN 2026
      </footer>
    </div>
  );
}
