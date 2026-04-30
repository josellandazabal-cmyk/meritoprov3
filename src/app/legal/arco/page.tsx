'use client';

import type { Metadata } from 'next';
import { useState } from 'react';

const EMAIL_DATOS = 'datos@meritopro.co';

export default function ArcoPage() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    // En producción esto POST a /api/arco que crea un ticket en Supabase
    // y envía notificación interna. Por ahora, generamos un mailto.
    const nombre = data.get('nombre') as string;
    const email = data.get('email') as string;
    const cedula = data.get('cedula') as string;
    const derecho = data.get('derecho') as string;
    const detalle = data.get('detalle') as string;

    const subject = encodeURIComponent(`Solicitud ARCO [${derecho}] — ${nombre}`);
    const body = encodeURIComponent(
      `Nombre: ${nombre}\nEmail: ${email}\nCédula: ${cedula}\nDerecho solicitado: ${derecho}\n\nDetalle:\n${detalle}`
    );

    window.location.href = `mailto:${EMAIL_DATOS}?subject=${subject}&body=${body}`;

    // Simulamos que se envió (en prod el POST confirmaría)
    setTimeout(() => {
      setEnviado(true);
      setEnviando(false);
    }, 500);
  }

  return (
    <article style={articleStyle}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={h1Style}>Ejercicio de Derechos ARCO</h1>
        <p style={introStyle}>
          De conformidad con el artículo 8 de la Ley 1581 de 2012, usted tiene derecho a{' '}
          <strong>Acceder, Rectificar, Cancelar (Suprimir)</strong> y <strong>Oponerse</strong>{' '}
          al tratamiento de sus datos personales. Use este formulario para ejercer cualquiera de
          estos derechos.
        </p>
      </header>

      {/* Explicación de cada derecho */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={cardGrid}>
          <DerechoCard
            letra="A"
            titulo="Acceso"
            desc="Conocer qué datos personales suyos tenemos almacenados y cómo los tratamos."
          />
          <DerechoCard
            letra="R"
            titulo="Rectificación"
            desc="Solicitar la corrección de datos inexactos, incompletos o desactualizados."
          />
          <DerechoCard
            letra="C"
            titulo="Cancelación"
            desc="Solicitar la eliminación total de sus datos cuando no exista obligación legal de conservarlos."
          />
          <DerechoCard
            letra="O"
            titulo="Oposición"
            desc="Oponerse al tratamiento para finalidades específicas (ej.: remarketing, emails comerciales)."
          />
        </div>
      </section>

      {/* Formulario */}
      <section>
        <h2 style={h2Style}>Formulario de Solicitud</h2>

        {enviado ? (
          <div style={successBox}>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Solicitud registrada
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Su solicitud ha sido enviada a <strong>{EMAIL_DATOS}</strong>. Recibirá respuesta en un
              plazo máximo de <strong>10 días hábiles</strong> (consultas) o{' '}
              <strong>15 días hábiles</strong> (reclamos), conforme a los artículos 14 y 15 de la
              Ley 1581 de 2012.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div className="form-group">
              <label htmlFor="arco-nombre" className="form-label">Nombre completo</label>
              <input id="arco-nombre" name="nombre" type="text" className="form-input" required placeholder="Como aparece en su documento de identidad" />
            </div>

            <div className="form-group">
              <label htmlFor="arco-email" className="form-label">Correo electrónico registrado en MéritoPro</label>
              <input id="arco-email" name="email" type="email" className="form-input" required placeholder="El correo con que se registró" />
            </div>

            <div className="form-group">
              <label htmlFor="arco-cedula" className="form-label">Número de cédula de ciudadanía</label>
              <input id="arco-cedula" name="cedula" type="text" className="form-input" required placeholder="Para verificar su identidad" />
            </div>

            <div className="form-group">
              <label htmlFor="arco-derecho" className="form-label">Derecho que desea ejercer</label>
              <select id="arco-derecho" name="derecho" className="form-input" required defaultValue="">
                <option value="" disabled>Seleccione un derecho</option>
                <option value="Acceso">Acceso — Quiero conocer mis datos</option>
                <option value="Rectificación">Rectificación — Quiero corregir mis datos</option>
                <option value="Cancelación">Cancelación — Quiero eliminar mis datos</option>
                <option value="Oposición">Oposición — No quiero que usen mis datos para X finalidad</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="arco-detalle" className="form-label">Detalle de su solicitud</label>
              <textarea
                id="arco-detalle"
                name="detalle"
                className="form-input"
                required
                rows={4}
                placeholder="Describa qué datos desea consultar, corregir o eliminar, o a qué finalidad se opone."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={enviando}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {enviando ? 'Enviando...' : 'Enviar Solicitud ARCO'}
            </button>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
              También puede enviar su solicitud directamente a{' '}
              <strong>{EMAIL_DATOS}</strong>
            </p>
          </form>
        )}
      </section>

      {/* Info de plazos */}
      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={h2Style}>Plazos Legales</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tipo de solicitud</th>
              <th style={thStyle}>Plazo de respuesta</th>
              <th style={thStyle}>Fundamento legal</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Consulta de datos</td><td style={tdStyle}>10 días hábiles (prorrogable 5 más)</td><td style={tdStyle}>Art. 14, Ley 1581/2012</td></tr>
            <tr><td style={tdStyle}>Reclamo (rectificación, supresión, oposición)</td><td style={tdStyle}>15 días hábiles (prorrogable 8 más)</td><td style={tdStyle}>Art. 15, Ley 1581/2012</td></tr>
            <tr><td style={tdStyle}>Eliminación total de datos (sin obligación legal de retención)</td><td style={tdStyle}>15 días hábiles</td><td style={tdStyle}>Art. 17, literal e), Ley 1581/2012</td></tr>
          </tbody>
        </table>
      </section>

      {/* Procedimiento de Borrado */}
      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={h2Style}>Procedimiento de Borrado de Datos</h2>
        <p style={bodyStyle}>
          Cuando usted solicita la <strong>cancelación (supresión)</strong> de sus datos:
        </p>
        <ol style={listStyle}>
          <li>Verificamos su identidad comparando nombre, email y cédula contra nuestros registros.</li>
          <li>Evaluamos si existe obligación legal de conservar algún dato (ej.: facturación DIAN = 5 años).</li>
          <li>Eliminamos de forma irreversible todos los datos que no tengan retención obligatoria:
            <ul style={{ ...listStyle, marginTop: '0.25rem' }}>
              <li>Perfil de usuario y datos de cuenta.</li>
              <li>Historial de respuestas y métricas SM-2.</li>
              <li>Chat ID de Telegram.</li>
              <li>Leads y datos del formulario de captura.</li>
            </ul>
          </li>
          <li>Le notificamos por correo la confirmación de la eliminación.</li>
          <li>Los datos con retención obligatoria se marcan como «supresión pendiente» y se eliminan automáticamente al vencer el plazo legal.</li>
        </ol>
      </section>
    </article>
  );
}

