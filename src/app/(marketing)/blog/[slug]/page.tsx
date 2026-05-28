import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ARTICULOS, getArticulo, type SeccionArticulo } from '@/lib/blog/articulos'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return ARTICULOS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const art = getArticulo(slug)
  if (!art) return {}
  return {
    title: art.titulo,
    description: art.excerpt,
    alternates: { canonical: `/blog/${art.slug}` },
    openGraph: {
      type: 'article',
      locale: 'es_CO',
      url: `https://meritopro.co/blog/${art.slug}`,
      title: art.titulo,
      description: art.excerpt,
      publishedTime: art.fechaPublicacion,
      authors: [art.autor],
      tags: art.tags,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: art.titulo }],
    },
  }
}

function renderSeccion(seccion: SeccionArticulo, idx: number) {
  switch (seccion.tipo) {
    case 'h2':
      return (
        <h2
          key={idx}
          style={{
            fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            marginTop: '2.5rem',
            marginBottom: '0.875rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #facc15',
          }}
        >
          {seccion.texto}
        </h2>
      )

    case 'h3':
      return (
        <h3
          key={idx}
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginTop: '1.75rem',
            marginBottom: '0.625rem',
          }}
        >
          {seccion.texto}
        </h3>
      )

    case 'parrafo':
      return (
        <p
          key={idx}
          style={{
            fontSize: '1.0125rem',
            lineHeight: 1.8,
            color: '#334155',
            marginBottom: '1.25rem',
          }}
        >
          {seccion.texto}
        </p>
      )

    case 'lista':
      return (
        <ul
          key={idx}
          style={{
            paddingLeft: '1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {seccion.items?.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: '#334155',
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )

    case 'numerada':
      return (
        <ol
          key={idx}
          style={{
            paddingLeft: '1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {seccion.items?.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: '#334155',
              }}
            >
              {item}
            </li>
          ))}
        </ol>
      )

    case 'destacado':
      return (
        <div
          key={idx}
          style={{
            background: '#eef2ff',
            borderLeft: '4px solid #4f46e5',
            borderRadius: '0 8px 8px 0',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            marginTop: '0.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.9875rem',
              lineHeight: 1.75,
              color: '#1e1b4b',
              fontStyle: 'italic',
            }}
          >
            {seccion.texto}
          </p>
        </div>
      )

    case 'advertencia':
      return (
        <div
          key={idx}
          style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: '#78350f',
            }}
          >
            {seccion.texto}
          </p>
        </div>
      )

    case 'cta':
      return (
        <div
          key={idx}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: '12px',
            padding: '2rem',
            marginTop: '2.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.7,
              color: '#e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            {seccion.texto}
          </p>
          <Link href="/#diagnostico" className="btn btn-primary">
            Diagnóstico gratuito — 40 preguntas →
          </Link>
        </div>
      )

    case 'tabla':
      return (
        <div
          key={idx}
          style={{
            overflowX: 'auto',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            {seccion.cabeceras && (
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {seccion.cabeceras.map((cab, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        color: '#facc15',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cab}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {seccion.filas?.map((fila, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}
                >
                  {fila.map((celda, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '0.7rem 1rem',
                        color: '#334155',
                        borderBottom: '1px solid var(--color-border)',
                        lineHeight: 1.55,
                        verticalAlign: 'top',
                      }}
                    >
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return null
  }
}

export default async function ArticuloPage({ params }: Props) {
  const { slug } = await params
  const art = getArticulo(slug)
  if (!art) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: art.titulo,
    description: art.excerpt,
    datePublished: art.fechaPublicacion,
    dateModified: art.fechaPublicacion,
    author: {
      '@type': 'Organization',
      name: art.autor,
      url: 'https://meritopro.co',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MéritoPro',
      logo: {
        '@type': 'ImageObject',
        url: 'https://meritopro.co/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://meritopro.co/blog/${art.slug}`,
    },
    keywords: art.tags.join(', '),
    inLanguage: 'es-CO',
    image: 'https://meritopro.co/og-image.png',
  }

  const otrosArticulos = ARTICULOS.filter((a) => a.slug !== art.slug).slice(0, 2)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-white)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.75rem 0',
        }}
      >
        <div className="container-wide">
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Inicio
            </Link>
            <span>›</span>
            <Link href="/blog" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Blog
            </Link>
            <span>›</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{art.tituloCorto}</span>
          </nav>
        </div>
      </div>

      {/* Hero artículo */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '3rem 0 2.5rem',
          color: '#fff',
        }}
      >
        <div className="container-wide" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(250,204,21,0.15)',
                color: '#facc15',
                border: '1px solid rgba(250,204,21,0.3)',
              }}
            >
              {art.categoria}
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {art.tiempoLectura} min de lectura
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              color: '#fff',
              marginBottom: '1rem',
            }}
          >
            {art.titulo}
          </h1>

          <p
            style={{
              fontSize: '1.0625rem',
              color: '#94a3b8',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
            }}
          >
            {art.excerpt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Por{' '}
              <strong style={{ color: '#94a3b8' }}>{art.autor}</strong>
              {' · '}{art.autorCargo}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {new Date(art.fechaPublicacion).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '3rem 0 5rem' }}>
        <div
          className="container-wide"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr min(680px, 100%) 1fr',
            gap: '0 1.5rem',
          }}
        >
          <div style={{ gridColumn: '2' }}>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {art.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Artículo */}
            <article>
              {art.contenido.map((sec, i) => renderSeccion(sec, i))}
            </article>

            {/* Compartir */}
            <div
              style={{
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  ¿Fue útil este artículo?
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Compártelo con otros aspirantes al concurso PGN 2026
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://meritopro.co/blog/${art.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  LinkedIn
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://meritopro.co/blog/${art.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Facebook
                </a>
              </div>
            </div>

            {/* Otros artículos */}
            {otrosArticulos.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '1rem',
                  }}
                >
                  También te puede interesar
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {otrosArticulos.map((otro) => (
                    <Link
                      key={otro.slug}
                      href={`/blog/${otro.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        className="card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            {otro.categoria} · {otro.tiempoLectura} min
                          </p>
                          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {otro.titulo}
                          </p>
                        </div>
                        <span style={{ color: '#4f46e5', fontWeight: 700, flexShrink: 0 }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA final */}
            <div
              style={{
                marginTop: '3rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                borderRadius: '16px',
                padding: '2.5rem',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Pon a prueba tu preparación
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                40 preguntas oficiales (Tipo I, II, III + comportamentales), resultado inmediato por
                módulo, sin tarjeta de crédito.
              </p>
              <Link href="/#diagnostico" className="btn btn-primary btn-lg">
                Diagnóstico gratuito →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
