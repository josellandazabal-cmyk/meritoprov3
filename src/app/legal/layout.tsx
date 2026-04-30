import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentos Legales · MéritoPro',
  description:
    'Términos de uso, políticas de privacidad, cookies y garantía de MéritoPro.',
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header Legal */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="container-wide"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: 'var(--color-text-primary)',
            }}
          >
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Mérito
              <span style={{ color: 'var(--color-cta)' }}>Pro</span>
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/legal/terminos" style={navLinkStyle}>Términos</Link>
            <Link href="/legal/privacidad" style={navLinkStyle}>Privacidad</Link>
            <Link href="/legal/cookies" style={navLinkStyle}>Cookies</Link>
            <Link href="/garantia" style={navLinkStyle}>Garantía</Link>
            <Link href="/legal/arco" style={navLinkStyle}>Derechos ARCO</Link>
          </nav>
        </div>
      </header>

      {/* Contenido legal */}
      <main className="container-narrow" style={{ padding: '3rem 1rem 5rem' }}>
        {children}
      </main>

      {/* Footer minimalista */}
      <footer
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          color: 'var(--color-text-muted)',
          padding: '2rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
        }}
      >
        <div className="container-wide">
          <p style={{ marginBottom: '0.5rem' }}>
            © {new Date().getFullYear()} MéritoPro. Todos los derechos reservados.
          </p>
          <p>
            NIT: [Por registrar] · Bogotá, D.C., Colombia ·{' '}
            <Link href="mailto:legal@meritopro.co" style={{ color: 'var(--color-cta)' }}>
              legal@meritopro.co
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--radius-sm)',
  transition: 'all 150ms',
};