/* ───── Subcomponentes ───── */

function DerechoCard({ letra, titulo, desc }: { letra: string; titulo: string; desc: string }) {
  return (
    <div style={derechoCardStyle}>
      <div style={letraStyle}>{letra}</div>
      <div>
        <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{titulo}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ───── Estilos ───── */

const articleStyle: React.CSSProperties = { maxWidth: 680, margin: '0 auto', lineHeight: 1.75 };
const h1Style: React.CSSProperties = { fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' };
const h2Style: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' };
const introStyle: React.CSSProperties = { fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 };
const bodyStyle: React.CSSProperties = { fontSize: '0.9375rem', color: 'var(--color-text-primary)' };
const listStyle: React.CSSProperties = { paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9375rem' };

const formStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '1rem',
  padding: '1.5rem', backgroundColor: 'var(--color-bg-white)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
};

const successBox: React.CSSProperties = {
  padding: '1.5rem', backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)',
};

const cardGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem',
};

const derechoCardStyle: React.CSSProperties = {
  display: 'flex', gap: '1rem', padding: '1rem 1.25rem',
  backgroundColor: 'var(--color-bg-white)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
};

const letraStyle: React.CSSProperties = {
  flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-ia-light)', color: 'var(--color-ia)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: '1.125rem',
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.875rem' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.625rem 0.75rem', borderBottom: '2px solid var(--color-border)', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' };
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)' };

const linkStyle: React.CSSProperties = { color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' };
