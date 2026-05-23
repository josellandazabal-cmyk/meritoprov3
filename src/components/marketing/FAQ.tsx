'use client';

import { useState } from 'react';

// ============================================================
// FAQ — Sección de preguntas frecuentes
//
// Ataca las 8 objeciones más comunes detectadas en el análisis de
// buyer personas (ver Plan_de_Marketing_MeritoPro.md §4 y §17).
// Implementación accordion con estado local; aria-expanded para a11y.
// ============================================================

interface QA {
  q: string;
  a: string;
}

const PREGUNTAS: QA[] = [
  {
    q: '¿Qué incluye exactamente el plan?',
    a: 'Diagnóstico oficial de 40 preguntas, acceso a 4.500+ preguntas Tipo I, II, III y comportamentales generadas con corpus legal verificado, algoritmo SM-2 que decide qué repasar cada día, bucle diario por Telegram, métrica semanal de probabilidad de aprobar y citación normativa exacta en cada explicación. Acceso desde la compra hasta 30 días después del examen.',
  },
  {
    q: '¿Cuánto tiempo necesito al día?',
    a: '30 minutos al día son suficientes con el bucle diario. La metodología (Active Recall + repetición espaciada SM-2) está diseñada para que estudies poco pero retengas mucho — evidencia académica documentada muestra reducción de 60 % en tiempo de retención frente a estudio pasivo con PDFs.',
  },
  {
    q: '¿La inteligencia artificial puede inventar respuestas?',
    a: 'No. Cada explicación cita la norma exacta (Ley, Decreto o Sentencia con artículo y numeral). Si el sistema no encuentra base normativa verificada, se detiene y te lo dice — no especula. Esto es REGLA 4 de nuestras Directivas y está auditada en cada respuesta por un schema técnico que rechaza preguntas sin cita válida.',
  },
  {
    q: '¿Cómo funciona la Doble Garantía?',
    a: 'Garantía 1: 7 días para devolución total del 100 %, sin formularios. Garantía 2: si entrenas con disciplina (≥ 70 % de las sesiones diarias), te presentas al examen y NO clasificas en la lista de elegibles publicada por la PGN, te entregamos un código de 50 % de descuento canjeable una sola vez en cualquier curso del Marketplace, válido por 12 meses. Las condiciones completas están en /garantia.',
  },
  {
    q: '¿Es una suscripción que se cobra mes a mes?',
    a: 'No. Es un pago único. El acceso se mantiene desde la compra hasta 30 días después del examen oficial — sin cargos automáticos, sin renovaciones. Después del examen, el Marketplace te muestra otros concursos relevantes con descuento si quieres prepararte para uno nuevo.',
  },
  {
    q: '¿Puedo pagar a cuotas?',
    a: 'Sí. Tienes dos opciones: pago único de COP 297.000, o tres cuotas de COP 109.000 vía PSE o efectivo (no requiere tarjeta de crédito).',
  },
  {
    q: '¿Qué pasa si no soy bueno con la tecnología?',
    a: 'Si usas WhatsApp, usas MéritoPro. La interfaz es muy simple y el bucle diario te llega por Telegram al horario que tú elijas — sin abrir la app. Si necesitas ayuda, soporte por correo y chat directo.',
  },
  {
    q: '¿Mi información personal está protegida?',
    a: 'Sí. Cumplimos con la Ley 1581 de 2012 (Habeas Data Colombia). Solo capturamos los datos necesarios para personalizar tu preparación. Puedes consultar, modificar o pedir el borrado de tus datos en cualquier momento desde /legal/arco o escribiendo a soporte. Nunca compartimos información con terceros para fines comerciales.',
  },
];

export default function FAQ() {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <section
      id="faq"
      style={{
        padding: '4rem 0',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div className="container-narrow">
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-cta)',
            textAlign: 'center',
            marginBottom: '0.75rem',
          }}
        >
          Preguntas frecuentes
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '2.5rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Lo que más nos preguntan
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {PREGUNTAS.map((p, i) => {
            const open = abierto === i;
            return (
              <div
                key={i}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-white)',
                  overflow: 'hidden',
                  transition: 'border-color 200ms ease',
                  borderColor: open ? 'var(--color-cta)' : 'var(--color-border)',
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setAbierto(open ? null : i)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span>{p.q}</span>
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      fontSize: '1.25rem',
                      color: 'var(--color-cta)',
                      transform: open ? 'rotate(45deg)' : 'rotate(0)',
                      transition: 'transform 200ms ease',
                    }}
                  >
                    +
                  </span>
                </button>
                {open && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.25rem',
                      fontSize: '0.9375rem',
                      lineHeight: 1.7,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {p.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          ¿Tienes otra pregunta? Escríbenos a{' '}
          <a
            href="mailto:soporte@meritoprocol.com"
            style={{ color: 'var(--color-ia)', fontWeight: 600 }}
          >
            soporte@meritoprocol.com
          </a>
        </p>
      </div>
    </section>
  );
}
