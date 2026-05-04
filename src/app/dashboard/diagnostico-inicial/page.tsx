// ============================================================
// /dashboard/diagnostico-inicial — Wrapper de auth para el simulacro
//
// Este Server Component es el puente entre el dashboard autenticado
// y el simulacro de 40 preguntas (`/diagnostico/[lead_id]`).
//
// Comportamiento:
//   1. Verifica que haya sesión activa. Si no, redirect a /login.
//   2. Resuelve el `lead_id` a usar:
//      - Si `usuarios.lead_id` existe → ese (lead original del funnel pre-pago).
//      - Si no → usa `user.id` como pseudo-lead. El simulacro funciona
//        con cualquier UUID v4 (la validación es defensiva, no de FK).
//   3. Verifica si el usuario YA tiene respuestas de diagnóstico.
//      - Si NO → redirect inmediato al simulacro.
//      - Si SÍ → renderiza pantalla de re-confirmación con botones
//        "Volver a hacerlo" y "Ver mi diagnóstico".
//
// Decisión UX (validada con el owner): permitir re-tomar siempre.
// Útil para que el usuario mida progreso. El dashboard agregará todas
// las respuestas en el cómputo (last-write-wins por timestamp en
// la tendencia), no sólo la primera.
// ============================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tieneRespuestasDiagnostico } from '@/app/dashboard/diagnostico/actions';
import { obtenerEstadoPerfil } from '@/lib/perfil/completitud';
import BloqueoPerfilIncompleto from '@/components/dashboard/BloqueoPerfilIncompleto';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Diagnóstico inicial · MéritoPro',
  description:
    'Simulacro de 40 preguntas para conocer tu nivel real frente al concurso PGN 2026.',
};

export default async function DiagnosticoInicialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Gate: perfil completo es prerrequisito para personalización
  const estadoPerfil = await obtenerEstadoPerfil();
  if (!estadoPerfil.completo) {
    return <BloqueoPerfilIncompleto seccion="diagnostico" />;
  }

  // Resolver leadId a usar para el simulacro
  const { data: usuarioRow } = await supabase
    .from('usuarios')
    .select('lead_id')
    .eq('id', user.id)
    .maybeSingle();

  const leadIdParaSimulacro = usuarioRow?.lead_id ?? user.id;

  // Verificar si ya hay diagnóstico previo
  const previo = await tieneRespuestasDiagnostico();

  if (!previo.tiene) {
    redirect(`/diagnostico/${leadIdParaSimulacro}`);
  }

  // Pantalla de re-confirmación
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="animate-fade-in-up">
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}
        >
          Ya tienes un diagnóstico previo
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          Has respondido <strong>{previo.total}</strong>{' '}
          {previo.total === 1 ? 'pregunta de diagnóstico' : 'preguntas de diagnóstico'} con un{' '}
          <strong style={{ color: 'var(--color-ia)' }}>{previo.porcentaje}% de acierto</strong>.
          Puedes consultar el desglose por módulo o repetir el simulacro completo para
          medir tu progreso.
        </p>

        <div
          className="card"
          style={{
            padding: '1.5rem',
            marginBottom: '1.25rem',
            border: '2px solid var(--color-cta)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-cta)',
              marginBottom: '0.5rem',
            }}
          >
            Recomendado
          </p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Volver a hacerlo
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Repetir el simulacro de 40 preguntas. Las nuevas respuestas se sumarán a tu
            histórico — verás tu tendencia (mejorando / estable / decayendo) en el dashboard.
          </p>
          <Link
            href={`/diagnostico/${leadIdParaSimulacro}`}
            className="btn btn-primary btn-xl"
            style={{ width: '100%', textAlign: 'center', display: 'inline-block' }}
          >
            Iniciar nuevo simulacro →
          </Link>
        </div>

        <div
          className="card"
          style={{
            padding: '1.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Ver mi diagnóstico actual
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Revisa tu desglose por módulo, fortalezas, brechas y rendimiento por tipo de pregunta.
          </p>
          <Link
            href="/dashboard/diagnostico"
            className="btn btn-secondary"
            style={{ display: 'inline-block' }}
          >
            Ver desglose →
          </Link>
        </div>
      </div>
    </div>
  );
}
