// ============================================================
// RecomendacionesRefuerzo — Tarjetas de refuerzo basadas en módulos débiles
//
// Muestra hasta 3 recomendaciones contextualizadas según el módulo más
// débil detectado en el dashboard. Cada recomendación apunta a una fuente
// oficial (whitelist *.gov.co) o al Tutor IA con el tema precargado.
//
// No es contenido inventado: las normas/links son los oficiales del corpus
// (Constitución, Ley 1952, Decreto 262, etc.) ya validados por el RAG.
// ============================================================

import Link from 'next/link';

interface Recomendacion {
  titulo: string;
  resumen: string;
  url: string;
  externa: boolean;
  fuente: string;
}

// URLs estables de Secretaría del Senado (patrón consistente que no cambia
// por re-indexación de IDs como ocurre en gestornormativo de funcionpublica).
// Verificadas Mayo 2026.
const RECOMENDACIONES: Record<string, Recomendacion[]> = {
  'Constitución y Órganos de Control': [
    {
      titulo: 'Constitución Política — Texto vigente',
      resumen: 'Estructura del Estado, derechos fundamentales (Art. 11-41), órganos de control (Art. 117-119, 267-284).',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
    {
      titulo: 'PGN dentro del Ministerio Público',
      resumen: 'Art. 277-284 CP. Funciones constitucionales del Procurador y la Defensoría del Pueblo.',
      url: '/dashboard/tutor?tema=ministerio_publico',
      externa: false,
      fuente: 'Tutor IA',
    },
  ],
  'Derecho Disciplinario': [
    {
      titulo: 'Ley 1952 de 2019 — Código General Disciplinario',
      resumen: 'Regla central del concurso PGN. Art. 26 (faltas gravísimas), Art. 38 (sanciones), procedimiento ordinario.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
    {
      titulo: 'Ley 2094 de 2021 — Reforma al CGD',
      resumen: 'Modificó separación de roles entre Procurador y juez disciplinario. Crítica para Procuradores Judiciales.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2094_2021.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
  ],
  'PGN — Régimen Interno': [
    {
      titulo: 'Decreto Ley 262 de 2000 — Estructura PGN',
      resumen: 'Art. 7 (estructura), Art. 24 (Procuradores Delegados), Art. 38 (Procuradores Judiciales).',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0262_2000.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
    {
      titulo: 'Guía Disciplinaria PGN — Ley 1952',
      resumen: 'Guía oficial de la Procuraduría sobre el CGD. Aplicación práctica artículo por artículo.',
      url: 'https://apps.procuraduria.gov.co/guia/index_1952.html',
      externa: true,
      fuente: 'procuraduria.gov.co',
    },
  ],
  'Procedimiento Administrativo': [
    {
      titulo: 'Ley 1437 de 2011 — CPACA',
      resumen: 'Procedimiento administrativo general (Libro Primero) y contencioso (Libro Segundo).',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
  ],
  'Contratación Estatal': [
    {
      titulo: 'Ley 80 de 1993 — Estatuto General',
      resumen: 'Modalidades de selección, principios y régimen de inhabilidades.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0080_1993.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
    {
      titulo: 'Ley 1150 de 2007 — Eficiencia y transparencia',
      resumen: 'Subasta inversa, mínima cuantía, selección abreviada.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1150_2007.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
  ],
  'Transparencia y Anticorrupción': [
    {
      titulo: 'Ley 1712 de 2014 — Transparencia y Acceso',
      resumen: 'Obligaciones de publicación activa, derecho de acceso a la información pública.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1712_2014.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
    {
      titulo: 'Ley 2195 de 2022 — Anticorrupción',
      resumen: 'Sanciones reforzadas a personas jurídicas, conflicto de interés, beneficiarios reales.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2195_2022.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
  ],
  'Acciones Constitucionales': [
    {
      titulo: 'Decreto 2591 de 1991 — Acción de Tutela',
      resumen: 'Procedencia, términos (10 días), revisión de la Corte Constitucional.',
      url: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_2591_1991.html',
      externa: true,
      fuente: 'secretariasenado.gov.co',
    },
  ],
};

// Fallback genérico si no hay módulo débil identificado
const RECOMENDACIONES_GENERALES: Recomendacion[] = [
  {
    titulo: 'Convocatoria PGN 2026 — Sitio oficial',
    resumen: 'Resoluciones 076 y 108 de 2026, cronograma, listado de cargos y requisitos.',
    url: 'https://www.procuraduria.gov.co',
    externa: true,
    fuente: 'procuraduria.gov.co',
  },
  {
    titulo: 'Ley 1952 de 2019 — CGD',
    resumen: 'Norma central evaluada en el concurso. Régimen disciplinario completo.',
    url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html',
    externa: true,
    fuente: 'secretariasenado.gov.co',
  },
  {
    titulo: 'Constitución Política — Texto vigente',
    resumen: 'Estructura del Estado, derechos fundamentales, Ministerio Público (Art. 275-284).',
    url: 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html',
    externa: true,
    fuente: 'secretariasenado.gov.co',
  },
];

interface Props {
  moduloDebil: string | null;
}

export default function RecomendacionesRefuerzo({ moduloDebil }: Props) {
  const lista = (moduloDebil && RECOMENDACIONES[moduloDebil]) || RECOMENDACIONES_GENERALES;
  const tituloSeccion = moduloDebil
    ? `Refuerzo recomendado para "${moduloDebil}"`
    : 'Material de referencia oficial';

  return (
    <div
      className="animate-fade-in-up"
      style={{ marginTop: '2rem', animationDelay: '0.3s' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem' }}>📚 {tituloSeccion}</h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1rem',
        }}
      >
        {lista.slice(0, 3).map((rec) => (
          <a
            key={rec.titulo}
            href={rec.url}
            target={rec.externa ? '_blank' : undefined}
            rel={rec.externa ? 'noopener noreferrer' : undefined}
            className="card"
            style={{
              padding: '1.25rem',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              border: '1px solid var(--color-border)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--color-ia)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-ia)',
                }}
              >
                {rec.fuente}
              </span>
              {rec.externa && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>↗</span>}
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.3 }}>
              {rec.titulo}
            </h3>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {rec.resumen}
            </p>
          </a>
        ))}
      </div>

      <div style={{ marginTop: '0.875rem', textAlign: 'right' }}>
        <Link
          href="/dashboard/tutor"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-ia)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Pregúntale al Tutor IA →
        </Link>
      </div>
    </div>
  );
}
