'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import TipoUno from '@/components/features/preguntas/TipoUno';
import TipoDos from '@/components/features/preguntas/TipoDos';
import TipoTres from '@/components/features/preguntas/TipoTres';
import LikertComportamental from '@/components/features/preguntas/LikertComportamental';
import type {
  PreguntaGenerada,
  PreguntaTipoI,
  PreguntaTipoII,
  PreguntaTipoIII,
  PreguntaComportamental,
} from '@/types';
import {
  obtenerContextoLead,
  type ContextoUsuarioCliente,
} from './actions';
import { trackEvent } from '@/lib/analytics';

// ============================================================
// V4 — SIMULACRO OFICIAL DE NIVELACIÓN · UI Premium Pearson VUE
//
// Cumple Directivas_Agentes_V4.md §5:
//   · Pantalla Pre-Test con dashboard analítico.
//   · Lenguaje institucional (sin "quiz" / "juego" / emojis de premio).
//   · Reloj regresivo monoespaciado.
//   · Barra segmentada de 40 bloques.
//   · Etiqueta de nivel adaptativo visible.
//   · "Marcar para revisión" + sumario pre-envío.
//   · Tipografía serif para la cita normativa.
//   · Frase literal de rechazo cuando el orquestador no tiene base.
// ============================================================

const TOTAL_PREGUNTAS = 40;
const DURACION_SIMULACRO_MIN = 45;

const AREAS_EVALUACION = [
  'Derecho Constitucional',
  'Ley 1952 de 2019 — Código General Disciplinario',
  'Decreto Ley 262 de 2000 — Estructura PGN',
  'Funciones del Ministerio Público',
  'Derechos Fundamentales y acción de tutela',
  'Gestión Documental (Ley 594 de 2000)',
  'Carrera Administrativa (Ley 909 de 2004)',
  'Competencias Comportamentales',
];

// ------------------------------------------------------------
// Tipos locales
// ------------------------------------------------------------

interface Progreso {
  actual: number;
  total: number;
  porcentaje: number;
}

interface OrquestadorOk {
  completado: false;
  pregunta: PreguntaGenerada;
  progreso: Progreso;
  nivel_dificultad: 1 | 2 | 3;
  generado_por: string;
}

interface OrquestadorFin {
  completado: true;
}

interface OrquestadorRechazo {
  completado: false;
  error_controlado: true;
  mensaje: string;
}

type OrquestadorResp = OrquestadorOk | OrquestadorFin | OrquestadorRechazo;

interface RespuestaRegistrada {
  id: string;
  respuesta: string | number;
  correcta: boolean;
  tiempo_ms: number;
  nivel: 1 | 2 | 3;
  modulo: string;
}

type Fase = 'pretest' | 'evaluacion' | 'sumario' | 'completado' | 'rechazo';

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

function formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function etiquetaNivel(nivel: 1 | 2 | 3): string {
  if (nivel === 1) return 'Nivel I · Base';
  if (nivel === 2) return 'Nivel II · Intermedio';
  return 'Nivel III · Avanzado';
}

