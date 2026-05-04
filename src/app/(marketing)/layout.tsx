import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MéritoPro — Tu Diagnóstico Gratuito PGN 2026",
  description:
    "Descubre tu nivel real de preparación para el concurso de la Procuraduría General de la Nación. Diagnóstico gratuito de 40 preguntas basado en la metodología oficial.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
            <a href="#diagnostico" className="btn btn-ghost" style={{ fontSize: "0.875rem" }}>
              Diagnóstico Gratuito
            </a>
            <Link href="/login" className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
              Iniciar Sesión
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
