'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { crearLead, type LeadFormState } from '@/app/(marketing)/actions';

/* ─────────────────────────────────────────────
   Datos de las 3 personas del Plan de Marketing
   ───────────────────────────────────────────── */

interface PersonaConfig {
  slug: string;
  nombre: string;
  edad: string;
  tagline: string;
  headline: string;
  headlineGradient: string;
  subheadline: string;
  promesa: string;
  dolores: { emoji: string; texto: string }[];
  objeciones: { objecion: string; respuesta: string }[];
  testimonio: {
    nombre: string;
    cargo: string;
    foto: string;
    quote: string;
    resultado: string;
  };
  stats: { valor: string; etiqueta: string }[];
  cargoDefault: string;
}

const PERSONAS: Record<string, PersonaConfig> = {
  abogada: {
    slug: 'abogada',
    nombre: 'Carolina',
    edad: '30-38 años',
    tagline: '⚖️ Para abogadas con experiencia',
    headline: 'Cómo aprobar el concurso PGN 2026 aunque trabajes 9 horas y tengas hijos',
    headlineGradient: '— sin volver a leer un solo PDF.',
    subheadline:
      'Diagnóstico gratuito de 40 preguntas que te dice tu % real de aprobar. En 30 minutos, sin tarjeta.',
    promesa:
      'MéritoPro entrena por cargo, te dice tu % real de aprobar y te entrega 30 minutos diarios de práctica que reemplazan 3 horas de PDFs.',
    dolores: [
      { emoji: '😩', texto: 'Estudias mucho pero sientes que no avanzas — el material está disperso.' },
      { emoji: '😰', texto: 'No sabes tu % real de aprobar. ¿Estás lista o estás soñando?' },
      { emoji: '💔', texto: 'El miedo a repetir el fracaso de 2018 te paraliza cada noche.' },
      { emoji: '⏰', texto: 'Trabajas 9 horas, tienes hijos. No hay tiempo para PDFs de 2.000 páginas.' },
    ],
    objeciones: [
      { objecion: '\"Ya probé cursos online y no funcionan.\"', respuesta: 'El 78 % de cursos PGN son PDFs. Aquí no lees: respondes preguntas reales con repetición espaciada.' },
      { objecion: '\"No tengo tiempo, soy mamá.\"', respuesta: '30 minutos al día. El bucle diario te dice exactamente qué repasar HOY según tus brechas.' },
      { objecion: '\"¿Y si la IA inventa cosas?\"', respuesta: 'Cero alucinaciones. Cada explicación cita la norma exacta (Ley 1952, Art. X). Si no hay base, el sistema se detiene.' },
      { objecion: '\"Es caro.\"', respuesta: 'Tu primer mes de salario PGN paga 30 veces el programa. ¿Cuánto vale evitar otro año estudiando sin entrar?' },
    ],
    testimonio: {
      nombre: 'Marisol R.',
      cargo: 'Aspirante a Procurador Judicial I',
      foto: '',
      quote: 'Llevaba 5 años intentándolo con PDFs y academias. En 8 semanas con MéritoPro mi probabilidad subió del 41 % al 78 %. La diferencia es que por fin sé exactamente dónde fallo.',
      resultado: 'Probabilidad: 41% → 78% en 8 semanas',
    },
    stats: [
      { valor: '2.826', etiqueta: 'Vacantes PGN' },
      { valor: '78%', etiqueta: 'Prob. promedio mes 2' },
      { valor: '30 min', etiqueta: 'Estudio diario' },
      { valor: '297K', etiqueta: 'Pago único COP' },
    ],
    cargoDefault: 'Procurador Judicial I',
  },
  egresado: {
    slug: 'egresado',
    nombre: 'Andrés',
    edad: '24-28 años',
    tagline: '🎓 Para recién egresados con hambre',
    headline: 'Cómo entrar a la PGN aunque seas recién egresado',
    headlineGradient: '— sin pasar 8 horas al día en YouTube y grupos de WhatsApp.',
    subheadline:
      'El método que reemplaza los PDFs gigantes. Active Recall + SM-2: 30 min/día de práctica que vencen 3 horas de lectura pasiva.',
    promesa:
      'El sistema entrena exactamente las normas que evalúan TU cargo. Cuando fallas, sabes EXACTAMENTE qué artículo te tumbó.',
    dolores: [
      { emoji: '🤯', texto: 'Estudias 8 horas al día pero no tienes método claro — sólo \"lees\".' },
      { emoji: '📱', texto: 'FOMO de los grupos de WhatsApp: crees que otros tienen info mejor.' },
      { emoji: '😓', texto: 'Compites contra abogados con 10 años de experiencia y te sientes atrás.' },
      { emoji: '👨‍👩‍👦', texto: 'Tus padres preguntan \"¿y cuándo empiezas a trabajar?\" cada semana.' },
    ],
    objeciones: [
      { objecion: '\"Soy joven y aprendo solo.\"', respuesta: 'Aprendes solo, pero no sabes si lo que aprendes es lo que se evalúa. Aquí entrenamos sobre el corpus normativo verificado.' },
      { objecion: '\"Hay PDFs gratis en Telegram.\"', respuesta: 'Esos PDFs no tienen Active Recall. Cero retención sin practicar respondiendo.' },
      { objecion: '\"¿Es más rápido que estudiar a la antigua?\"', respuesta: 'Sí — SM-2 reduce 60 % el tiempo de retención según evidencia académica.' },
      { objecion: '\"Es caro para un estudiante.\"', respuesta: 'Doble Garantía: 7 días para reembolso 100 %. Si entrenas y no clasificas, 50 % off para tu próximo intento.' },
    ],
    testimonio: {
      nombre: 'Daniel M.',
      cargo: 'Aspirante a Profesional Universitario',
      foto: '',
      quote: 'Salí de la universidad sin experiencia y compitiendo contra gente con 10 años de carrera. MéritoPro me niveló en 6 semanas. La clave: saber exactamente dónde estoy parado cada día.',
      resultado: 'Probabilidad: 28% → 72% en 6 semanas',
    },
    stats: [
      { valor: '80K+', etiqueta: 'Inscritos' },
      { valor: '60%', etiqueta: 'Menos tiempo con SM-2' },
      { valor: '30 min', etiqueta: 'Estudio diario' },
      { valor: 'Gratis', etiqueta: 'Diagnóstico' },
    ],
    cargoDefault: 'Profesional Universitario',
  },
  funcionaria: {
    slug: 'funcionaria',
    nombre: 'Gloria',
    edad: '38-50 años',
    tagline: '🏛️ Para funcionarias que merecen estabilidad',
    headline: 'Cómo conseguir tu puesto permanente en la PGN 2026',
    headlineGradient: '— sin volver a estudiar como en la universidad.',
    subheadline:
      'Aunque ya tengas 45 años y sientas que la memoria no es la de antes. SM-2 decide qué repasar para que no olvides. No depende de tu memoria, depende del método.',
    promesa:
      'Estabilidad laboral permanente. Eso es lo que ofrece la carrera administrativa de la PGN. Y eso es lo único que tu hipoteca, tus hijos y tú necesitan.',
    dolores: [
      { emoji: '📋', texto: 'Tu contrato vence cada 6 meses — ya cansada de la incertidumbre.' },
      { emoji: '😔', texto: 'No tienes tiempo ni energía para volver a \"estudiar como en la universidad\".' },
      { emoji: '👥', texto: 'Compañeros más jóvenes con menos experiencia ya están escalando.' },
      { emoji: '🏠', texto: 'La hipoteca te quita oxígeno todos los meses.' },
    ],
    objeciones: [
      { objecion: '\"A mi edad cuesta más estudiar.\"', respuesta: 'Por eso usamos SM-2 — el algoritmo decide qué repasar para que no olvides. No depende de tu memoria.' },
      { objecion: '\"Mejor le pregunto a un amigo procurador.\"', respuesta: 'Tu amigo sabe lo que sabe. El corpus tiene 11 normas completas y 3.338 fragmentos verificados.' },
      { objecion: '\"Ya probé academias presenciales.\"', respuesta: '¿Y cuánto costaron? MéritoPro es 5-10× más barato y se adapta a tu horario.' },
      { objecion: '\"No soy buena con la tecnología.\"', respuesta: 'Si usas WhatsApp, usas MéritoPro. Te enviamos preguntas por Telegram al horario que elijas.' },
    ],
    testimonio: {
      nombre: 'Luisa C.',
      cargo: 'Aspirante a Técnico Administrativo',
      foto: '',
      quote: 'Llevo 12 años contratando cada 6 meses. Cuando vi que el sistema sabe exactamente qué normas evalúan mi cargo, supe que era distinto. Estudio 30 min al día y mi % subió del 38 % al 71 %.',
      resultado: 'Probabilidad: 38% → 71% en 6 semanas',
    },
    stats: [
      { valor: '12+', etiqueta: 'Años de experiencia' },
      { valor: '71%', etiqueta: 'Prob. promedio mes 2' },
      { valor: '30 min', etiqueta: 'Estudio diario' },
      { valor: '5-10×', etiqueta: 'Más barato que academias' },
    ],
    cargoDefault: 'Técnico Administrativo',
  },
};

