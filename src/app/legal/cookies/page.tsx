import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies · MéritoPro',
  description:
    'Información sobre las cookies utilizadas por MéritoPro, incluyendo Meta Pixel y Google Analytics 4.',
};

const FECHA_VIGENCIA = '30 de abril de 2026';
const EMAIL_DATOS = 'datos@meritopro.co';

export default function CookiesPage() {
  return (
    <article style={articleStyle}>
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={metaStyle}>Última actualización: {FECHA_VIGENCIA}</p>
        <h1 style={h1Style}>Política de Cookies</h1>
        <p style={introStyle}>
          Esta política explica qué cookies utiliza la plataforma MéritoPro, para qué sirven y
          cómo puede gestionarlas. Es un complemento de nuestra{' '}
          <a href="/legal/privacidad" style={linkStyle}>Política de Privacidad</a>.
        </p>
      </header>

      <Section n={1} titulo="¿Qué son las cookies?">
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computador,
          tableta o celular) cuando visita un sitio web. Permiten que el sitio recuerde sus acciones
          y preferencias durante un período de tiempo determinado.
        </p>
      </Section>

      <Section n={2} titulo="Cookies que utilizamos">
        <h3 style={h3Style}>2.1. Cookies estrictamente necesarias</h3>
        <p>
          Estas cookies son esenciales para el funcionamiento de la Plataforma. No requieren
          consentimiento previo conforme a la normativa colombiana.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Cookie</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Finalidad</th>
              <th style={thStyle}>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>sb-*-auth-token</td><td style={tdStyle}>Supabase</td><td style={tdStyle}>Autenticación de sesión del usuario</td><td style={tdStyle}>1 hora (refresh: 7 días)</td></tr>
            <tr><td style={tdStyle}>__vercel_*</td><td style={tdStyle}>Vercel</td><td style={tdStyle}>Protección contra CSRF y enrutamiento</td><td style={tdStyle}>Sesión</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>2.2. Cookies de análisis y rendimiento</h3>
        <p>
          Estas cookies nos ayudan a entender cómo los usuarios interactúan con la Plataforma.
          Se activan <strong>solo con su consentimiento</strong>.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Cookie</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Finalidad</th>
              <th style={thStyle}>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>_ga, _ga_*</td><td style={tdStyle}>Google Analytics 4</td><td style={tdStyle}>Análisis de tráfico y comportamiento agregado</td><td style={tdStyle}>2 años</td></tr>
            <tr><td style={tdStyle}>_gid</td><td style={tdStyle}>Google Analytics 4</td><td style={tdStyle}>Distinguir usuarios únicos</td><td style={tdStyle}>24 horas</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>2.3. Cookies de publicidad y remarketing</h3>
        <p>
          Estas cookies permiten mostrar anuncios relevantes en plataformas de terceros.
          Se activan <strong>solo con su consentimiento</strong>.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Cookie</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Finalidad</th>
              <th style={thStyle}>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>_fbp</td><td style={tdStyle}>Meta Pixel</td><td style={tdStyle}>Seguimiento de conversiones y audiencias</td><td style={tdStyle}>3 meses</td></tr>
            <tr><td style={tdStyle}>_fbc</td><td style={tdStyle}>Meta Pixel</td><td style={tdStyle}>Atribución de clics desde Facebook/Instagram</td><td style={tdStyle}>3 meses</td></tr>
            <tr><td style={tdStyle}>fr</td><td style={tdStyle}>Meta</td><td style={tdStyle}>Entrega de publicidad y medición</td><td style={tdStyle}>3 meses</td></tr>
          </tbody>
        </table>
      </Section>

      <Section n={3} titulo="Base Legal">
        <ul style={listStyle}>
          <li>
            <strong>Cookies necesarias:</strong> Legítimo interés del responsable (ejecución del contrato y seguridad del servicio).
          </li>
          <li>
            <strong>Cookies de análisis y publicidad:</strong> Consentimiento previo, informado, expreso e inequívoco del Usuario
            (Art. 9, Ley 1581 de 2012; Art. 3, numeral 2, Ley 1266 de 2008).
          </li>
        </ul>
      </Section>

      <Section n={4} titulo="Cómo Gestionar las Cookies">
        <h3 style={h3Style}>4.1. Banner de cookies</h3>
        <p>
          Al acceder a la Plataforma por primera vez, se mostrará un banner que permite aceptar o
          rechazar las cookies no esenciales. Puede modificar su elección en cualquier momento desde
          la configuración de cookies accesible en el pie de página de la Plataforma.
        </p>

        <h3 style={h3Style}>4.2. Configuración del navegador</h3>
        <p>
          También puede gestionar las cookies desde la configuración de su navegador. Tenga en cuenta
          que bloquear cookies esenciales puede afectar el funcionamiento de la Plataforma.
        </p>
        <ul style={listStyle}>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={linkStyle}>Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" style={linkStyle}>Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/es-co/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={linkStyle}>Safari</a></li>
          <li><a href="https://support.microsoft.com/es-co/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" style={linkStyle}>Microsoft Edge</a></li>
        </ul>

        <h3 style={h3Style}>4.3. Opt-out de terceros</h3>
        <ul style={listStyle}>
          <li><strong>Google Analytics:</strong> Instale el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={linkStyle}>complemento de inhabilitación de GA</a>.</li>
          <li><strong>Meta Pixel:</strong> Ajuste sus <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>preferencias de anuncios en Facebook</a>.</li>
        </ul>
      </Section>

      <Section n={5} titulo="Transferencia Internacional de Datos vía Cookies">
        <p>
          Las cookies de Google y Meta implican la transferencia de datos a servidores ubicados en
          Estados Unidos. Esta transferencia se realiza bajo las cláusulas contractuales de estos
          proveedores y con su consentimiento previo, conforme a lo dispuesto en el artículo 26 de
          la Ley 1581 de 2012.
        </p>
      </Section>

      <Section n={6} titulo="Actualizaciones">
        <p>
          Esta política puede actualizarse periódicamente. Los cambios se reflejarán en esta página
          con la fecha de actualización correspondiente.
        </p>
      </Section>

      <Section n={7} titulo="Contacto">
        <p>
          Para cualquier consulta sobre el uso de cookies, escriba a{' '}
          <strong>{EMAIL_DATOS}</strong>.
        </p>
      </Section>
    </article>
  );
}

/* ───── Componente de sección ───── */

function Section({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '2.25rem' }}>
      <h2 style={h2Style}>{n}. {titulo}</h2>
      <div style={bodyStyle}>{children}</div>
    </section>
  );
}

/* ───── Estilos ───── */

const articleStyle: React.CSSProperties = { maxWidth: 680, margin: '0 auto', lineHeight: 1.75 };
const metaStyle: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' };
const h1Style: React.CSSProperties = { fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' };
const h2Style: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' };
const h3Style: React.CSSProperties = { fontSize: '1.0625rem', fontWeight: 600, marginTop: '1.25rem', marginBottom: '0.5rem' };
const introStyle: React.CSSProperties = { fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 };
const bodyStyle: React.CSSProperties = { fontSize: '0.9375rem', color: 'var(--color-text-primary)' };
const listStyle: React.CSSProperties = { paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' };
const linkStyle: React.CSSProperties = { color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.875rem' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.625rem 0.75rem', borderBottom: '2px solid var(--color-border)', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' };
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)' };
