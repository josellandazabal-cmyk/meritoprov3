import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos · MéritoPro',
  description:
    'Política de privacidad y tratamiento de datos personales de MéritoPro. Ley 1581 de 2012 (Habeas Data) y Decreto 1377 de 2013.',
};

const FECHA_VIGENCIA = '30 de abril de 2026';
const RAZON_SOCIAL = 'MéritoPro S.A.S.';
const NIT_PLACEHOLDER = '[NIT por registrar]';
const DOMICILIO = 'Bogotá, D.C., República de Colombia';
const EMAIL_DATOS = 'datos@meritopro.co';
const EMAIL_LEGAL = 'legal@meritopro.co';

export default function PrivacidadPage() {
  return (
    <article style={articleStyle}>
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={metaStyle}>Última actualización: {FECHA_VIGENCIA}</p>
        <h1 style={h1Style}>Política de Privacidad y Tratamiento de Datos Personales</h1>
        <p style={introStyle}>
          {RAZON_SOCIAL}, identificada con NIT {NIT_PLACEHOLDER}, con domicilio en {DOMICILIO}
          {' '}(en adelante, «el Responsable»), en cumplimiento de la Ley Estatutaria 1581 de 2012
          y su Decreto Reglamentario 1377 de 2013, presenta la siguiente Política de Tratamiento
          de Datos Personales.
        </p>
      </header>

      <Section n={1} titulo="Marco Legal">
        <p>Esta Política se fundamenta en:</p>
        <ul style={listStyle}>
          <li><strong>Constitución Política de Colombia, Art. 15:</strong> Derecho fundamental a la intimidad y al habeas data.</li>
          <li><strong>Ley Estatutaria 1581 de 2012:</strong> Régimen General de Protección de Datos Personales.</li>
          <li><strong>Decreto 1377 de 2013:</strong> Reglamenta parcialmente la Ley 1581.</li>
          <li><strong>Decreto 1074 de 2015, Título 26:</strong> Decreto Único Reglamentario del Sector Comercio, Industria y Turismo (compilación).</li>
          <li><strong>Circular Única de la SIC, Título V:</strong> Instrucciones sobre tratamiento de datos personales.</li>
        </ul>
      </Section>

      <Section n={2} titulo="Responsable del Tratamiento">
        <table style={tableStyle}>
          <tbody>
            <tr><td style={tdLabel}>Razón social</td><td>{RAZON_SOCIAL}</td></tr>
            <tr><td style={tdLabel}>NIT</td><td>{NIT_PLACEHOLDER}</td></tr>
            <tr><td style={tdLabel}>Domicilio</td><td>{DOMICILIO}</td></tr>
            <tr><td style={tdLabel}>Correo para datos personales</td><td>{EMAIL_DATOS}</td></tr>
            <tr><td style={tdLabel}>Correo legal</td><td>{EMAIL_LEGAL}</td></tr>
            <tr><td style={tdLabel}>Sitio web</td><td>https://meritopro.co</td></tr>
          </tbody>
        </table>
      </Section>

      <Section n={3} titulo="Datos Personales que Recopilamos">
        <h3 style={h3Style}>3.1. Datos proporcionados directamente por el Usuario</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Dato</th>
              <th style={thStyle}>Finalidad</th>
              <th style={thStyle}>Base legal</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Nombre completo</td><td>Identificación, personalización del servicio</td><td>Consentimiento (Art. 9, Ley 1581)</td></tr>
            <tr><td>Correo electrónico</td><td>Comunicaciones transaccionales y comerciales</td><td>Consentimiento + ejecución contractual</td></tr>
            <tr><td>Número de celular</td><td>Soporte, verificación</td><td>Consentimiento</td></tr>
            <tr><td>Cargo al que aspira</td><td>Personalización del diagnóstico y plan de estudio</td><td>Consentimiento + ejecución contractual</td></tr>
            <tr><td>Profesión / nivel educativo</td><td>Adaptación del contenido al perfil académico</td><td>Consentimiento</td></tr>
            <tr><td>ID de chat de Telegram</td><td>Envío de notificaciones de repaso (SM-2)</td><td>Consentimiento explícito</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>3.2. Datos generados por el uso de la Plataforma</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Dato</th>
              <th style={thStyle}>Finalidad</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Respuestas al diagnóstico y sesiones de entrenamiento</td><td>Cálculo de probabilidad de aprobar, algoritmo SM-2</td></tr>
            <tr><td>Historial de sesiones completadas</td><td>Verificación de elegibilidad para la Garantía de Resultado</td></tr>
            <tr><td>Índice de preparación (probabilidad_aprobar_actual)</td><td>Personalización del plan de estudio</td></tr>
            <tr><td>Logs de interacción con el Tutor IA</td><td>Mejora del servicio, depuración técnica</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>3.3. Datos sensibles</h3>
        <p>
          MéritoPro <strong>no recopila datos sensibles</strong> en los términos del artículo 5 de la
          Ley 1581 de 2012 (origen racial/étnico, orientación política, convicciones religiosas,
          datos biométricos, datos de salud, orientación sexual).
        </p>
      </Section>

      <Section n={4} titulo="Finalidades del Tratamiento">
        <h3 style={h3Style}>4.1. Finalidades necesarias para la ejecución del contrato</h3>
        <ol style={listStyle}>
          <li>Crear y administrar la cuenta del Usuario.</li>
          <li>Generar el diagnóstico personalizado y el plan de preparación.</li>
          <li>Operar el algoritmo de repetición espaciada (SM-2).</li>
          <li>Procesar pagos a través de la pasarela Wompi.</li>
          <li>Emitir factura electrónica conforme a la normativa DIAN.</li>
          <li>Atender solicitudes de soporte, reembolsos y garantías.</li>
        </ol>

        <h3 style={h3Style}>4.2. Finalidades con base en el consentimiento</h3>
        <ol style={listStyle}>
          <li>Enviar correos electrónicos con contenido educativo y ofertas comerciales (remarketing).</li>
          <li>Enviar notificaciones de repaso por Telegram.</li>
          <li>Analizar métricas agregadas de uso para mejorar la Plataforma.</li>
          <li>Realizar estudios de mercado y perfilar al Usuario para recomendar concursos del Marketplace.</li>
        </ol>
        <p style={{ marginTop: '0.75rem' }}>
          El Usuario puede revocar el consentimiento para las finalidades del numeral 4.2 en cualquier
          momento sin afectar el acceso al servicio, mediante los canales indicados en la cláusula 7.
        </p>
      </Section>

      <Section n={5} titulo="Encargados del Tratamiento y Transferencias">
        <p>
          Los datos personales pueden ser tratados por los siguientes encargados, todos con
          estándares equivalentes o superiores de protección de datos:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Servicio</th>
              <th style={thStyle}>Ubicación</th>
              <th style={thStyle}>Datos compartidos</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Supabase Inc.</td><td>Base de datos y autenticación</td><td>EE. UU. (AWS us-east-1)</td><td>Todos los datos de la cuenta</td></tr>
            <tr><td>Anthropic PBC</td><td>Generación de contenido (IA)</td><td>EE. UU.</td><td>Preguntas y respuestas (sin identificadores directos)</td></tr>
            <tr><td>Wompi (Bancolombia)</td><td>Procesamiento de pagos</td><td>Colombia</td><td>Email, nombre, monto de la transacción</td></tr>
            <tr><td>Resend Inc.</td><td>Envío de correo electrónico</td><td>EE. UU.</td><td>Email, nombre</td></tr>
            <tr><td>Telegram Messenger Inc.</td><td>Notificaciones de repaso</td><td>Emiratos Árabes</td><td>Chat ID (voluntario)</td></tr>
            <tr><td>Vercel Inc.</td><td>Hosting y CDN</td><td>EE. UU.</td><td>Logs de acceso (IP, user agent)</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '0.75rem' }}>
          Las transferencias internacionales se realizan conforme al artículo 26 de la Ley 1581 de
          2012 y la Circular Única de la SIC, considerando que los proveedores cumplen con
          estándares de protección adecuados o cuentan con cláusulas contractuales equivalentes.
        </p>
      </Section>

      <Section n={6} titulo="Conservación de los Datos">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tipo de dato</th>
              <th style={thStyle}>Período de conservación</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Datos de cuenta (Suscriptor activo)</td><td>Mientras dure la relación contractual + 5 años</td></tr>
            <tr><td>Datos de Lead (no convertido)</td><td>12 meses desde la captura, luego anonimización</td></tr>
            <tr><td>Historial de respuestas y métricas SM-2</td><td>Duración del contrato + 1 año</td></tr>
            <tr><td>Datos de facturación</td><td>5 años (obligación tributaria DIAN, Art. 632 E.T.)</td></tr>
            <tr><td>Logs técnicos</td><td>90 días</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '0.75rem' }}>
          Cumplido el período de conservación, los datos serán suprimidos de forma segura o
          anonimizados de manera irreversible para fines estadísticos.
        </p>
      </Section>

      <Section n={7} titulo="Derechos ARCO del Titular">
        <p>
          De conformidad con el artículo 8 de la Ley 1581 de 2012, el Titular tiene derecho a:
        </p>
        <ul style={listStyle}>
          <li><strong>A — Acceso:</strong> Conocer los datos personales que el Responsable tiene almacenados.</li>
          <li><strong>R — Rectificación:</strong> Solicitar la corrección de datos inexactos, incompletos o desactualizados.</li>
          <li><strong>C — Cancelación (Supresión):</strong> Solicitar la eliminación de sus datos cuando no exista obligación legal de conservarlos.</li>
          <li><strong>O — Oposición:</strong> Oponerse al tratamiento de sus datos para finalidades específicas (ej.: remarketing).</li>
        </ul>
        <p style={{ marginTop: '0.75rem' }}>
          Puede ejercer estos derechos a través del formulario en{' '}
          <a href="/legal/arco" style={linkStyle}>/legal/arco</a> o enviando un correo a{' '}
          <strong>{EMAIL_DATOS}</strong>.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          MéritoPro responderá las consultas en un plazo máximo de <strong>10 días hábiles</strong> y
          los reclamos en un plazo máximo de <strong>15 días hábiles</strong>, conforme a los
          artículos 14 y 15 de la Ley 1581 de 2012.
        </p>
      </Section>

      <Section n={8} titulo="Medidas de Seguridad">
        <p>MéritoPro implementa las siguientes medidas técnicas y organizativas:</p>
        <ul style={listStyle}>
          <li>Cifrado en tránsito (TLS 1.3) y en reposo (AES-256 en Supabase).</li>
          <li>Autenticación con tokens JWT de corta duración + refresh tokens.</li>
          <li>Row Level Security (RLS) en base de datos: cada usuario accede solo a sus datos.</li>
          <li>Validación de firma SHA-256 en webhooks de pago (anti-tampering).</li>
          <li>Comparación timing-safe para evitar ataques de canal lateral.</li>
          <li>Acceso a datos de producción restringido al personal autorizado.</li>
          <li>Revisiones periódicas de seguridad y dependencias.</li>
        </ul>
      </Section>

      <Section n={9} titulo="Datos de Menores de Edad">
        <p>
          La Plataforma está dirigida exclusivamente a personas <strong>mayores de 18 años</strong>.
          MéritoPro no recopila intencionalmente datos de menores de edad. Si se detecta que un
          menor ha proporcionado datos personales, estos serán eliminados de inmediato conforme
          al artículo 7 de la Ley 1581 de 2012.
        </p>
      </Section>

      <Section n={10} titulo="Autoridad de Control">
        <p>
          La autoridad competente para la vigilancia del tratamiento de datos personales en Colombia
          es la <strong>Superintendencia de Industria y Comercio (SIC)</strong>, Delegatura para la
          Protección de Datos Personales.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Página web:{' '}
          <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            www.sic.gov.co
          </a>
        </p>
      </Section>

      <Section n={11} titulo="Modificaciones a esta Política">
        <p>
          El Responsable se reserva el derecho de modificar esta Política en cualquier momento.
          Las modificaciones serán comunicadas al Titular por correo electrónico y publicadas en
          la Plataforma con al menos 10 días de anticipación.
        </p>
      </Section>

      <Section n={12} titulo="Contacto del Oficial de Protección de Datos">
        <p>
          <strong>Email:</strong> {EMAIL_DATOS}<br />
          <strong>Dirección:</strong> {DOMICILIO}<br />
          <strong>Horario de atención:</strong> Lunes a viernes, 8:00 a.m. - 5:00 p.m. (hora Colombia, UTC-5)
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
      <h2 style={h2Style}>
        {n}. {titulo}
      </h2>
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

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.875rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.625rem 0.75rem', borderBottom: '2px solid var(--color-border)',
  fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
};
const tdLabel: React.CSSProperties = {
  fontWeight: 600, padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap', color: 'var(--color-text-secondary)',
};
