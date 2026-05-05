'use client';

// ============================================================
// /dashboard/reportar-resultado
//
// Form para que el aspirante reporte el estado de su concurso.
// Alimenta la métrica north-star: tasa de éxito de MéritoPro.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  reportarResultadoConcurso,
  consultarReporteResultado,
  type ResultadoInput,
} from './actions';

type EstadoResultado = ResultadoInput['resultado'];

const OPCIONES: Array<{
  valor: EstadoResultado;
  titulo: string;
  desc: string;
  emoji: string;
}> = [
  {
    valor: 'posesionado',
    titulo: 'Ya me posesioné',
    desc: 'Ya tomé posesión del cargo en la PGN.',
    emoji: '🏛️',
  },
  {
    valor: 'en_lista_elegibles',
    titulo: 'Estoy en lista de elegibles',
    desc: 'Pasé el concurso y aparezco en la lista de elegibles vigente.',
    emoji: '📋',
  },
  {
    valor: 'pasa_pruebas',
    titulo: 'Pasé las pruebas',
    desc: 'Superé el 65% mínimo eliminatorio. En espera de consolidación.',
    emoji: '✅',
  },
  {
    valor: 'no_pasa_pruebas',
    titulo: 'No pasé las pruebas',
    desc: 'No alcancé el puntaje mínimo. Pienso prepararme para el próximo concurso.',
    emoji: '📊',
  },
  {
    valor: 'no_se_inscribio',
    titulo: 'No me inscribí',
    desc: 'Decidí no presentarme al concurso 2026.',
    emoji: '⏸️',
  },
  {
    valor: 'pendiente',
    titulo: 'Aún no hay resultado',
    desc: 'El proceso sigue en curso. Volveré a reportar cuando tenga noticia.',
    emoji: '⏳',
  },
];

export default function ReportarResultadoPage() {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<EstadoResultado | null>(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yaReportado, setYaReportado] = useState<{
    resultado: string | null;
    fecha: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;
    void consultarReporteResultado().then((r) => {
      if (cancelado) return;
      if (r.reportado) {
        setYaReportado({ resultado: r.resultado, fecha: r.fecha });
        setSeleccion(r.resultado as EstadoResultado);
      }
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccion) {
      setError('Selecciona una opción para continuar.');
      return;
    }
    setError(null);
    setGuardando(true);
    const r = await reportarResultadoConcurso({
      resultado: seleccion,
      notas: notas.trim() || undefined,
    });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error ?? 'No se pudo guardar.');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1rem' }}>
      <div className="animate-fade-in-up">
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
          }}
        >
          ← Volver al inicio
        </Link>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>
          Reportar resultado del concurso
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '1.75rem',
            lineHeight: 1.65,
            maxWidth: '560px',
          }}
        >
          Tu reporte alimenta la métrica de éxito interna de MéritoPro y nos
          ayuda a calibrar el contenido para futuros aspirantes. Solo te lo
          pediremos una vez por concurso.
        </p>
      </div>

      {yaReportado?.resultado && yaReportado.resultado !== 'pendiente' && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-ia-light)',
            border: '1px solid var(--color-ia)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-ia)' }}>
            Ya reportaste un estado anteriormente
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Estado actual: <strong>{yaReportado.resultado}</strong>. Puedes
            actualizarlo si tu situación cambió (por ejemplo, si pasaste de
            "lista de elegibles" a "posesionado").
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', animationDelay: '0.05s' }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.875rem',
          }}
        >
          Selecciona tu estado actual
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
          {OPCIONES.map((op) => {
            const seleccionada = seleccion === op.valor;
            return (
              <button
                type="button"
                key={op.valor}
                onClick={() => setSeleccion(op.valor)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '1rem',
                  textAlign: 'left',
                  backgroundColor: seleccionada
                    ? 'var(--color-ia-light)'
                    : 'var(--color-bg-white)',
                  border: seleccionada
                    ? '2px solid var(--color-ia)'
                    : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: '1.5rem',
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: seleccionada ? 'white' : 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {op.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      marginBottom: '0.125rem',
                      color: seleccionada ? 'var(--color-ia)' : 'var(--color-text-primary)',
                    }}
                  >
                    {op.titulo}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {op.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="notas">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notas"
            className="form-input"
            rows={3}
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: el cargo que obtuve, comentarios sobre el proceso, qué te ayudó más…"
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>

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
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!seleccion || guardando}
          style={{ width: '100%', fontWeight: 700 }}
        >
          {guardando ? 'Guardando…' : 'Guardar reporte'}
        </button>

        <p
          style={{
            marginTop: '0.875rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Tu reporte es confidencial. Solo se usa de forma agregada para
          métricas internas.
        </p>
      </form>
    </div>
  );
}
