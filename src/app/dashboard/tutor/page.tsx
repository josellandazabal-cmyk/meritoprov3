'use client';

import { useState, useRef, useEffect } from 'react';

// ============================================================
// /dashboard/tutor — Chat con el Tutor IA (Agente 1)
//
// Llama a /api/tutor (RAG sobre corpus_legal + Tavily fallback +
// Claude 3.5 Sonnet con SYSTEM_PROMPT_TUTOR_V4). Si no hay base
// normativa, el endpoint devuelve la frase de rechazo literal
// (Directivas V4 §1 REGLA 4).
// ============================================================

interface Mensaje {
  rol: 'user' | 'tutor';
  texto: string;
  fuente?: 'corpus' | 'tavily' | 'rechazo';
}

const MENSAJE_INICIAL: Mensaje = {
  rol: 'tutor',
  texto:
    'Hola, soy tu Tutor IA especialista en normatividad de la PGN. Puedes preguntarme sobre cualquier tema del concurso: derecho disciplinario, constitucional, gestión documental, y más. ¿En qué puedo ayudarte hoy?',
};

export default function TutorPage() {
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo cuando llega un mensaje nuevo
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversacion, enviando]);

  const handleSend = async () => {
    const userMsg = mensaje.trim();
    if (!userMsg || enviando) return;

    setError(null);
    setConversacion((prev) => [...prev, { rol: 'user', texto: userMsg }]);
    setMensaje('');
    setEnviando(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userMsg }),
      });

      if (res.status === 401) {
        setError('Sesión expirada. Recarga la página e inicia sesión.');
        setEnviando(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ??
            'No se pudo contactar al tutor. Intenta de nuevo.'
        );
        setEnviando(false);
        return;
      }

      const data = (await res.json()) as {
        respuesta: string;
        fuente: 'corpus' | 'tavily' | 'rechazo';
      };

      setConversacion((prev) => [
        ...prev,
        { rol: 'tutor', texto: data.respuesta, fuente: data.fuente },
      ]);
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
      }}
    >
      <div className="animate-fade-in-up">
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Tutor Virtual 🤖
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          Tu experto en normatividad PGN — Pregunta lo que necesites
        </p>
      </div>

      {/* Chat area */}
      <div
        ref={chatRef}
        className="card"
        style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {conversacion.map((msg, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{
              display: 'flex',
              justifyContent: msg.rol === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius:
                  msg.rol === 'user'
                    ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                    : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                backgroundColor:
                  msg.rol === 'user' ? 'var(--color-ia)' : 'var(--color-bg-primary)',
                color: msg.rol === 'user' ? 'white' : 'var(--color-text-primary)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.rol === 'tutor' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.375rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>🤖</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ia)' }}>
                    Tutor PGN
                  </span>
                  {msg.fuente === 'tavily' && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      · fuente web verificada
                    </span>
                  )}
                </div>
              )}
              {msg.texto}
            </div>
          </div>
        ))}

        {enviando && (
          <div
            className="animate-fade-in"
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-muted)',
                fontSize: '0.9375rem',
                fontStyle: 'italic',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem',
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>🤖</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ia)' }}>
                  Tutor PGN
                </span>
              </div>
              Consultando corpus normativo…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '0.75rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Escribe tu pregunta..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={enviando}
          style={{ flex: 1, opacity: enviando ? 0.6 : 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => void handleSend()}
          disabled={!mensaje.trim() || enviando}
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
