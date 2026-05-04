// ============================================================
// GuiaInscripcion — Pasos oficiales para inscribirse al concurso PGN 2026
//
// Datos extraídos de:
//   · Resolución 076 de 2026 (PGN)
//   · Resolución 108 de 2026 (correctiva)
//   · Convocatoria operada por Universidad de Antioquia
//
// Muestra:
//   1. Estado actual (pre/abiertas/cerradas) — banner dinámico
//   2. 5 pasos del proceso (registro → cargue documentos → pago → pruebas)
//   3. Tips clave (errores que descalifican, qué documentos preparar)
//   4. Links oficiales (procuraduria.gov.co + meritoconstruyendoexcelencia.com.co)
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import {
  CONCURSO_PGN_2026,
  estadoInscripciones,
  type EstadoInscripciones,
} from '@/lib/concurso/datos-oficiales';

const PASOS_INSCRIPCION = [
  {
    numero: 1,
    titulo: 'Crear cuenta en el portal del operador',
    detalle:
      'Ingresa al sitio de la Universidad de Antioquia (operador oficial) y registra usuario con tu correo personal.',
    tip: 'Usa un correo que revises a diario — TODA la comunicación oficial llega ahí.',
  },
  {
    numero: 2,
    titulo: 'Diligenciar formulario de inscripción',
    detalle:
      'Datos personales, estudios, experiencia laboral. Cada campo se verifica contra la documentación que cargues.',
    tip: 'Revisa dos veces: errores en cédula, fechas o títulos académicos descalifican.',
  },
  {
    numero: 3,
    titulo: 'Cargar documentos soporte',
    detalle:
      'Cédula, diploma, acta de grado, tarjeta profesional (si aplica), certificados laborales con fechas exactas, certificados de estudios complementarios.',
    tip: 'PDFs legibles, sin tachones. Certificados laborales deben incluir cargo, funciones y fechas inicio/fin.',
  },
  {
    numero: 4,
    titulo: 'Seleccionar la(s) convocatoria(s) a aspirar',
    detalle:
      `${CONCURSO_PGN_2026.totalConvocatorias} convocatorias agrupan los ${CONCURSO_PGN_2026.totalVacantes.toLocaleString(
        'es-CO'
      )} cargos. Cada convocatoria tiene requisitos específicos de profesión y experiencia.`,
    tip: 'Verifica que cumples ESTRICTAMENTE los requisitos. La PGN excluye automáticamente perfiles que no cumplen.',
  },
  {
    numero: 5,
    titulo: 'Pago de derechos de inscripción',
    detalle:
      'Tarifa establecida por la PGN. El pago se realiza en línea desde el mismo portal. Sin pago no hay inscripción.',
    tip: 'Guarda el comprobante. Si hay error en el sistema, ese comprobante es tu prueba.',
  },
] as const;

const TIPS_CLAVE = [
  {
    icono: '⚠️',
    titulo: 'No esperes al último día',
    detalle:
      'El portal colapsa el último día por sobrecarga. Registra mínimo con 48h de margen.',
  },
  {
    icono: '📋',
    titulo: 'Lee TODA la Resolución 076',
    detalle:
      'Es el reglamento del concurso. Lo no leído no se reclama después.',
  },
  {
    icono: '📅',
    titulo: 'Marca las fechas de pruebas',
    detalle:
      'Tras inscripciones la PGN publica fechas. Si no asistes el día asignado, pierdes el cupo.',
  },
  {
    icono: '🎯',
    titulo: 'Conoce tu nivel de prueba',
    detalle:
      'Profesional/Asesor: 70% conocimientos · Técnico/Admin: 60%. El peso cambia tu estrategia de estudio.',
  },
] as const;

function BannerEstado({ estado }: { estado: EstadoInscripciones }) {
  const colorBg =
    estado.fase === 'abiertas'
      ? '#fef2f2'
      : estado.fase === 'pre'
        ? '#fefce8'
        : '#f3f4f6';
  const colorBorde =
    estado.fase === 'abiertas'
      ? '#fecaca'
      : estado.fase === 'pre'
        ? '#fde68a'
        : '#d1d5db';
  const colorTexto =
    estado.fase === 'abiertas'
      ? '#991b1b'
      : estado.fase === 'pre'
        ? '#854d0e'
        : '#374151';

  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        backgroundColor: colorBg,
        border: `1px solid ${colorBorde}`,
        color: colorTexto,
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.25rem',
        fontSize: '0.875rem',
        fontWeight: 600,
      }}
    >
      {estado.mensajeLargo}
    </div>
  );
}

export default function GuiaInscripcion() {
  const [estado, setEstado] = useState<EstadoInscripciones | null>(null);

  useEffect(() => {
    queueMicrotask(() => setEstado(estadoInscripciones()));
  }, []);

  return (
    <div
      className="animate-fade-in-up"
      style={{ marginTop: '2rem', animationDelay: '0.35s' }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          📝 Cómo inscribirme al concurso PGN 2026
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Operado por la Universidad de Antioquia. Todo el proceso es 100% en línea.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {estado && <BannerEstado estado={estado} />}

        {/* Links oficiales destacados */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <a
            href={CONCURSO_PGN_2026.sitiosOficiales.operador}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              textAlign: 'center',
              padding: '0.75rem 1rem',
            }}
          >
            🎓 Portal Operador (UdeA) ↗
          </a>
          <a
            href={CONCURSO_PGN_2026.sitiosOficiales.procuraduria}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              textAlign: 'center',
              padding: '0.75rem 1rem',
            }}
          >
            🏛️ Sitio oficial PGN ↗
          </a>
        </div>

        {/* Pasos */}
        <div style={{ marginBottom: '1.5rem' }}>
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
            Proceso paso a paso
          </p>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            {PASOS_INSCRIPCION.map((paso) => (
              <li
                key={paso.numero}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  padding: '0.875rem',
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-ia)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                  }}
                >
                  {paso.numero}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
                    {paso.titulo}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.375rem' }}>
                    {paso.detalle}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-cta-hover)',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    💡 {paso.tip}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips clave */}
        <div>
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
            Tips críticos del proceso
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '0.625rem',
            }}
          >
            {TIPS_CLAVE.map((tip) => (
              <div
                key={tip.titulo}
                style={{
                  display: 'flex',
                  gap: '0.625rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{tip.icono}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.125rem' }}>
                    {tip.titulo}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {tip.detalle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
