import type { Metadata } from "next";
import Link from "next/link";

// ============================================================
// SEO — Metadata para que el aspirante encuentre MéritoPro al
// buscar términos del concurso PGN 2026 (CNSC + UdeA operadora).
//
// Keywords objetivo (long-tail prioritarias):
//   · concurso pgn 2026
//   · preparación procuraduría general de la nación
//   · diagnóstico concurso de méritos pgn
//   · procurador judicial concurso 2026
//   · simulacro pgn gratuito
//   · ley 1952 explicada concurso
//   · resolución 076 de 2026
//   · inscripciones pgn junio 2026
//   · método de estudio concursos cnsc
// ============================================================

const SEO_DESCRIPTION =
  'Diagnóstico gratuito de 40 preguntas oficiales (Tipo I, II, III + comportamentales Decreto 815) para el concurso de méritos PGN 2026. 2.824 vacantes · Inscripciones 1-12 jun 2026. Mide tu nivel real antes de inscribirte.';

const SEO_KEYWORDS = [
  'concurso PGN 2026',
  'concurso Procuraduría General de la Nación',
  'preparación PGN',
  'diagnóstico concurso méritos',
  'simulacro PGN gratuito',
  'Procurador Judicial concurso',
  'Resolución 076 de 2026',
  'Resolución 108 de 2026',
  'Ley 1952 código disciplinario',
  'Decreto 815 de 2018 competencias',
  'inscripciones PGN junio 2026',
  'Universidad de Antioquia concurso PGN',
  'lista de elegibles PGN',
  'curva del olvido SM-2',
  'concurso de méritos CNSC 2026',
  'Tutor IA derecho disciplinario',
];

export const metadata: Metadata = {
  metadataBase: new URL('https://meritopro.co'),
  title: {
    default: 'MéritoPro — Diagnóstico gratuito PGN 2026 · 2.824 vacantes',
    template: '%s · MéritoPro',
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: 'MéritoPro' }],
  creator: 'MéritoPro',
  publisher: 'MéritoPro',
  category: 'education',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://meritopro.co/',
    siteName: 'MéritoPro',
    title: 'MéritoPro — Diagnóstico gratuito PGN 2026',
    description: SEO_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MéritoPro — Preparación inteligente concurso PGN 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MéritoPro — Diagnóstico gratuito PGN 2026',
    description: SEO_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'tu-google-site-verification-code',
  },
};

// JSON-LD para schema.org — ayuda a Google a entender el contexto
// (tipo Course + FAQPage + Organization). Mejora rich snippets en SERP.
const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'MéritoPro',
  url: 'https://meritopro.co',
  logo: 'https://meritopro.co/logo.png',
  description: SEO_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CO',
    addressLocality: 'Bogotá',
  },
  sameAs: [],
};

const JSON_LD_COURSE = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Preparación para el concurso de méritos PGN 2026',
  description:
    'Programa de preparación con IA adaptativa para los 2.824 cargos convocados por la Procuraduría General de la Nación en 2026. Diagnóstico inicial gratuito de 40 preguntas con la metodología oficial.',
  provider: {
    '@type': 'Organization',
    name: 'MéritoPro',
    url: 'https://meritopro.co',
  },
  educationalLevel: 'Profesional',
  inLanguage: 'es-CO',
  offers: {
    '@type': 'Offer',
    price: '197000',
    priceCurrency: 'COP',
    category: 'subscription',
    availability: 'https://schema.org/InStock',
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'P60D',
  },
};

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuándo abren las inscripciones del concurso PGN 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las inscripciones al concurso de méritos de la Procuraduría General de la Nación 2026 abren el 1 de junio y cierran el 12 de junio de 2026, conforme a la Resolución 076 de 2026 modificada por la Resolución 108 de 2026.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántas vacantes ofrece el concurso PGN 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El concurso PGN 2026 ofrece 2.824 vacantes definitivas distribuidas en niveles asesor, profesional, técnico, administrativo y operativo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué tipos de preguntas evalúa el examen PGN?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El examen evalúa cuatro tipos: Tipo I (selección múltiple única respuesta), Tipo II (afirmaciones con combinaciones), Tipo III (afirmación-razón) y comportamentales tipo Likert basadas en el Decreto 815 de 2018.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es el puntaje mínimo aprobatorio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El mínimo aprobatorio en la prueba de conocimientos es 65%. Es eliminatoria. La prueba pesa 70% del puntaje total para nivel profesional/asesor/ejecutivo y 60% para técnico/administrativo/operativo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es gratuito el diagnóstico inicial de MéritoPro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El diagnóstico de 40 preguntas oficiales es completamente gratuito, no requiere tarjeta de crédito y entrega resultados inmediatos por módulo.',
      },
    },
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD para Google rich snippets — Organization + Course + FAQ */}
      <script
        type="application/ld+json"
        // dangerouslySetInnerHTML porque el JSON-LD debe inyectarse RAW
        // sin escape de Next. Es contenido seguro generado en build-time.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD_ORGANIZATION),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD_COURSE),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD_FAQ),
        }}
      />

      {/* Header Marketing */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-wide"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              color: "var(--color-text-primary)",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Mérito
              <span style={{ color: "var(--color-cta)" }}>Pro</span>
            </span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              href="/blog"
              className="btn btn-ghost"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}
            >
              Blog
            </Link>
            <a
              href="#diagnostico"
              className="btn btn-ghost"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}
            >
              Diagnóstico Gratuito
            </a>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}
            >
              Iniciar Sesión →
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer Marketing */}
      <footer
        style={{
          backgroundColor: "var(--color-bg-dark)",
          color: "var(--color-text-white)",
          padding: "3rem 0 2rem",
          marginTop: "4rem",
        }}
      >
        <div className="container-wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                Mérito<span style={{ color: "var(--color-cta)" }}>Pro</span>
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Plataforma de preparación inteligente para el Concurso de Méritos PGN 2026.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Concurso PGN 2026</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>2.824 vacantes definitivas</li>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Resolución 076 / Resolución 108 de 2026</li>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Inscripciones: 1-12 jun 2026</li>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Operado por la Procuraduría General de la Nación</li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Metodología</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Recuperación Activa</li>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Repetición Espaciada (SM-2)</li>
                <li style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Práctica Intercalada</li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Recursos</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><Link href="/blog" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Blog jurídico</Link></li>
                <li><Link href="/blog/guia-completa-concurso-pgn-2026" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Guía concurso PGN 2026</Link></li>
                <li><Link href="/blog/ley-1952-codigo-general-disciplinario-guia-examen-pgn" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Ley 1952 explicada</Link></li>
                <li><Link href="/blog/tipos-preguntas-examen-pgn-2026-como-resolverlas" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Tipos de preguntas PGN</Link></li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Legal</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><Link href="/legal/terminos" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Términos y Condiciones</Link></li>
                <li><Link href="/legal/privacidad" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Política de Privacidad</Link></li>
                <li><Link href="/legal/cookies" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Política de Cookies</Link></li>
                <li><Link href="/garantia" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Doble Garantía</Link></li>
                <li><Link href="/legal/arco" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>Derechos ARCO</Link></li>
              </ul>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "1.5rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            © {new Date().getFullYear()} MéritoPro. NIT: [Por registrar] · Bogotá, D.C., Colombia. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
