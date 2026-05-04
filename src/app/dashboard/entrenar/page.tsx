'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TipoUno from '@/components/features/preguntas/TipoUno';
import TipoDos from '@/components/features/preguntas/TipoDos';
import TipoTres from '@/components/features/preguntas/TipoTres';
import LikertComportamental from '@/components/features/preguntas/LikertComportamental';
import TipsRecordatorios from '@/components/dashboard/TipsRecordatorios';
import BloqueoSinDiagnostico from '@/components/dashboard/BloqueoSinDiagnostico';
import type {
  PreguntaGenerada,
  PreguntaTipoI,
  PreguntaTipoII,
  PreguntaTipoIII,
  PreguntaComportamental,
} from '@/types';
import {
  obtenerContextoUsuarioAutenticado,
  guardarRespuestaEntrenamiento,
  type ContextoUsuarioBucle,
} from './actions';
import { tieneRespuestasDiagnostico } from '@/app/dashboard/diagnostico/actions';

// ============================================================
// V4 — Bucle Diario ("Entrenar Hoy")
//
// Directivas_Agentes_V4.md §1, §4 y §5:
//   · Cero banco estático. Cada pregunta proviene del orquestador
//     (RAG pgvector + fallback Tavily + Anthropic tool_use).
//   · Contexto hiperpersonalizado (cargo_aspira + progreso_sm2).
//   · Lenguaje institucional. Sin emojis de premio. Sin "racha".
//   · Modal bloqueante al fallar con cita normativa exacta.
//   · REGLA 4: si el orquestador devuelve 503, se corta la sesión y se
//     muestra la frase literal de rechazo (no se inventa contenido).
// ============================================================

const TOTAL_PREGUNTAS_SESION = 10;
const TIPO_SESION = 'bucle_diario' as const;

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

type Fase = 'cargando' | 'evaluacion' | 'completado' | 'rechazo';

interface RespuestaRegistrada {
  id: string;
  correcta: boolean;
  nivel: 1 | 2 | 3;
  modulo: string;
}

export default function EntrenarPageWrapper() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 560, margin: '4rem auto', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Cargando…
        </div>
      }
    >
      <EntrenarPage />
    </Suspense>
  );
}

function EntrenarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Filtro opcional por módulo: /dashboard/entrenar?modulo=disciplinario
  // Cuando viene, el orquestador genera SOLO preguntas de ese módulo.
  const moduloFiltro = searchParams.get('modulo') ?? null;

  // Gate: el bucle requiere haber hecho el diagnóstico inicial.
  // null = aún cargando · true/false = decidido.
  const [tieneDiagInicial, setTieneDiagInicial] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelado = false;
    void tieneRespuestasDiagnostico()
      .then((r) => {
        if (!cancelado) setTieneDiagInicial(r.tiene);
      })
      .catch(() => {
        if (!cancelado) setTieneDiagInicial(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const [fase, setFase] = useState<Fase>('cargando');
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [nivelDificultad, setNivelDificultad] = useState<1 | 2 | 3>(1);
  const [aciertosConsecutivos, setAciertosConsecutivos] = useState(0);
  const [fallosConsecutivos, setFallosConsecutivos] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<string | number | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ explicacion: string; norma: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeRechazo, setMensajeRechazo] = useState<string | null>(null);

  const [respuestas, setRespuestas] = useState<RespuestaRegistrada[]>([]);
  const [duracionMin, setDuracionMin] = useState<number>(0);

  // Timings: lazy init evita react-hooks/purity
  const [startTime] = useState<number>(() => Date.now());
  const startTimeRef = useRef<number>(startTime);

  // Contexto auth-aware del usuario (H6.b · Directivas V4 §1).
  // Default neutro: el server action sustituye estos valores tras leer
  // public.usuarios + sm2_repetition para el aspirante autenticado.
  const [ctxUsuario, setCtxUsuario] = useState<ContextoUsuarioBucle>({
    user_id: 'bucle-diario',
    cargo_aspira: 'aspirante PGN',
    profesion: 'no_declarada',
    progreso_sm2: { dominio_alto: [], dominio_medio: [], brechas: [] },
    dias_hasta_concurso: 180,
    indice_preparacion_actual: 0,
  });
  const [ctxListo, setCtxListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void obtenerContextoUsuarioAutenticado()
      .then((ctx) => {
        if (!cancelado) {
          setCtxUsuario(ctx);
          setCtxListo(true);
        }
      })
      .catch((err) => {
        console.warn('[Bucle Diario] No se pudo cargar contexto auth:', err);
        if (!cancelado) setCtxListo(true); // seguimos con el fallback
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // ------------------------------------------------------------
  // Orquestador V4 — una pregunta por llamada
  // ------------------------------------------------------------
  const fetchPregunta = useCallback(
    async (indice: number, respuestaAnterior?: boolean) => {
      setCargando(true);
      setSelectedAnswer(undefined);
      setShowResult(false);
      inicioRespuestaRef.current = Date.now();

      try {
        const res = await fetch('/api/orquestador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // H6.b: el lead_id es el id del usuario autenticado, lo que
            // mantiene el caché LRU del orquestador segregado por aspirante.
            // Si no hay sesión aún (primer render), usamos el placeholder.
            lead_id: ctxUsuario.user_id,
            pregunta_actual: indice,
            nivel_actual: nivelDificultad,
            aciertos_consecutivos: aciertosConsecutivos,
            fallos_consecutivos: fallosConsecutivos,
            respuesta_anterior: respuestaAnterior,
            total_objetivo: TOTAL_PREGUNTAS_SESION,
            tipo_sesion: TIPO_SESION,
            // Filtro por módulo (?modulo=disciplinario) — el orquestador
            // genera preguntas solo de ese tema cuando viene presente.
            ...(moduloFiltro ? { modulo_filtro: moduloFiltro } : {}),
            // Hiper-personalización V4: cargo + perfil + buckets SM-2 +
            // dias_hasta_concurso. El orquestador valida con
            // ContextoUsuarioSchema y rellena cualquier campo opcional.
            contexto_usuario: {
              cargo_aspira: ctxUsuario.cargo_aspira,
              profesion: ctxUsuario.profesion,
              progreso_sm2: ctxUsuario.progreso_sm2,
              dias_hasta_concurso: ctxUsuario.dias_hasta_concurso,
              indice_preparacion_actual: ctxUsuario.indice_preparacion_actual,
            },
          }),
        });

        if (res.status === 503) {
          const data = (await res.json()) as OrquestadorRechazo;
          setMensajeRechazo(data.mensaje);
          setFase('rechazo');
          return;
        }

        if (!res.ok) {
          throw new Error(`Orquestador HTTP ${res.status}`);
        }

        const data = (await res.json()) as OrquestadorResp;

        if ('completado' in data && data.completado === true) {
          setDuracionMin(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000)));
          setFase('completado');
          return;
        }

        if ('error_controlado' in data) {
          setMensajeRechazo(data.mensaje);
          setFase('rechazo');
          return;
        }

        const ok = data as OrquestadorOk;
        setPregunta(ok.pregunta);
        setNivelDificultad(ok.nivel_dificultad);
        setFase('evaluacion');
      } catch (error) {
        console.error('[Bucle Diario] Error orquestador:', error);
        setMensajeRechazo(
          'No fue posible contactar al orquestador. Reintente en unos segundos.'
        );
        setFase('rechazo');
      } finally {
        setCargando(false);
      }
    },
    [
      nivelDificultad,
      aciertosConsecutivos,
      fallosConsecutivos,
      moduloFiltro,
      ctxUsuario.user_id,
      ctxUsuario.cargo_aspira,
      ctxUsuario.profesion,
      ctxUsuario.progreso_sm2,
      ctxUsuario.dias_hasta_concurso,
      ctxUsuario.indice_preparacion_actual,
    ]
  );

  // Pedir la primera pregunta una vez tengamos el contexto auth-aware.
  // Sin gatear en `ctxListo`, la primera llamada saldría con
  // lead_id='bucle-diario' y cargo_aspira por defecto, contaminando el LRU
  // del orquestador. queueMicrotask evita setState síncrono dentro del
  // efecto (regla react-hooks/set-state-in-effect).
  const primerFetchHechoRef = useRef(false);
  // 0 = aún sin inicializar; lazy init en el primer fetchPregunta.
  const inicioRespuestaRef = useRef<number>(0);
  useEffect(() => {
    if (!ctxListo || primerFetchHechoRef.current) return;
    primerFetchHechoRef.current = true;
    queueMicrotask(() => {
      void fetchPregunta(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxListo]);

  // ------------------------------------------------------------
  // Respuesta del usuario
  // ------------------------------------------------------------
  const handleAnswer = useCallback(
    (respuesta: string | number) => {
      if (showResult || !pregunta) return;

      const tiempoMs = Date.now() - inicioRespuestaRef.current;
      setSelectedAnswer(respuesta);
      setShowResult(true);

      const esComportamental = pregunta.estructura.tipo === 'comportamental';
      const correcta = esComportamental
        ? true
        : (pregunta.estructura as { correcta_id: string }).correcta_id === respuesta;

      setRespuestas((prev) => [
        ...prev,
        { id: pregunta.id, correcta, nivel: nivelDificultad, modulo: pregunta.modulo },
      ]);

      // Persistir en BD para que el dashboard de diagnóstico vea el progreso
      void guardarRespuestaEntrenamiento({
        preguntaId: pregunta.id,
        respuesta: String(respuesta),
        correcta,
        tiempoMs,
        modulo: pregunta.modulo,
      });

      if (correcta) {
        setAciertosConsecutivos((a) => a + 1);
        setFallosConsecutivos(0);
      } else {
        setFallosConsecutivos((f) => f + 1);
        setAciertosConsecutivos(0);

        // MODAL BLOQUEANTE con cita normativa (Directivas V4 §4).
        setTimeout(() => {
          setModalData({
            explicacion: pregunta.explicacion,
            norma: pregunta.norma_relacionada,
          });
          setShowModal(true);
        }, 600);
      }
    },
    [showResult, pregunta, nivelDificultad]
  );

  const handleNext = () => {
    const ultima = respuestas[respuestas.length - 1];
    const siguiente = preguntaIdx + 1;
    setPreguntaIdx(siguiente);
    if (siguiente >= TOTAL_PREGUNTAS_SESION) {
      setDuracionMin(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000)));
      setFase('completado');
      return;
    }
    fetchPregunta(siguiente, ultima?.correcta);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  // ------------------------------------------------------------
  // Métricas de la sesión (solo se calculan en la pantalla final)
  // ------------------------------------------------------------
  const aciertos = respuestas.filter((r) => r.correcta).length;
  const totalRespondidas = respuestas.length;
  const tasaAcierto = totalRespondidas > 0 ? Math.round((aciertos / totalRespondidas) * 100) : 0;

  // ============================================================
  // GATE · Diagnóstico inicial requerido
  // ============================================================
  if (tieneDiagInicial === false) {
    return <BloqueoSinDiagnostico seccion="entrenar" />;
  }

  // ============================================================
  // FASE 1 · CARGA INICIAL (incluye espera del check de diagnóstico)
  // ============================================================
  if (tieneDiagInicial === null || (fase === 'cargando' && !pregunta)) {
    return (
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '4rem 1rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        Preparando la sesión diaria con el orquestador V4…
      </div>
    );
  }

  // ============================================================
  // FASE 4 · RECHAZO LITERAL (REGLA 4 V4)
  // ============================================================
  if (fase === 'rechazo') {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-dominio-brecha)',
            marginBottom: '1rem',
          }}
        >
          Sesión interrumpida
        </p>
        <p
          style={{
            fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            marginBottom: '2rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {mensajeRechazo ??
            'No se encuentra jurisprudencia o norma verificada para esta consulta. No puedo especular.'}
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => router.push('/dashboard')}
          style={{ marginRight: '0.5rem' }}
        >
          Volver al Dashboard
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            setMensajeRechazo(null);
            setPreguntaIdx(0);
            setRespuestas([]);
            setAciertosConsecutivos(0);
            setFallosConsecutivos(0);
            setFase('cargando');
            fetchPregunta(0);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ============================================================
  // FASE 3 · SESIÓN COMPLETA
  // ============================================================
  if (fase === 'completado') {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '2rem 0',
        }}
      >
        <div className="card animate-fade-in-up" style={{ padding: '2.5rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            Competencia demostrada · Bucle Diario
          </p>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Sesión completada
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Avance registrado en su Índice de Preparación.
          </p>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ia)' }}>
                {aciertos}/{totalRespondidas}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Aciertos
              </p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color:
                    tasaAcierto >= 65
                      ? 'var(--color-dominio-alto)'
                      : 'var(--color-dominio-brecha)',
                }}
              >
                {tasaAcierto}%
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Tasa de acierto
              </p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-cta-hover)' }}>
                {duracionMin}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Minutos invertidos
              </p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-dominio-alto)' }}>
                {nivelDificultad}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Nivel alcanzado
              </p>
            </div>
          </div>

          {/* Tips clave del módulo practicado */}
          <TipsRecordatorios
            modulo={moduloFiltro ?? undefined}
            modulosDebiles={ctxUsuario.progreso_sm2.brechas}
          />

          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%' }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FASE 2 · EVALUACIÓN
  // ============================================================
  if (!pregunta) {
    // Estado intermedio mientras se carga la siguiente pregunta.
    return (
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '4rem 1rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        Generando siguiente pregunta…
      </div>
    );
  }

  const progresoPct = Math.round((preguntaIdx / TOTAL_PREGUNTAS_SESION) * 100);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/dashboard')}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          >
            Salir
          </button>
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
            }}
          >
            {preguntaIdx + 1} / {TOTAL_PREGUNTAS_SESION}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-ia)',
                color: 'var(--color-ia)',
              }}
            >
              Nivel {nivelDificultad}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-dominio-alto)',
              }}
            >
              {aciertos}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-dominio-brecha)',
              }}
            >
              {totalRespondidas - aciertos}
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progresoPct}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <span
            style={{
              padding: '0.25rem 0.625rem',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            {pregunta.tema}
          </span>
          <span
            style={{
              padding: '0.25rem 0.625rem',
              backgroundColor: 'var(--color-ia-light)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-ia)',
            }}
          >
            {pregunta.estructura.tipo === 'comportamental'
              ? 'Comportamental'
              : pregunta.estructura.tipo.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Render question by type */}
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

        {/* Feedback inline sin emojis, con cita normativa serif */}
        {showResult &&
          pregunta.estructura.tipo !== 'comportamental' &&
          (() => {
            const correcta_id = (pregunta.estructura as { correcta_id: string }).correcta_id;
            const esCorrecta = correcta_id === selectedAnswer;

            return esCorrecta ? (
              <div
                className="animate-fade-in-up"
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    fontSize: '0.9375rem',
                    color: 'var(--color-dominio-alto)',
                  }}
                >
                  Respuesta correcta
                </p>
                <blockquote
                  style={{
                    fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: 'var(--color-text-primary)',
                    borderLeft: '3px solid var(--color-dominio-alto)',
                    paddingLeft: '0.75rem',
                    margin: 0,
                  }}
                >
                  {pregunta.explicacion}
                </blockquote>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-ia)',
                    fontWeight: 600,
                    marginTop: '0.625rem',
                  }}
                >
                  {pregunta.norma_relacionada}
                </p>
              </div>
            ) : (
              <div
                className="animate-fade-in-up"
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'var(--color-dominio-brecha)',
                  }}
                >
                  Respuesta incorrecta — revise la explicación en el modal
                </p>
              </div>
            );
          })()}

        {/* Next button */}
        {((showResult && !showModal) ||
          (pregunta.estructura.tipo === 'comportamental' && selectedAnswer !== undefined)) && (
          <button
            className="btn btn-primary btn-lg animate-fade-in"
            onClick={handleNext}
            disabled={cargando}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {preguntaIdx + 1 >= TOTAL_PREGUNTAS_SESION
              ? 'Finalizar sesión'
              : cargando
                ? 'Cargando siguiente…'
                : 'Siguiente pregunta'}
          </button>
        )}
      </div>

      {/* ============ MODAL BLOQUEANTE ============ */}
      {showModal && modalData && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in-up">
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-dominio-brecha)',
                marginBottom: '0.5rem',
                textAlign: 'center',
              }}
            >
              Respuesta incorrecta
            </p>
            <h3
              style={{
                fontSize: '1.125rem',
                textAlign: 'center',
                marginBottom: '0.375rem',
                color: 'var(--color-text-primary)',
              }}
            >
              Lea la base normativa antes de continuar
            </h3>
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              La próxima repetición se programará según algoritmo SM-2.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <blockquote
                style={{
                  fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'var(--color-text-primary)',
                  borderLeft: '3px solid var(--color-cta, #facc15)',
                  paddingLeft: '0.75rem',
                  margin: 0,
                  marginBottom: '0.75rem',
                }}
              >
                {modalData.explicacion}
              </blockquote>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-ia-light)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-ia)',
                    lineHeight: 1.5,
                  }}
                >
                  {modalData.norma}
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={closeModal}
              style={{ width: '100%' }}
            >
              Entendido, continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
