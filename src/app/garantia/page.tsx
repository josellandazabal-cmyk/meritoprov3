import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Doble Garantía MéritoPro · Tu inversión protegida',
  description:
    'Garantía de satisfacción inicial de 15 días + Garantía de resultado con 50% de descuento uso único si entrenas y no clasificas. Sin letra pequeña.',
};

const EMAIL_SOPORTE = 'soporte@meritopro.co';

export default function GarantiaPage() {
  return (
    <>
      {/* Header */}
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
              textDecoration: 'none',
              color: 'var(--color-text-primary)',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
            </span>
          </Link>
          <Link href="/#diagnostico" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
            Tomar Diagnóstico Gratuito →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: 'clamp(3rem, 8vw, 5rem) 0',
          background: 'linear-gradient(180deg, #ffffff 0%, var(--color-bg-primary) 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container-narrow">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.875rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            ✅ Tu inversión protegida
          </div>

          <h1 style={{ marginBottom: '1rem' }}>
            Doble Garantía{' '}
            <span className="text-gradient">MéritoPro</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Si no funciona para ti en 15 días, devolvemos tu dinero. Si entrenas y no clasificas,
            te damos 50 % de descuento para tu siguiente intento. Sin letra pequeña.
          </p>
        </div>
      </section>

      {/* Garantía 1 */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container-narrow">
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={badgeStyle('#f0fdf4', '#166534')}>1</div>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Garantía de Satisfacción Inicial
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                  15 días corridos · Reembolso 100 %
                </p>
              </div>
            </div>

            <p style={bodyStyle}>
              Si en los primeros <strong>15 días corridos</strong> desde la compra no estás satisfecho
              con el servicio, te devolvemos el <strong>100 %</strong> de tu inversión. Sin formularios.
              Sin preguntas incómodas. Solo escríbenos.
            </p>

            <div style={detailBox}>
              <DetailRow label="Ventana" value="15 días corridos desde la compra" />
              <DetailRow label="Requisito" value="Solo completar el diagnóstico (40 preguntas)" />
              <DetailRow label="Cómo reclamar" value={`Email a ${EMAIL_SOPORTE} con tu referencia de compra`} />
              <DetailRow label="Plazo de reembolso" value="Máximo 5 días hábiles, mismo medio de pago" />
            </div>
          </div>
        </div>
      </section>

      {/* Garantía 2 */}
      <section style={{ padding: '0 0 3rem' }}>
        <div className="container-narrow">
          <div className="card" style={{ padding: '2rem', border: '2px solid var(--color-cta)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={badgeStyle('#fefce8', '#854d0e')}>2</div>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Garantía de Resultado MéritoPro
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                  Hasta el examen · 50 % de descuento · Uso único
                </p>
              </div>
            </div>

            <p style={bodyStyle}>
              Si entrenas con disciplina, te presentas al examen y <strong>no clasificas</strong>{' '}
              en la lista de elegibles publicada oficialmente por la PGN, te damos un código de
              <strong> 50 % de descuento</strong> canjeable <strong>una sola vez</strong> en
              cualquier curso del Marketplace, válido por <strong>12 meses</strong>.
            </p>

            {/* Condiciones */}
            <h3 style={h3Style}>Condiciones de Elegibilidad</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Todas las condiciones deben cumplirse simultáneamente:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Condicion letra="a" texto="Completar el diagnóstico inicial dentro de los primeros 14 días." verificacion="Automático · Telemetría interna" />
              <Condicion letra="b" texto="Completar ≥ 70 % de las sesiones diarias del Bucle Diario disponibles entre la compra y el examen." verificacion="Automático · Contador de sesiones" />
              <Condicion letra="c" texto="Mantener probabilidad_aprobar_actual registrada los últimos 30 días antes del examen." verificacion="Automático · Métrica calculada" />
              <Condicion letra="d" texto="Presentar el examen oficial." verificacion="Manual · Foto del citatorio + acta de presentación" />
              <Condicion letra="e" texto="No clasificar en la lista de elegibles publicada oficialmente por la PGN." verificacion="Manual · Captura/PDF del listado oficial" />
              <Condicion letra="f" texto="Reclamar dentro de los 30 días siguientes a la publicación de resultados." verificacion="Email + evidencias a soporte" />
            </div>

            {/* Reglas del código */}
            <h3 style={h3Style}>Reglas del Código de Descuento</h3>
            <div style={detailBox}>
              <DetailRow label="Formato" value="MERITO50-XXXX (código personal, intransferible)" />
              <DetailRow label="Descuento" value="50 % sobre el precio público del curso elegido" />
              <DetailRow label="Uso" value="UNA SOLA VEZ. Un solo curso, una sola compra. No divisible." />
              <DetailRow label="Vigencia" value="12 meses desde la aprobación del reclamo. Sin renovaciones." />
              <DetailRow label="Acumulable" value="NO. No se combina con otros descuentos (retornante, referido). Se aplica el mejor descuento disponible." />
              <DetailRow label="Canjeable en" value="Cualquier curso activo del Marketplace (PGN siguiente convocatoria, Fiscalía, Contraloría, Rama Judicial, etc.)" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container-narrow">
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
            Preguntas Frecuentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FAQ
              pregunta="¿Puedo usar las dos garantías?"
              respuesta="Son independientes. La Garantía 1 (reembolso 100 %) aplica en los primeros 15 días. La Garantía 2 (50 % off) aplica después, si entrenas y no clasificas. Si pides reembolso en los primeros 15 días, la Garantía 2 ya no aplica."
            />
            <FAQ
              pregunta="¿El 50 % se aplica sobre el precio que pagué o sobre el precio público?"
              respuesta="Sobre el precio público del curso que elijas en el Marketplace. Si el curso vale COP 297.000, pagas COP 148.500."
            />
            <FAQ
              pregunta="¿Qué pasa si no cumplo el 70 % de sesiones?"
              respuesta="La Garantía 2 no aplica. El método solo funciona con uso real y consistente. No podemos garantizar resultados sin compromiso del estudiante."
            />
            <FAQ
              pregunta="¿Cómo verifican que me presenté al examen?"
              respuesta="Pedimos foto de la citación oficial emitida por la Procuraduría General de la Nación (vía meritoconstruyendoexcelencia.com.co) y el acta o sello del día del examen. Son documentos oficiales, verificables."
            />
            <FAQ
              pregunta="¿Y si el concurso se cancela o aplaza?"
              respuesta="Tu acceso al curso se extiende automáticamente hasta 30 días después de la nueva fecha del examen. La Garantía 2 se ajusta a la nueva fecha."
            />
            <FAQ
              pregunta="¿Puedo ceder mi código a otra persona?"
              respuesta="No. El código es personal e intransferible, asociado a tu cuenta de MéritoPro."
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section
        style={{
          padding: '4rem 0',
          background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #1e293b 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div className="container-narrow">
          <h2 style={{ marginBottom: '1rem', color: 'white' }}>
            Tu inversión de COP 297.000 está protegida
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
            15 días para probar sin riesgo. Si entrenas y no clasificas, 50 % off en tu siguiente intento.
          </p>
          <Link href="/#diagnostico" className="btn btn-primary btn-xl">
            Empezar con Diagnóstico Gratuito →
          </Link>
        </div>
      </section>

      {/* Footer mini */}
      <footer
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          color: 'var(--color-text-muted)',
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="container-wide">
          <p>
            © {new Date().getFullYear()} MéritoPro · NIT: [Por registrar] ·{' '}
            <Link href="/legal/terminos" style={{ color: 'var(--color-cta)' }}>Términos</Link>{' · '}
            <Link href="/legal/privacidad" style={{ color: 'var(--color-cta)' }}>Privacidad</Link>
          </p>
        </div>
      </footer>
    </>
  );
}

/* ───── Subcomponentes ───── */

function Condicion({ letra, texto, verificacion }: { letra: string; texto: string; verificacion: string }) {
  return (
    <div style={{
      display: 'flex', gap: '0.875rem', padding: '0.875rem 1rem',
      backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-ia-light)', color: 'var(--color-ia)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.8125rem',
      }}>
        {letra}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{texto}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{verificacion}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', gap: '1rem', padding: '0.625rem 0',
      borderBottom: '1px solid var(--color-border)',
      fontSize: '0.9375rem',
    }}>
      <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FAQ({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9375rem' }}>{pregunta}</p>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{respuesta}</p>
    </div>
  );
}

/* ───── Estilos ───── */

const bodyStyle: React.CSSProperties = {
  fontSize: '0.9375rem', color: 'var(--color-text-primary)', lineHeight: 1.7, marginBottom: '1.5rem',
};

const h3Style: React.CSSProperties = {
  fontSize: '1.0625rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem',
};

const detailBox: React.CSSProperties = {
  marginTop: '1rem', padding: '0.25rem 0',
};

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    flexShrink: 0, width: 44, height: 44, borderRadius: 'var(--radius-full)',
    backgroundColor: bg, color, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem',
  };
}