export default function PersonaLandingPage({ params }: { params: Promise<{ persona: string }> }) {
  // params es un Promise en Next.js, pero en client components se resuelve automáticamente
  const resolvedParams = params as unknown as { persona: string };
  const persona = PERSONAS[resolvedParams.persona];

  if (!persona) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Persona no encontrada.</p>
      </div>
    );
  }

  return <PersonaLanding p={persona} />;
}

function PersonaLanding({ p }: { p: PersonaConfig }) {
  const initialState: LeadFormState = {};
  const [state, formAction, isPending] = useActionState(crearLead, initialState);

  return (
    <>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text-primary)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
            </span>
          </Link>
          <a href="#formulario" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
            Diagnóstico Gratuito →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: 'clamp(3rem, 8vw, 5rem) 0', background: 'linear-gradient(180deg, #fff 0%, var(--color-bg-primary) 100%)' }}>
        <div className="container-wide">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div className="animate-fade-in-up">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', backgroundColor: 'var(--color-ia-light)', color: 'var(--color-ia)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                {p.tagline}
              </div>
              <h1 style={{ marginBottom: '0.5rem', maxWidth: 560 }}>
                {p.headline}{' '}
                <span className="text-gradient">{p.headlineGradient}</span>
              </h1>
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.1875rem)', color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: 500, lineHeight: 1.7 }}>
                {p.subheadline}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', maxWidth: 480 }}>
                {p.stats.map((s) => (
                  <div key={s.etiqueta} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ia)' }}>{s.valor}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.etiqueta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <div id="formulario" className="card animate-fade-in-up" style={{ padding: '2rem', animationDelay: '0.15s', maxWidth: 480, justifySelf: 'end', width: '100%' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>Diagnóstico Gratuito</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>Descubre tu nivel real en 30 minutos</p>
              </div>

              {state.errors?._form && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', color: 'var(--color-dominio-brecha)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {state.errors._form[0]}
                </div>
              )}

              <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="nombre" className="form-label">Nombre completo</label>
                  <input id="nombre" name="nombre" type="text" className="form-input" placeholder="Ej: María García López" required />
                  {state.errors?.nombre && <span className="form-error">{state.errors.nombre[0]}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Correo electrónico</label>
                  <input id="email" name="email" type="email" className="form-input" placeholder="maria@ejemplo.com" required />
                  {state.errors?.email && <span className="form-error">{state.errors.email[0]}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="celular" className="form-label">Celular</label>
                  <input id="celular" name="celular" type="tel" className="form-input" placeholder="300 123 4567" required />
                  {state.errors?.celular && <span className="form-error">{state.errors.celular[0]}</span>}
                </div>
                <input type="hidden" name="cargo_aspira" value={p.cargoDefault} />
                {/* Checkbox Habeas Data */}
                <div className="form-group">
                  <label htmlFor="acepta_datos_lp" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, cursor: 'pointer' }}>
                    <input id="acepta_datos_lp" name="acepta_datos" type="checkbox" required style={{ marginTop: '0.125rem', width: '16px', height: '16px', flexShrink: 0, accentColor: 'var(--color-ia)' }} />
                    <span>
                      Autorizo el{' '}
                      <Link href="/legal/privacidad" target="_blank" style={{ color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' }}>tratamiento de mis datos</Link>{' '}
                      y acepto los{' '}
                      <Link href="/legal/terminos" target="_blank" style={{ color: 'var(--color-ia)', fontWeight: 600, textDecoration: 'underline' }}>Términos</Link>.
                    </span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={isPending} style={{ marginTop: '0.5rem', width: '100%' }}>
                  {isPending ? 'Procesando...' : 'Iniciar Diagnóstico Gratuito →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Sin costo · 40 preguntas · Resultados inmediatos
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Dolores */}
      <section style={{ padding: '3rem 0', backgroundColor: 'var(--color-bg-white)' }}>
        <div className="container-wide">
          <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            ¿Te suena <span className="text-gradient">familiar?</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
            Si te identificas con al menos 2 de estos puntos, el diagnóstico gratuito es para ti.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {p.dolores.map((d, i) => (
              <div key={i} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{d.emoji}</span>
                <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonio */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container-narrow">
          <div className="card" style={{ padding: '2rem', border: '2px solid var(--color-cta)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-ia-light)', color: 'var(--color-ia)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
                {p.testimonio.nombre[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, marginBottom: '0.125rem' }}>{p.testimonio.nombre}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{p.testimonio.cargo}</p>
              </div>
            </div>
            <blockquote style={{ fontSize: '1.0625rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--color-text-primary)', margin: '0 0 1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--color-cta)' }}>
              &ldquo;{p.testimonio.quote}&rdquo;
            </blockquote>
            <div style={{ display: 'inline-flex', padding: '0.375rem 0.875rem', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600 }}>
              📈 {p.testimonio.resultado}
            </div>
          </div>
        </div>
      </section>

      {/* Objeciones */}
      <section style={{ padding: '3rem 0', backgroundColor: 'var(--color-bg-white)' }}>
        <div className="container-narrow">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Tus dudas, <span className="text-gradient">resueltas</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {p.objeciones.map((o, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{o.objecion}</p>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{o.respuesta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantía */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Doble Garantía <span className="text-gradient">MéritoPro</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', textAlign: 'left' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>✅ Satisfacción Inicial</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                7 días para probar sin riesgo. Si no es lo que esperabas, reembolso 100 %.
              </p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>🏆 Resultado MéritoPro</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Si entrenas y no clasificas, 50 % de descuento uso único para tu próximo intento.{' '}
                <Link href="/garantia" style={{ color: 'var(--color-ia)', fontWeight: 600 }}>Ver condiciones →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '4rem 0', background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #1e293b 100%)', color: 'white', textAlign: 'center' }}>
        <div className="container-narrow">
          <h2 style={{ marginBottom: '1rem', color: 'white' }}>{p.promesa}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
            2.826 vacantes. Tu primer salario PGN paga 30× el programa.
          </p>
          <a href="#formulario" className="btn btn-primary btn-xl">
            Tomar Diagnóstico Gratuito →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-muted)', padding: '1.5rem 0', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container-wide">
          <p>
            © {new Date().getFullYear()} MéritoPro ·{' '}
            <Link href="/legal/terminos" style={{ color: 'var(--color-cta)' }}>Términos</Link>{' · '}
            <Link href="/legal/privacidad" style={{ color: 'var(--color-cta)' }}>Privacidad</Link>{' · '}
            <Link href="/garantia" style={{ color: 'var(--color-cta)' }}>Garantía</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
