'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TipoUno from '@/components/features/preguntas/TipoUno';
import TipoDos from '@/components/features/preguntas/TipoDos';
import TipoTres from '@/components/features/preguntas/TipoTres';
import LikertComportamental from '@/components/features/preguntas/LikertComportamental';
import type { PreguntaGenerada } from '@/types';

// ============================================================
// Sesión de entrenamiento diario — "Entrenar Hoy"
// SM-2: preguntas con next_review_date <= hoy + 5 nuevas intercaladas
// ============================================================

// Demo questions for training session
const SESION_PREGUNTAS: PreguntaGenerada[] = [
  {
    id: 'train-001',
    modulo: 'eje_disciplinario',
    tema: 'Faltas disciplinarias',
    estructura: {
      tipo: 'tipo_I',
      enunciado:
        'Según la Ley 1952 de 2019 (Código General Disciplinario), ¿cuál de las siguientes conductas constituye una falta gravísima para un servidor público?',
      opciones: [
        { id: 'A', texto: 'Llegar 10 minutos tarde al trabajo de forma reiterada' },
        { id: 'B', texto: 'Realizar actividades de proselitismo político durante la jornada laboral' },
        { id: 'C', texto: 'No portar el carnet institucional dentro de las instalaciones' },
        { id: 'D', texto: 'Omitir la firma del libro de asistencia en un día' },
      ],
      correcta_id: 'B',
    },
    explicacion:
      'El proselitismo político durante la jornada laboral es una falta gravísima. Las demás conductas pueden constituir faltas leves. Las faltas gravísimas están taxativamente señaladas en el artículo 62 de la Ley 1952 de 2019.',
    norma_relacionada: 'Ley 1952 de 2019, Art. 62, numeral 39',
  },
  {
    id: 'train-002',
    modulo: 'normas_servicio_publico',
    tema: 'Constitución Política',
    estructura: {
      tipo: 'tipo_III',
      afirmacion:
        'Los servidores públicos están al servicio del Estado y de la comunidad, y deben ejercer sus funciones en la forma prevista por la Constitución, la ley y el reglamento.',
      razon:
        'La Constitución establece que no existirá empleo público que no tenga funciones detalladas en ley o reglamento.',
      opciones: [
        { id: 'A', texto: 'Afirmación es VERDADERA, Razón es VERDADERA y Razón EXPLICA la Afirmación.' },
        { id: 'B', texto: 'Afirmación es VERDADERA, Razón es VERDADERA pero Razón NO explica la Afirmación.' },
        { id: 'C', texto: 'Afirmación es VERDADERA, Razón es FALSA.' },
        { id: 'D', texto: 'Afirmación es FALSA, Razón es VERDADERA.' },
        { id: 'E', texto: 'Afirmación es FALSA, Razón es FALSA.' },
      ],
      correcta_id: 'A',
    },
    explicacion:
      'Ambas proposiciones son verdaderas y están directamente relacionadas. El artículo 122 de la Constitución establece que no habrá empleo sin funciones detalladas, lo cual explica por qué los servidores deben ejercer en la forma prevista por la Constitución y la ley (Art. 123).',
    norma_relacionada: 'Constitución Política 1991, Arts. 122 y 123',
  },
  {
    id: 'train-003',
    modulo: 'gestion_documental',
    tema: 'Tablas de Retención',
    estructura: {
      tipo: 'tipo_II',
      enunciado:
        'Respecto a las Tablas de Retención Documental (TRD) aplicables en la Procuraduría General de la Nación, considere las siguientes afirmaciones:',
      afirmaciones: [
        { id: 1, texto: 'Las TRD determinan los tiempos de retención de los documentos en las fases de archivo de gestión y archivo central.' },
        { id: 2, texto: 'Las TRD deben ser aprobadas por el Comité Institucional de Gestión y Desempeño de la entidad.' },
        { id: 3, texto: 'Las TRD solo aplican para documentos generados en formato papel, no para documentos electrónicos.' },
        { id: 4, texto: 'El Archivo General de la Nación no tiene potestad para aprobar o desaprobar las TRD de las entidades.' },
      ],
      opciones: [
        { id: 'A', texto: 'Si 1 y 2 son correctas' },
        { id: 'B', texto: 'Si 1 y 3 son correctas' },
        { id: 'C', texto: 'Si 2 y 4 son correctas' },
        { id: 'D', texto: 'Si 1, 2 y 3 son correctas' },
      ],
      correcta_id: 'A',
    },
    explicacion:
      'Las TRD definen los tiempos de retención en las diferentes fases del ciclo documental y deben ser aprobadas por el comité institucional. Las TRD aplican tanto a documentos físicos como electrónicos, y el AGN tiene competencia para convalidar las TRD.',
    norma_relacionada: 'Ley 594 de 2000, Art. 24; Acuerdo 004 de 2019 AGN',
  },
  {
    id: 'train-004',
    modulo: 'comportamental',
    tema: 'Orientación al ciudadano',
    estructura: {
      tipo: 'comportamental',
      enunciado_situacional:
        'Un ciudadano llega a la oficina visiblemente alterado y comienza a alzar la voz porque considera que su caso no avanza. Usted tiene varias tareas urgentes. ¿Con qué frecuencia usted detiene sus actividades, escucha activamente al ciudadano y busca una solución dentro de su competencia, incluso si eso implica extender su jornada?',
      competencia_evaluada: 'Orientación al ciudadano',
      escala: 'frecuencia',
    },
    explicacion:
      'Esta pregunta evalúa la competencia transversal de Orientación al Ciudadano, fundamental para el servicio público. Se valora la disposición a priorizar la atención del ciudadano.',
    norma_relacionada: 'Decreto 1083 de 2015 — Competencias Transversales',
  },
  {
    id: 'train-005',
    modulo: 'eje_disciplinario',
    tema: 'Proceso Disciplinario',
    estructura: {
      tipo: 'tipo_I',
      enunciado:
        'En el proceso disciplinario verbal regulado por la Ley 1952 de 2019, ¿cuál es el término máximo que tiene el funcionario para dictar el fallo de primera instancia después de finalizada la audiencia?',
      opciones: [
        { id: 'A', texto: '5 días hábiles' },
        { id: 'B', texto: '10 días hábiles' },
        { id: 'C', texto: 'Debe dictarse en la misma audiencia' },
        { id: 'D', texto: '30 días calendario' },
      ],
      correcta_id: 'C',
    },
    explicacion:
      'En el procedimiento verbal, el fallo de primera instancia debe proferirse al finalizar la audiencia, de forma oral. Esta es una de las características fundamentales que distingue al procedimiento verbal del ordinario en materia disciplinaria.',
    norma_relacionada: 'Ley 1952 de 2019, Art. 244',
  },
];

