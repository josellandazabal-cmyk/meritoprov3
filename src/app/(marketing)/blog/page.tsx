import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICULOS } from '@/lib/blog/articulos'

export const metadata: Metadata = {
  title: 'Blog Jurídico — Guías PGN 2026',
  description:
    'Artículos de fondo sobre el concurso de méritos PGN 2026, derecho disciplinario, metodología de estudio y estrategia para clasificar. Guías escritas por el equipo MéritoPro.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://meritopro.co/blog',
    title: 'Blog Jurídico MéritoPro — Guías PGN 2026',
    description:
      'Artículos de fondo sobre el concurso de méritos PGN 2026, derecho disciplinario y estrategia de preparación.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Blog MéritoPro' }],
  },
}

const CATEGORIA_COLORES: Record<string, string> = {
  'Guías oficiales': '#4f46e5',
  'Derecho disciplinario': '#0891b2',
  'Estrategia y metodología': '#059669',
}

function TagCategoria({ categoria }: { categoria: string }) {
  const color = CATEGORIA_COLORES[categoria] ?? '#64748b'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: color + '15',
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {categoria}
    </span>
  )
}

export default function BlogPage() {
  const destacados = ARTICULOS.filter((a) => a.destacado)
  const resto = ARTICULOS.filter((a) => !a.destacado)

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '4rem 0 3rem',
          color: '#fff',
        }}
      >
        <div className="container-wide">
          <div style={{ maxWidth: '640px' }}>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#facc15',
                marginBottom: '0.75rem',
              }}
            >
              Blog · Recursos gratuitos
            </p>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '1rem',
                color: '#fff',
              }}
            >
              Guías jurídicas para el Concurso PGN 2026
            </h1>
            <p
              style={{
                fontSize: '1.0625rem',
                color: '#94a3b8',
                lineHeight: 1.7,
                marginBottom: '2rem',
              }}
            >
              Artículos de fondo sobre derecho disciplinario, estructura del examen, normas clave y
              estrategia de preparación — escritos para abogados y profesionales que aspiran a las
              2.824 vacantes de la PGN.
            </p>
            <Link href="/#diagnostico" className="btn btn-primary btn-lg">
              Diagnóstico gratuito →
            </Link>
          </div>
        </div>
      </section>

      {/* Artículos */}
      <section style={{ padding: '3rem 0 5rem' }}>
        <div className="container-wide">

          {/* Destacados */}
          {destacados.length > 0 && (
            <>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                Artículos destacados
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '3rem',
                }}
              >
                {destacados.map((art) => (
                  <Link
                    key={art.slug}
                    href={`/blog/${art.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <article
                      className="card"
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        transition: 'transform 200ms ease, box-shadow 200ms ease',
                        cursor: 'pointer',
                        borderTop: '3px solid #facc15',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <TagCategoria categoria={art.categoria} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {art.tiempoLectura} min lectura
                        </span>
                      </div>
                      <h2
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          lineHeight: 1.35,
                          color: 'var(--color-text-primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {art.titulo}
                      </h2>
                      <p
                        style={{
                          fontSize: '0.9rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.6,
                          flex: 1,
                        }}
                      >
                        {art.excerpt}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--color-border)',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {new Date(art.fechaPublicacion).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#4f46e5',
                          }}
                        >
                          Leer →
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Resto de artículos */}
          {resto.length > 0 && (
            <>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                Más artículos
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {resto.map((art) => (
                  <Link
                    key={art.slug}
                    href={`/blog/${art.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <article
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <TagCategoria categoria={art.categoria} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {art.tiempoLectura} min
                          </span>
                        </div>
                        <h3
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            marginBottom: '0.35rem',
                          }}
                        >
                          {art.titulo}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                          {art.excerpt}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#4f46e5',
                          whiteSpace: 'nowrap',
                          paddingTop: '0.25rem',
                        }}
                      >
                        Leer →
                      </span>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* CTA Newsletter */}
          <div
            style={{
              marginTop: '4rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.75rem',
                color: '#fff',
              }}
            >
              Recibe los artículos en tu correo
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Guías sobre el concurso PGN, normas clave y estrategia de preparación — directo a tu bandeja,
              sin spam.
            </p>
            <Link href="/#diagnostico" className="btn btn-primary btn-lg">
              Empieza gratis — Diagnóstico PGN →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
