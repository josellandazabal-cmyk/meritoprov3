import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones · MéritoPro',
  description:
    'Términos y condiciones de uso de la plataforma MéritoPro. Derechos, obligaciones y alcance del servicio.',
};

const FECHA_VIGENCIA = '30 de abril de 2026';
const RAZON_SOCIAL = 'MéritoPro S.A.S.';
const NIT_PLACEHOLDER = '[NIT por registrar]';
const DOMICILIO = 'Bogotá, D.C., República de Colombia';
const EMAIL_LEGAL = 'legal@meritopro.co';
const EMAIL_SOPORTE = 'soporte@meritopro.co';
const PRECIO_BETA = 'COP 297.000';

export default function TerminosPage() {
  return (
    <article style={articleStyle}>
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={metaStyle}>Última actualización: {FECHA_VIGENCIA}</p>
        <h1 style={h1Style}>Términos y Condiciones de Uso</h1>
        <p style={introStyle}>
          Al acceder o usar la plataforma MéritoPro (en adelante, «la Plataforma»), usted
          acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo, debe
          abstenerse de usar la Plataforma.
        </p>
      </header>

      <Section n={1} titulo="Identificación del Responsable">
        <p>
          <strong>Razón social:</strong> {RAZON_SOCIAL}<br />
          <strong>NIT:</strong> {NIT_PLACEHOLDER}<br />
          <strong>Domicilio:</strong> {DOMICILIO}<br />
          <strong>Correo electrónico:</strong> {EMAIL_LEGAL}<br />
          <strong>Sitio web:</strong> https://meritopro.co
        </p>
      </Section>

      <Section n={2} titulo="Definiciones">
        <ul style={listStyle}>
          <li><strong>Plataforma:</strong> la aplicación web accesible en meritopro.co, incluyendo todas sus funcionalidades, contenidos y servicios.</li>
          <li><strong>Usuario:</strong> persona natural que accede a la Plataforma, ya sea en modalidad gratuita (Lead) o de pago (Suscriptor).</li>
          <li><strong>Lead:</strong> persona que completa el formulario de captura y accede al diagnóstico gratuito sin pago.</li>
          <li><strong>Suscriptor:</strong> persona que adquiere el acceso al plan de preparación mediante pago único.</li>
          <li><strong>Diagnóstico:</strong> evaluación gratuita de 40 preguntas que mide el nivel de preparación del usuario.</li>
          <li><strong>Bucle Diario:</strong> sesión de 10 preguntas generadas por IA según el algoritmo de repetición espaciada SM-2.</li>
          <li><strong>Marketplace:</strong> catálogo de cursos de preparación para distintos concursos públicos disponibles en la Plataforma.</li>
          <li><strong>Corpus:</strong> base de conocimiento normativo verificado (leyes, decretos, resoluciones) sobre la cual opera la IA.</li>
        </ul>
      </Section>

      <Section n={3} titulo="Objeto del Servicio">
        <p>
          MéritoPro es una plataforma de preparación para concursos de méritos del sector público
          colombiano. El servicio consiste en:
        </p>
        <ol style={listStyle}>
          <li>Diagnóstico gratuito de nivel de preparación.</li>
          <li>Plan de entrenamiento personalizado con IA (post-pago).</li>
          <li>Bucle diario de preguntas basado en repetición espaciada (SM-2).</li>
          <li>Tutor IA con respuestas fundamentadas en normativa verificada.</li>
          <li>Notificaciones por Telegram y correo electrónico.</li>
        </ol>
      </Section>

      <Section n={4} titulo="Precio y Condiciones de Pago">
        <p>
          El acceso al plan de preparación tiene un precio de <strong>{PRECIO_BETA}</strong> (pesos
          colombianos), pagadero en un único pago. El precio incluye IVA cuando aplique conforme a
          la legislación tributaria vigente.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Los pagos se procesan a través de la pasarela <strong>Wompi</strong> (Bancolombia), que
          soporta PSE, tarjetas de crédito/débito, Nequi y Bancolombia. MéritoPro no almacena
          datos de tarjetas ni credenciales bancarias.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          El acceso se activa inmediatamente tras la confirmación del pago y permanece activo hasta
          <strong> 30 días calendario después de la fecha del examen</strong> del concurso
          correspondiente.
        </p>
      </Section>

      <Section n={5} titulo="Doble Garantía MéritoPro">
        <h3 style={h3Style}>5.1. Garantía de Satisfacción Inicial (7 días)</h3>
        <p>
          Si dentro de los primeros <strong>7 días corridos</strong> desde la compra el Suscriptor
          no está satisfecho con el servicio, podrá solicitar el reembolso del 100 % del valor pagado
          enviando un correo a <strong>{EMAIL_SOPORTE}</strong>. El reembolso se procesará en un
          plazo máximo de 5 días hábiles por el mismo medio de pago.
        </p>

        <h3 style={h3Style}>5.2. Garantía de Resultado (50 % uso único)</h3>
        <p>
          Si el Suscriptor entrena con disciplina (≥ 70 % de las sesiones diarias disponibles),
          se presenta al examen y <strong>no clasifica</strong> en la lista de elegibles publicada
          oficialmente por la Procuraduría General de la Nación, recibirá un código de descuento del
          50 % canjeable una sola vez en cualquier curso del Marketplace, válido por 12 meses.
          Las condiciones completas se encuentran en{' '}
          <a href="/garantia" style={linkStyle}>/garantia</a>.
        </p>
      </Section>

      <Section n={6} titulo="Derecho de Retracto">
        <p>
          De conformidad con el artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), el
          Suscriptor tiene derecho a retractarse de la compra dentro de los <strong>5 días hábiles</strong>{' '}
          siguientes a la adquisición del servicio, siempre que no haya accedido al contenido del plan
          de preparación más allá del diagnóstico inicial. La solicitud se realiza enviando correo a{' '}
          <strong>{EMAIL_SOPORTE}</strong>.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Este derecho es <strong>independiente</strong> y <strong>adicional</strong> a la Garantía
          de Satisfacción Inicial descrita en la cláusula 5.1.
        </p>
      </Section>

      <Section n={7} titulo="Propiedad Intelectual">
        <p>
          Todo el contenido de la Plataforma — incluyendo textos, diseño, código fuente, algoritmos,
          modelos de IA, marcas y logotipos — es propiedad exclusiva de {RAZON_SOCIAL} o de sus
          licenciantes, y está protegido por las leyes colombianas e internacionales de propiedad
          intelectual (Decisión Andina 351 de 1993, Ley 23 de 1982).
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          El corpus normativo utilizado proviene de fuentes públicas oficiales (leyes, decretos y
          resoluciones publicadas en el Diario Oficial). Su compilación, estructuración y
          enriquecimiento con metadatos constituyen una base de datos protegida.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Queda <strong>prohibida</strong> la reproducción, distribución, comunicación pública o
          transformación del contenido de la Plataforma sin autorización previa y por escrito.
        </p>
      </Section>

      <Section n={8} titulo="Uso Aceptable">
        <p>El Usuario se compromete a:</p>
        <ul style={listStyle}>
          <li>Proporcionar información veraz y actualizada en el formulario de registro.</li>
          <li>No compartir sus credenciales de acceso con terceros.</li>
          <li>No usar técnicas de scraping, ingeniería inversa o automatización para extraer contenido.</li>
          <li>No reproducir, distribuir ni comercializar las preguntas generadas por la IA.</li>
          <li>No usar la Plataforma para fines distintos a la preparación de concursos públicos.</li>
        </ul>
        <p style={{ marginTop: '0.75rem' }}>
          El incumplimiento de estas obligaciones faculta a MéritoPro para suspender o cancelar el
          acceso del Usuario sin derecho a reembolso.
        </p>
      </Section>

      <Section n={9} titulo="Limitación de Responsabilidad">
        <ul style={listStyle}>
          <li>
            MéritoPro <strong>no garantiza</strong> la aprobación de ningún concurso. La Plataforma
            es una herramienta de preparación, no un sustituto del estudio personal ni una garantía
            de resultado.
          </li>
          <li>
            Las respuestas generadas por la IA están fundamentadas en el corpus normativo verificado.
            Sin embargo, <strong>no constituyen asesoría jurídica profesional</strong>.
          </li>
          <li>
            MéritoPro no será responsable por interrupciones del servicio causadas por mantenimiento
            programado, fallos de terceros proveedores (Supabase, Anthropic, Wompi) o fuerza mayor.
          </li>
          <li>
            La responsabilidad contractual total de MéritoPro frente al Suscriptor se limita al
            valor efectivamente pagado por el servicio.
          </li>
        </ul>
      </Section>

      <Section n={10} titulo="Tratamiento de Datos Personales">
        <p>
          El tratamiento de datos personales se rige por la{' '}
          <a href="/legal/privacidad" style={linkStyle}>Política de Privacidad y Tratamiento de Datos</a>,
          que forma parte integral de estos Términos. Dicha política cumple con la Ley Estatutaria
          1581 de 2012 y el Decreto 1377 de 2013.
        </p>
      </Section>

      <Section n={11} titulo="Facturación Electrónica">
        <p>
          De conformidad con la Resolución 000042 de 2020 de la DIAN, MéritoPro emitirá factura
          electrónica de venta por cada transacción aprobada. La factura será enviada al correo
          electrónico registrado por el Suscriptor dentro de las 24 horas siguientes a la
          confirmación del pago.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          El Suscriptor podrá solicitar factura con datos de persona jurídica (NIT, razón social)
          enviando la información a <strong>{EMAIL_SOPORTE}</strong> antes de realizar el pago.
        </p>
      </Section>

      <Section n={12} titulo="Modificaciones">
        <p>
          MéritoPro se reserva el derecho de modificar estos Términos en cualquier momento. Las
          modificaciones entrarán en vigencia una vez publicadas en la Plataforma. El uso continuado
          de la Plataforma tras la publicación de cambios implica la aceptación de los mismos.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Las modificaciones sustanciales serán notificadas al Suscriptor por correo electrónico
          con al menos 15 días de anticipación.
        </p>
      </Section>

      <Section n={13} titulo="Legislación Aplicable y Resolución de Conflictos">
        <p>
          Estos Términos se rigen por la legislación de la República de Colombia. Para la resolución
          de cualquier controversia, las partes acuerdan:
        </p>
        <ol style={listStyle}>
          <li>
            <strong>Reclamación directa:</strong> el Usuario contactará a{' '}
            <strong>{EMAIL_SOPORTE}</strong>. MéritoPro responderá en un plazo máximo de 15 días
            hábiles conforme al artículo 58 de la Ley 1480 de 2011.
          </li>
          <li>
            <strong>Superintendencia de Industria y Comercio (SIC):</strong> el Usuario podrá
            acudir a la SIC como autoridad de protección al consumidor.
          </li>
          <li>
            <strong>Jurisdicción:</strong> en caso de litigio, los jueces competentes serán los de
            Bogotá, D.C.
          </li>
        </ol>
      </Section>

      <Section n={14} titulo="Contacto">
        <p>
          <strong>Email legal:</strong> {EMAIL_LEGAL}<br />
          <strong>Email soporte:</strong> {EMAIL_SOPORTE}<br />
          <strong>Dirección:</strong> {DOMICILIO}
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

const articleStyle: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
  lineHeight: 1.75,
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
  marginBottom: '0.75rem',
};

const h1Style: React.CSSProperties = {
  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  marginBottom: '1rem',
};

const h2Style: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
  color: 'var(--color-text-primary)',
};

const h3Style: React.CSSProperties = {
  fontSize: '1.0625rem',
  fontWeight: 600,
  marginTop: '1.25rem',
  marginBottom: '0.5rem',
  color: 'var(--color-text-primary)',
};

const introStyle: React.CSSProperties = {
  fontSize: '1.0625rem',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.7,
};

const bodyStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--color-text-primary)',
};

const listStyle: React.CSSProperties = {
  paddingLeft: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginTop: '0.5rem',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--color-ia)',
  fontWeight: 600,
  textDecoration: 'underline',
};