export default function EntrenarPage() {
  const router = useRouter();
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ explicacion: string; norma: string } | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const preguntaActual = SESION_PREGUNTAS[preguntaIdx];
  const progreso = Math.round(((preguntaIdx) / SESION_PREGUNTAS.length) * 100);

  const handleAnswer = useCallback((respuesta: string | number) => {
    if (showResult) return;

    setSelectedAnswer(respuesta);
    setShowResult(true);
    setTotalRespondidas((t) => t + 1);

    const esComportamental = preguntaActual.estructura.tipo === 'comportamental';

    if (esComportamental) {
      // Behavioral questions — always count
      setAciertos((a) => a + 1);
      return;
    }

    const correcta_id = (preguntaActual.estructura as { correcta_id: string }).correcta_id;
    const esCorrecta = correcta_id === respuesta;

    if (esCorrecta) {
      setAciertos((a) => a + 1);
    } else {
      // MODAL BLOQUEANTE — CLAUDE.md: "Al fallar pregunta: Muestra modal bloqueante
      // con explicacion y norma_relacionada. Cero avance hasta cerrar modal."
      setTimeout(() => {
        setModalData({
          explicacion: preguntaActual.explicacion,
          norma: preguntaActual.norma_relacionada,
        });
        setShowModal(true);
      }, 800);
    }
  }, [showResult, preguntaActual]);

  const handleNext = () => {
    if (preguntaIdx + 1 >= SESION_PREGUNTAS.length) {
      setSessionComplete(true);
      return;
    }

    setPreguntaIdx((i) => i + 1);
    setSelectedAnswer(undefined);
    setShowResult(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  // ============ SESSION COMPLETE ============
  if (sessionComplete) {
    const duracionMin = Math.round((Date.now() - startTime) / 60000);
    const tasaAcierto = totalRespondidas > 0 ? Math.round((aciertos / totalRespondidas) * 100) : 0;

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
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            ¡Sesión Completada!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Has completado tu entrenamiento de hoy
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
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Correctas</p>
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
                  color: tasaAcierto >= 65 ? 'var(--color-dominio-alto)' : 'var(--color-dominio-brecha)',
                }}
              >
                {tasaAcierto}%
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tasa acierto</p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-cta-hover)' }}>
                {duracionMin || '< 1'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Minutos</p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-dominio-alto)' }}>
                4
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Días racha 🔥</p>
            </div>
          </div>

          {/* Probability update */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              📊 Probabilidad de aprobar: 42% → <span style={{ color: 'var(--color-dominio-alto)' }}>44%</span> (+2%)
            </p>
          </div>

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

  // ============ TRAINING SESSION ============
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Progress Header */}
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
            ← Salir
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {preguntaIdx + 1} / {SESION_PREGUNTAS.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-dominio-alto)' }}>
              ✓ {aciertos}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-dominio-brecha)' }}>
              ✗ {totalRespondidas - aciertos}
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
            {preguntaActual.tema}
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
            {preguntaActual.estructura.tipo === 'comportamental'
              ? 'Comportamental'
              : preguntaActual.estructura.tipo.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Render question by type */}
        {preguntaActual.estructura.tipo === 'tipo_I' && (
          <TipoUno
            pregunta={preguntaActual.estructura}
            onAnswer={handleAnswer}
            selectedId={selectedAnswer as string}
            showResult={showResult}
          />
        )}
        {preguntaActual.estructura.tipo === 'tipo_II' && (
          <TipoDos
            pregunta={preguntaActual.estructura}
            onAnswer={handleAnswer}
            selectedId={selectedAnswer as string}
            showResult={showResult}
          />
        )}
        {preguntaActual.estructura.tipo === 'tipo_III' && (
          <TipoTres
            pregunta={preguntaActual.estructura}
            onAnswer={handleAnswer}
            selectedId={selectedAnswer as string}
            showResult={showResult}
          />
        )}
        {preguntaActual.estructura.tipo === 'comportamental' && (
          <LikertComportamental
            pregunta={preguntaActual.estructura}
            onAnswer={handleAnswer}
            selectedValue={selectedAnswer as number}
          />
        )}

        {/* Correct answer inline feedback */}
        {showResult && preguntaActual.estructura.tipo !== 'comportamental' && (
          (() => {
            const correcta_id = (preguntaActual.estructura as { correcta_id: string }).correcta_id;
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
                <p style={{ fontWeight: 700, marginBottom: '0.375rem', fontSize: '0.9375rem' }}>
                  ✅ ¡Correcto!
                </p>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                  {preguntaActual.explicacion}
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-ia)',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                  }}
                >
                  📜 {preguntaActual.norma_relacionada}
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
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-dominio-brecha)' }}>
                  ❌ Incorrecto — Revisa la explicación en el modal
                </p>
              </div>
            );
          })()
        )}

        {/* Next button */}
        {((showResult && !showModal) || (preguntaActual.estructura.tipo === 'comportamental' && selectedAnswer !== undefined)) && (
          <button
            className="btn btn-primary btn-lg animate-fade-in"
            onClick={handleNext}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {preguntaIdx + 1 >= SESION_PREGUNTAS.length
              ? 'Finalizar Sesión'
              : 'Siguiente →'}
          </button>
        )}
      </div>

      {/* ============ MODAL BLOQUEANTE ============ */}
      {showModal && modalData && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && undefined}>
          <div className="modal-content animate-fade-in-up">
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📚</span>
            </div>

            <h3
              style={{
                fontSize: '1.25rem',
                textAlign: 'center',
                marginBottom: '0.375rem',
                color: 'var(--color-dominio-brecha)',
              }}
            >
              Respuesta Incorrecta
            </h3>
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              Lee la explicación antes de continuar
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.75rem',
                }}
              >
                {modalData.explicacion}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-ia-light)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ flexShrink: 0 }}>📜</span>
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
              Entendido, continuar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