function colorNivel(nivel: 1 | 2 | 3): string {
  if (nivel === 1) return 'var(--color-dominio-alto, #22c55e)';
  if (nivel === 2) return 'var(--color-dominio-medio, #eab308)';
  return 'var(--color-dominio-brecha, #ef4444)';
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

export default function SimulacroPage() {
  const params = useParams();
  const leadId = params.lead_id as string;

  const [fase, setFase] = useState<Fase>('pretest');
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [progreso, setProgreso] = useState<Progreso>({
    actual: 0,
    total: TOTAL_PREGUNTAS,
    porcentaje: 0,
  });
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [nivelDificultad, setNivelDificultad] = useState<1 | 2 | 3>(1);
  const [aciertosConsecutivos, setAciertosConsecutivos] = useState(0);
  const [fallosConsecutivos, setFallosConsecutivos] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeRechazo, setMensajeRechazo] = useState<string | null>(null);
  const [marcadasRevision, setMarcadasRevision] = useState<Set<string>>(new Set());
  const [respuestas, setRespuestas] = useState<RespuestaRegistrada[]>([]);
  const [inicioRespuesta, setInicioRespuesta] = useState(0);

  const [tiempoRestante, setTiempoRestante] = useState(DURACION_SIMULACRO_MIN * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Contexto hiper-personalizado para el orquestador (Directivas V4 §1).
  // Default neutro hasta que el server action devuelva el cargo_aspira real.
  const [contextoUsuario, setContextoUsuario] = useState<ContextoUsuarioCliente>({
    cargo_aspira: 'aspirante PGN',
  });

  useEffect(() => {
    if (!leadId) return;
    let cancelado = false;
    void obtenerContextoLead(leadId)
      .then((ctx) => {
        if (!cancelado) setContextoUsuario(ctx);
      })
      .catch((err) => {
        console.warn('[Diagnóstico] obtenerContextoLead falló:', err);
      });
    // Disparamos el evento Lead del Pixel en el momento real de
    // conversión: cuando el aspirante llega al diagnóstico tras llenar
    // el form. queueMicrotask difiere para no chocar con react-hooks.
    // Usamos el nombre GA4 `generate_lead`; el helper unificado lo
    // traduce a `Lead` para Meta Pixel automáticamente.
    queueMicrotask(() => {
      trackEvent('generate_lead', {
        content_name: 'diagnostico_pgn',
        content_category: 'concurso_publico',
      });
    });
    return () => {
      cancelado = true;
    };
  }, [leadId]);

  // ---- Timer
  useEffect(() => {
    if (fase !== 'evaluacion') return;
    timerRef.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFase('sumario');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fase]);

  // ---- Fetch al orquestador V4
  const fetchPregunta = useCallback(
    async (indice: number, respuestaAnterior?: boolean) => {
      setCargando(true);
      setSelectedAnswer(undefined);
      setShowResult(false);
      setInicioRespuesta(Date.now());

      try {
        const res = await fetch('/api/orquestador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            pregunta_actual: indice,
            nivel_actual: nivelDificultad,
            aciertos_consecutivos: aciertosConsecutivos,
            fallos_consecutivos: fallosConsecutivos,
            respuesta_anterior: respuestaAnterior,
            // Hiper-personalización V4 §1: el orquestador necesita al menos
            // `cargo_aspira` para escoger normas relevantes y calibrar el
            // system prompt. Los demás campos (progreso_sm2,
            // indice_preparacion_actual, dias_hasta_concurso, nivel_educativo)
            // los rellena la Zod schema del backend con defaults seguros
            // mientras todavía no tenemos histórico SM-2 del aspirante.
            contexto_usuario: {
              cargo_aspira: contextoUsuario.cargo_aspira,
            },
          }),
        });

        if (res.status === 503) {
          const data = (await res.json()) as OrquestadorRechazo;
          setMensajeRechazo(data.mensaje);
          setFase('rechazo');
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        if (!res.ok) {
          throw new Error(`Orquestador respondió HTTP ${res.status}`);
        }

        const data = (await res.json()) as OrquestadorResp;

        if ('completado' in data && data.completado === true) {
          setFase('sumario');
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        if ('error_controlado' in data) {
          setMensajeRechazo(data.mensaje);
          setFase('rechazo');
          return;
        }

        const ok = data as OrquestadorOk;
        setPregunta(ok.pregunta);
        setProgreso(ok.progreso);
        setNivelDificultad(ok.nivel_dificultad);
      } catch (error) {
        console.error('[Diagnóstico] Error orquestador:', error);
        setMensajeRechazo(
          'No se pudo contactar al orquestador. Reintente en unos segundos.'
        );
        setFase('rechazo');
      } finally {
        setCargando(false);
      }
    },
    [
      leadId,
      nivelDificultad,
      aciertosConsecutivos,
      fallosConsecutivos,
      contextoUsuario.cargo_aspira,
    ]
  );

  // ---- Iniciar
  const iniciarSimulacro = () => {
    setFase('evaluacion');
    fetchPregunta(0);
  };

  // ---- Responder
  const handleAnswer = (respuesta: string | number) => {
    if (showResult || !pregunta) return;
    const tiempoMs = Date.now() - inicioRespuesta;
    setSelectedAnswer(respuesta);
    setShowResult(true);

    const esComportamental = pregunta.estructura.tipo === 'comportamental';
    const correcta = esComportamental
      ? true
      : (pregunta.estructura as { correcta_id: string }).correcta_id === respuesta;

    setRespuestas((prev) => [
      ...prev,
      {
        id: pregunta.id,
        respuesta,
        correcta,
        tiempo_ms: tiempoMs,
        nivel: nivelDificultad,
        modulo: pregunta.modulo,
      },
    ]);

    if (correcta) {
      setAciertosConsecutivos((a) => a + 1);
      setFallosConsecutivos(0);
    } else {
      setFallosConsecutivos((f) => f + 1);
      setAciertosConsecutivos(0);
    }
  };

  const handleNext = () => {
    const ultima = respuestas[respuestas.length - 1];
    const siguiente = preguntaActual + 1;
    setPreguntaActual(siguiente);
    if (siguiente >= TOTAL_PREGUNTAS) {
      setFase('sumario');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    fetchPregunta(siguiente, ultima?.correcta);
  };

  const toggleMarcarRevision = () => {
    if (!pregunta) return;
    setMarcadasRevision((prev) => {
      const next = new Set(prev);
      if (next.has(pregunta.id)) next.delete(pregunta.id);
      else next.add(pregunta.id);
      return next;
    });
  };

  // ---- Índice de preparación + agregados
  const stats = useMemo(() => {
    const total = respuestas.length;
    const aciertos = respuestas.filter((r) => r.correcta).length;
    const tiempoPromedioSeg = total
      ? Math.round(respuestas.reduce((a, r) => a + r.tiempo_ms, 0) / total / 1000)
      : 0;
    const porModulo: Record<string, { total: number; aciertos: number }> = {};
    for (const r of respuestas) {
      porModulo[r.modulo] = porModulo[r.modulo] ?? { total: 0, aciertos: 0 };
      porModulo[r.modulo].total += 1;
      if (r.correcta) porModulo[r.modulo].aciertos += 1;
    }
    // Índice de Preparación: excluir comportamentales (siempre correcta=true
    // por diseño) para no inflar el % artificialmente.
    const evaluables = respuestas.filter((r) => r.modulo !== 'comportamental');
    const aciertosEval = evaluables.filter((r) => r.correcta).length;
    const indice = evaluables.length
      ? Math.round((aciertosEval / evaluables.length) * 100)
      : 0;
    return { total, aciertos, indice, tiempoPromedioSeg, porModulo };
  }, [respuestas]);

  // ============================================================
  // PANTALLA 1 · PRE-TEST (dashboard analítico)
  // ============================================================
  if (fase === 'pretest') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
        <header
          style={{
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(15,23,42,0.95)',
          }}
        >
          <div
            className="container-wide"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Mérito<span style={{ color: 'var(--color-cta, #facc15)' }}>Pro</span>
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
              Simulacro Oficial de Nivelación · Concurso PGN 2026
            </span>
          </div>
        </header>

        <div className="container-narrow" style={{ padding: '3rem 1rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              border: '1px solid rgba(250,204,21,0.3)',
              backgroundColor: 'rgba(250,204,21,0.1)',
              borderRadius: '999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-cta, #facc15)',
              marginBottom: '1.5rem',
            }}
          >
            Procuraduría General de la Nación · Convocatoria 2026
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: '0.75rem',
              lineHeight: 1.2,
            }}
          >
            Evaluación de Nivelación
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              color: '#94a3b8',
              marginBottom: '2.5rem',
              maxWidth: '620px',
              lineHeight: 1.7,
            }}
          >
            Esta evaluación mide su nivel de preparación actual mediante un sistema
            de dificultad adaptativa sobre cuatro estructuras de pregunta oficiales
            (Tipo I, II, III y Comportamental). El resultado determinará su plan de
            estudio personalizado de aquí al día del concurso.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              { label: 'Preguntas', value: String(TOTAL_PREGUNTAS), sub: 'Tipo I, II, III y Comportamental' },
              { label: 'Duración', value: `${DURACION_SIMULACRO_MIN} min`, sub: 'Cronómetro regresivo' },
              { label: 'Dificultad', value: 'Adaptativa', sub: 'Tres niveles según desempeño' },
              { label: 'Áreas', value: String(AREAS_EVALUACION.length), sub: 'Del Decreto Ley 262/2000' },
            ].map((spec) => (
              <div
                key={spec.label}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.75rem',
                }}
              >
                <p
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--color-cta, #facc15)',
                    marginBottom: '0.125rem',
                  }}
                >
                  {spec.value}
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.125rem' }}>
                  {spec.label}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{spec.sub}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.75rem',
              marginBottom: '2.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              Áreas de conocimiento evaluadas
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {AREAS_EVALUACION.map((area, i) => (
                <div
                  key={area}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#cbd5e1',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--color-cta, #facc15)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {area}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(250,204,21,0.08)',
              border: '1px solid rgba(250,204,21,0.15)',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Una vez iniciada la evaluación, el cronómetro no se detendrá. Responda
              con la calma que emplearía en la prueba oficial. Las preguntas no se
              pueden repetir, pero sí marcar para revisión al final.
            </p>
          </div>

          <button
            onClick={iniciarSimulacro}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--color-cta, #facc15)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Iniciar evaluación
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // PANTALLA 2 · EVALUACIÓN (cronómetro + pregunta + barra segmentada)
  // ============================================================
  if (fase === 'evaluacion') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
        {/* Barra superior: reloj + nivel + progreso numérico */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(15,23,42,0.98)',
          }}
        >
          <div
            className="container-wide"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Mérito<span style={{ color: 'var(--color-cta, #facc15)' }}>Pro</span>
              </span>
              <span
                style={{
                  padding: '0.25rem 0.625rem',
                  border: `1px solid ${colorNivel(nivelDificultad)}`,
                  color: colorNivel(nivelDificultad),
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {etiquetaNivel(nivelDificultad)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                Pregunta <strong style={{ color: 'white' }}>{progreso.actual || preguntaActual + 1}</strong> de {TOTAL_PREGUNTAS}
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color:
                    tiempoRestante < 5 * 60
                      ? 'var(--color-dominio-brecha, #ef4444)'
                      : '#cbd5e1',
                }}
              >
                {formatearTiempo(tiempoRestante)}
              </span>
            </div>
          </div>

          {/* Barra segmentada de 40 bloques */}
          <div
            className="container-wide"
            style={{ display: 'flex', gap: '2px', marginTop: '0.75rem' }}
          >
            {Array.from({ length: TOTAL_PREGUNTAS }).map((_, i) => {
              const respondida = respuestas[i];
              let bg = 'rgba(255,255,255,0.08)';
              if (respondida) {
                bg = respondida.correcta
                  ? 'var(--color-dominio-alto, #22c55e)'
                  : 'var(--color-dominio-brecha, #ef4444)';
              } else if (i === preguntaActual) {
                bg = 'var(--color-cta, #facc15)';
              }
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '3px',
                    backgroundColor: bg,
                    borderRadius: '2px',
                    transition: 'background-color 150ms ease',
                  }}
                />
              );
            })}
          </div>
        </header>

        <main className="container-narrow" style={{ padding: '2rem 1rem 4rem' }}>
          {cargando || !pregunta ? (
            <div
              style={{
                padding: '4rem 1rem',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.9375rem',
              }}
            >
              Preparando siguiente pregunta…
            </div>
          ) : (
            <>
              {/* Encabezado de la pregunta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748b',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {pregunta.modulo.replaceAll('_', ' ')}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                    {pregunta.tema}
                  </p>
                </div>
                <button
                  onClick={toggleMarcarRevision}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: `1px solid ${
                      marcadasRevision.has(pregunta.id)
                        ? 'var(--color-cta, #facc15)'
                        : 'rgba(255,255,255,0.15)'
                    }`,
                    color: marcadasRevision.has(pregunta.id)
                      ? 'var(--color-cta, #facc15)'
                      : '#cbd5e1',
                    backgroundColor: 'transparent',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                  }}
                >
                  {marcadasRevision.has(pregunta.id)
                    ? 'Marcada para revisión'
                    : 'Marcar para revisión'}
                </button>
              </div>

              {/* Render por tipo */}
              {pregunta.estructura.tipo === 'tipo_I' && (
                <TipoUno
                  pregunta={pregunta.estructura as PreguntaTipoI}
                  onAnswer={handleAnswer}
                  selectedId={selectedAnswer as string | undefined}
                  showResult={showResult}
                />
              )}
              {pregunta.estructura.tipo === 'tipo_II' && (
                <TipoDos
                  pregunta={pregunta.estructura as PreguntaTipoII}
                  onAnswer={handleAnswer}
                  selectedId={selectedAnswer as string | undefined}
                  showResult={showResult}
                />
              )}
              {pregunta.estructura.tipo === 'tipo_III' && (
                <TipoTres
                  pregunta={pregunta.estructura as PreguntaTipoIII}
                  onAnswer={handleAnswer}
                  selectedId={selectedAnswer as string | undefined}
                  showResult={showResult}
                />
              )}
              {pregunta.estructura.tipo === 'comportamental' && (
                <LikertComportamental
                  pregunta={pregunta.estructura as PreguntaComportamental}
                  onAnswer={(n: number) => handleAnswer(n)}
                  selectedValue={selectedAnswer as number | undefined}
                />
              )}

              {/* Feedback + cita normativa (serif) */}
              {showResult && pregunta.estructura.tipo !== 'comportamental' && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#94a3b8',
                      marginBottom: '0.625rem',
                    }}
                  >
                    Base normativa
                  </p>
                  <blockquote
                    style={{
                      fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                      fontSize: '1rem',
                      color: '#e2e8f0',
                      lineHeight: 1.7,
                      borderLeft: '3px solid var(--color-cta, #facc15)',
                      paddingLeft: '0.875rem',
                      margin: 0,
                    }}
                  >
                    {pregunta.explicacion}
                  </blockquote>
                  <p
                    style={{
                      marginTop: '0.75rem',
                      fontSize: '0.8125rem',
                      color: '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {pregunta.norma_relacionada}
                  </p>
                </div>
              )}

              {/* Botón siguiente */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleNext}
                  disabled={
                    pregunta.estructura.tipo === 'comportamental'
                      ? selectedAnswer === undefined
                      : !showResult
                  }
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-cta, #facc15)',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor:
                      (pregunta.estructura.tipo === 'comportamental'
                        ? selectedAnswer === undefined
                        : !showResult)
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      (pregunta.estructura.tipo === 'comportamental'
                        ? selectedAnswer === undefined
                        : !showResult)
                        ? 0.5
                        : 1,
                  }}
                >
                  {preguntaActual + 1 >= TOTAL_PREGUNTAS
                    ? 'Finalizar y ver resultado'
                    : 'Siguiente pregunta'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // ============================================================
  // PANTALLA 3 · SUMARIO (resultado + hoja de ruta)
  // ============================================================
  if (fase === 'sumario') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
        <header
          style={{
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="container-wide"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Mérito<span style={{ color: 'var(--color-cta, #facc15)' }}>Pro</span>
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Resultado de la Evaluación
            </span>
          </div>
        </header>

        <div className="container-narrow" style={{ padding: '3rem 1rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              marginBottom: '0.75rem',
            }}
          >
            Competencia demostrada
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            {stats.indice}
            <span style={{ fontSize: '0.5em', color: '#64748b' }}> / 100</span>
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              color: '#94a3b8',
              marginBottom: '2rem',
              maxWidth: '540px',
              lineHeight: 1.6,
            }}
          >
            Índice de Preparación inicial. Se actualiza con cada bloque de estudio y
            repaso (SM-2). Su plan personalizado prioriza los módulos con menor dominio.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              { label: 'Respondidas', valor: `${stats.total} / ${TOTAL_PREGUNTAS}` },
              { label: 'Aciertos', valor: String(stats.aciertos) },
              { label: 'Tiempo medio', valor: `${stats.tiempoPromedioSeg} s` },
              { label: 'Marcadas', valor: String(marcadasRevision.size) },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  padding: '1rem 1.125rem',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.625rem',
                }}
              >
                <p style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.125rem' }}>
                  {k.valor}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Desempeño por módulo */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.875rem',
                color: '#e2e8f0',
              }}
            >
              Desempeño por módulo
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {Object.entries(stats.porModulo).map(([mod, v]) => {
                const pct = v.total ? Math.round((v.aciertos / v.total) * 100) : 0;
                const color =
                  pct >= 70
                    ? 'var(--color-dominio-alto, #22c55e)'
                    : pct >= 50
                      ? 'var(--color-dominio-medio, #eab308)'
                      : 'var(--color-dominio-brecha, #ef4444)';
                return (
                  <div key={mod}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: '#cbd5e1' }}>{mod.replaceAll('_', ' ')}</span>
                      <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Hoja de ruta + CTA sobrio */}
          <section
            style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(250,204,21,0.06)',
              border: '1px solid rgba(250,204,21,0.2)',
              borderRadius: '0.75rem',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-cta, #facc15)',
                marginBottom: '0.5rem',
              }}
            >
              Plan de estudio propuesto
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: '#e2e8f0',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              Con base en estos resultados, MéritoPro activa un plan de 30 minutos
              diarios con repasos programados (algoritmo SM-2) sobre sus módulos
              débiles y simulacros cronometrados. El primer salario del cargo al que
              aspira recupera la inversión del programa.
            </p>
            <button
              onClick={() => (window.location.href = `/dashboard`)}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: 'var(--color-cta, #facc15)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Activar mi plan de preparación
            </button>
          </section>
        </div>
      </div>
    );
  }

  // ============================================================
  // PANTALLA 4 · RECHAZO LITERAL (REGLA 4 V4)
  // ============================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '520px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-dominio-brecha, #ef4444)',
            marginBottom: '1rem',
          }}
        >
          Evaluación interrumpida
        </p>
        <p
          style={{
            fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: '#e2e8f0',
            marginBottom: '2rem',
          }}
        >
          {mensajeRechazo ??
            'No se encuentra jurisprudencia o norma verificada para esta consulta. No puedo especular.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.5rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
