'use client';

export default function PerfilPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="animate-fade-in-up">
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
          Mi Perfil
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Información personal y configuración
        </p>
      </div>

      {/* Profile Card */}
      <div className="card animate-fade-in-up" style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.05s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-ia), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            CG
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>Carlos García López</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>carlos@ejemplo.com</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <span className="form-label">Cargo al que aspira</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Procurador Judicial I</p>
          </div>
          <div className="form-group">
            <span className="form-label">Nivel jerárquico</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Profesional</p>
          </div>
          <div className="form-group">
            <span className="form-label">Profesión</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Abogado</p>
          </div>
          <div className="form-group">
            <span className="form-label">Fecha examen estimada</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Julio 2026</p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card animate-fade-in-up" style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}>
        <h3 style={{ fontSize: '1.0625rem', marginBottom: '1rem' }}>Estadísticas de estudio</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Días activos', value: '12', color: 'var(--color-ia)' },
            { label: 'Preguntas resueltas', value: '247', color: 'var(--color-cta-hover)' },
            { label: 'Racha actual', value: '3 días', color: 'var(--color-dominio-alto)' },
            { label: 'Tiempo total', value: '8.5 hrs', color: 'var(--color-text-primary)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="card animate-fade-in-up" style={{ padding: '1.5rem', animationDelay: '0.15s' }}>
        <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.75rem' }}>📱 Repaso por Telegram</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
          Conecta tu Telegram para recibir píldoras de repaso diarias basadas en tu curva del olvido.
        </p>
        <button className="btn btn-secondary">
          Conectar Telegram
        </button>
      </div>
    </div>
  );
}
