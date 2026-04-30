// ============================================================
// /dashboard/bienvenida
//
// Aterrizaje post-pago. Wompi redirige aquí con ?ref=<reference>.
// La página verifica que la transacción esté APROBADA en
// `intenciones_pago` (el webhook ya la procesó), muestra confirmación
// + onboarding de 3 pasos: Telegram, horario, primera sesión.
//
// Si el webhook todavía no llegó (timing), mostramos un estado "Pago
// recibido — confirmando..." y el cliente refresca cada 3 segundos.
// ============================================================

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackPurchase from '@/components/analytics/TrackPurchase';

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

interface IntencionPago {
  reference: string;
  estado: 'iniciada' | 'aprobada' | 'rechazada';
  email: string;
  monto_cop: number;
  curso_slug: string;
  aprobada_at: string | null;
}

export const dynamic = 'force-dynamic';

export default async function BienvenidaPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  if (!ref) redirect('/dashboard');

  const supabase = await createClient();
  const { data: intencion } = await supabase
    .from('intenciones_pago')
    .select('reference, estado, email, monto_cop, curso_slug, aprobada_at')
    .eq('reference', ref)
    .maybeSingle<IntencionPago>();

  // Estado: pago recibido pero todavía no procesado por el webhook
  const procesando = intencion && intencion.estado !== 'aprobada';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <header
        style={{
          padding: '1.25rem 0',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-white)',
        }}
      >
        <div className="container-wide">
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
          </span>
        </div>
      </header>

      <main className="container-narrow" style={{ padding: '3rem 1rem' }}>
        {!intencion ? (
          <Estado
            tipo="error"
            titulo="No encontramos esta compra"
            mensaje={`No hay registros para la referencia ${ref}. Si acabas de pagar y este mensaje persiste, escríbenos a soporte@meritopro.co adjuntando esta referencia.`}
          />
        ) : procesando ? (
          <Procesando reference={ref} />
        ) : (
          <Aprobada intencion={intencion} />
        )}
      </main>
    </div>
  );
}

// ------------------------------------------------------------
// Subcomponentes
// ------------------------------------------------------------

function Estado({
  tipo,
  titulo,
  mensaje,
}: {
  tipo: 'error' | 'success';
  titulo: string;
  mensaje: string;
}) {
  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
        borderRadius: '0.75rem',
      }}
    >
      <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
        {titulo}
      </p>
      <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{mensaje}</p>
    </div>
  );
}

function Procesando({ reference }: { reference: string }) {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        Pago recibido — confirmando...
      </h1>
      <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Tu pago llegó correctamente. Estamos cerrando la transacción con la pasarela —
        suele tardar 5-30 segundos. Esta página se actualiza sola.
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Referencia: <code>{reference}</code>
      </p>
      {/* Auto-refresh cada 3 segundos hasta que el webhook procese la transacción. */}
      <meta httpEquiv="refresh" content="3" />
    </div>
  );
}

function Aprobada({ intencion }: { intencion: IntencionPago }) {
  const monto = intencion.monto_cop.toLocaleString('es-CO');
  return (
    <>
      {/* Pixel Purchase event — anti-duplicado por sessionStorage. */}
      <TrackPurchase
        reference={intencion.reference}
        valueCop={intencion.monto_cop}
        contentName={intencion.curso_slug}
      />
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          ¡Tu plan está activo!
        </p>
        <p style={{ color: '#166534', fontSize: '0.9375rem' }}>
          Compra de COP {monto} confirmada · Referencia <code>{intencion.reference}</code>
        </p>
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 800,
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}
      >
        Bienvenido a MéritoPro.
      </h1>
      <p
        style={{
          fontSize: '1.0625rem',
          color: 'var(--color-text-muted)',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
          maxWidth: 560,
        }}
      >
        Lo que sigue son tres pasos cortos para que mañana mismo recibas tu primera
        pregunta del bucle diario en Telegram al horario que elijas.
      </p>

      <Paso
        n={1}
        titulo="Configura Telegram"
        descripcion="Conecta tu cuenta de Telegram para recibir tu pregunta diaria al horario que tú decidas."
        cta="Conectar Telegram"
        href="/dashboard/configuracion/telegram"
      />
      <Paso
        n={2}
        titulo="Programa tu horario"
        descripcion="Recomendado: 7:00 a.m. (justo después del café). El bucle diario son 10 preguntas que toman 10-15 minutos."
        cta="Elegir horario"
        href="/dashboard/configuracion/horario"
      />
      <Paso
        n={3}
        titulo="Empieza tu primera sesión hoy"
        descripcion="No esperes a mañana. La primera sesión calibra el algoritmo SM-2 con tu nivel real y arranca tu plan personalizado."
        cta="Empezar primera sesión"
        href="/dashboard/entrenar"
        primario
      />

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-bg-white)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong>Tu compra incluye:</strong> acceso al curso <code>{intencion.curso_slug}</code>{' '}
        desde hoy hasta 30 días después del examen. Doble Garantía MéritoPro activa
        (7 días para reembolso 100% + 50% off uso único en el Marketplace si entrenas
        y no clasificas). Recibirás la confirmación por correo en{' '}
        <strong>{intencion.email}</strong>.
      </div>

      <p
        style={{
          marginTop: '2rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
        }}
      >
        ¿Algo no cuadra? Escríbenos a{' '}
        <Link
          href="mailto:soporte@meritopro.co"
          style={{ color: 'var(--color-ia)', fontWeight: 600 }}
        >
          soporte@meritopro.co
        </Link>{' '}
        — te responde una persona real en menos de 24 h.
      </p>
    </>
  );
}

function Paso({
  n,
  titulo,
  descripcion,
  cta,
  href,
  primario,
}: {
  n: number;
  titulo: string;
  descripcion: string;
  cta: string;
  href: string;
  primario?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.25rem',
        padding: '1.25rem',
        backgroundColor: 'var(--color-bg-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: primario ? 'var(--color-cta)' : 'var(--color-ia-light)',
          color: primario ? '#0f172a' : 'var(--color-ia)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1rem',
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{titulo}</p>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
            lineHeight: 1.5,
          }}
        >
          {descripcion}
        </p>
        <Link
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            backgroundColor: primario ? 'var(--color-cta)' : 'transparent',
            color: primario ? '#0f172a' : 'var(--color-ia)',
            border: primario ? 'none' : '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}
