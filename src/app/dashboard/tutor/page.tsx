'use client';

import { useState } from 'react';

export default function TutorPage() {
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState<Array<{ rol: 'user' | 'tutor'; texto: string }>>([
    {
      rol: 'tutor',
      texto: 'Hola, soy tu Tutor IA especialista en normatividad de la PGN. Puedes preguntarme sobre cualquier tema del concurso: derecho disciplinario, constitucional, gestión documental, y más. ¿En qué puedo ayudarte hoy?',
    },
  ]);

  const handleSend = () => {
    if (!mensaje.trim()) return;

    const userMsg = mensaje.trim();
    setConversacion((prev) => [...prev, { rol: 'user', texto: userMsg }]);
    setMensaje('');

    // Simulate tutor response (in production: Claude 3.5 Sonnet via API)
    setTimeout(() => {
      setConversacion((prev) => [
        ...prev,
        {
          rol: 'tutor',
          texto: `Excelente pregunta sobre "${userMsg.slice(0, 50)}...". En el contexto del concurso PGN 2026, esto se relaciona con la Ley 1952 de 2019 (Código General Disciplinario). Te recomiendo enfocarte en los artículos 62 y 63 que definen las faltas gravísimas y graves respectivamente.\n\n¿Quieres que te genere preguntas de práctica sobre este tema?`,
        },
      ]);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
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
                borderRadius: msg.rol === 'user'
                  ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                  : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                backgroundColor: msg.rol === 'user' ? 'var(--color-ia)' : 'var(--color-bg-primary)',
                color: msg.rol === 'user' ? 'white' : 'var(--color-text-primary)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.rol === 'tutor' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.75rem' }}>🤖</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ia)' }}>Tutor PGN</span>
                </div>
              )}
              {msg.texto}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Escribe tu pregunta..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!mensaje.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}
