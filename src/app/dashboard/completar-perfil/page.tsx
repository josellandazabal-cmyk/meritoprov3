'use client';

// ============================================================
// /dashboard/completar-perfil
//
// Pantalla de onboarding obligatoria. Sin estos datos no se puede:
//   · Adaptar las preguntas al cargo/nivel
//   · Personalizar respuestas del Tutor IA
//   · Enviar remarketing relevante por email/Telegram
//
// Por eso es prerrequisito ANTES del diagnóstico inicial. El flujo:
//   Login → Dashboard → (gate) Completar perfil → Diagnóstico → Entrenar.
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CARGOS_CARRERA_PGN,
  NIVELES_JERARQUICOS,
  CONCURSO_PGN_2026,
} from '@/lib/concurso/datos-oficiales';
import { guardarPerfilCompleto } from './actions';
import SugeridorCargoIA from '@/components/perfil/SugeridorCargoIA';

const PROFESIONES_SUGERIDAS = [
  'Derecho',
  'Administración Pública',
  'Administración de Empresas',
  'Contaduría Pública',
  'Economía',
  'Ciencias Políticas',
  'Ingeniería Industrial',
  'Ingeniería de Sistemas',
  'Psicología',
  'Trabajo Social',
  'Sociología',
  'Comunicación Social',
  'Bachillerato',
  'Otro',
] as const;

export default function CompletarPerfilPage() {
  const router = useRouter();
  const [cargo, setCargo] = useState('');
  const [nivel, setNivel] = useState('');
  const [profesion, setProfesion] = useState('');
  const [fechaExamen, setFechaExamen] = useState<string>(
    CONCURSO_PGN_2026.inscripciones.fechaFinIso // default: fin de inscripciones (~ 12 jun 2026)
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const camposCompletos =
    cargo.length >= 2 &&
    nivel.length > 0 &&
    profesion.length >= 2 &&
    fechaExamen.length === 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposCompletos) return;
    setError(null);
    setGuardando(true);
    const r = await guardarPerfilCompleto({
      cargo_aspira: cargo,
      nivel_cargo: nivel as
        | 'directivo'
        | 'asesor'
        | 'ejecutivo'
        | 'profesional'
        | 'tecnico'
        | 'administrativo'
        | 'operativo',
      profesion,
      fecha_examen: fechaExamen,
    });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error ?? 'No se pudo guardar.');
      return;
    }
    router.push('/dashboard/diagnostico-inicial');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem' }}>
      <div className="animate-fade-in-up">
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-ia)',
            marginBottom: '0.5rem',
          }}
        >
          ⚡ Paso 1 de 2 · Onboarding
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>
          Cuéntanos sobre ti
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '1.75rem',
            lineHeight: 1.6,
          }}
        >
          Necesitamos estos datos para que tu Tutor IA, el simulacro y las píldoras
          de repaso se adapten a tu cargo real. Sin esto, todo sería genérico.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="card animate-fade-in-up"
        style={{ padding: '1.5rem', animationDelay: '0.05s' }}
      >
        {/* Sugeridor IA opcional — aparece arriba como toggle */}
        <SugeridorCargoIA
          profesionInicial={profesion}
          onSeleccionar={(cargoSugerido, nivelSugerido) => {
            setCargo(cargoSugerido);
            setNivel(nivelSugerido);
          }}
        />

        {/* Cargo aspira */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="cargo">
            Cargo al que aspiras <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            id="cargo"
            className="form-input"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            required
          >
            <option value="">— Selecciona un cargo —</option>
            {CARGOS_CARRERA_PGN.map((g) => (
              <optgroup key={g.grupo} label={g.grupo}>
                {g.cargos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.375rem',
            }}
          >
            {CONCURSO_PGN_2026.totalVacantes.toLocaleString('es-CO')} vacantes en
            la convocatoria. Elige el que más se ajuste a tu perfil.
          </p>
        </div>

        {/* Nivel jerárquico */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="nivel">
            Nivel jerárquico <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            id="nivel"
            className="form-input"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            required
          >
            <option value="">— Selecciona el nivel —</option>
            {NIVELES_JERARQUICOS.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.label}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.375rem',
            }}
          >
            Define el peso de tus pruebas (Profesional/Asesor/Ejecutivo: 70%
            conocimientos · Técnico/Admin/Operativo: 60%).
          </p>
        </div>

        {/* Profesión */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="profesion">
            Profesión / formación <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            list="profesiones"
            id="profesion"
            type="text"
            className="form-input"
            placeholder="Ej: Derecho, Administración Pública…"
            value={profesion}
            onChange={(e) => setProfesion(e.target.value)}
            required
            minLength={2}
            maxLength={120}
          />
          <datalist id="profesiones">
            {PROFESIONES_SUGERIDAS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Fecha examen estimada */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="fecha">
            Fecha estimada del examen <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="fecha"
            type="date"
            className="form-input"
            value={fechaExamen}
            onChange={(e) => setFechaExamen(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.375rem',
            }}
          >
            Inscripciones: {CONCURSO_PGN_2026.inscripciones.rango}. La fecha real
            del examen la define la PGN tras inscripciones — pon una estimada
            (usualmente 30-45 días después). Calibra la curva del olvido SM-2.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-xl"
          disabled={!camposCompletos || guardando}
          style={{ width: '100%' }}
        >
          {guardando ? 'Guardando…' : 'Guardar y continuar al diagnóstico →'}
        </button>

        <p
          style={{
            marginTop: '0.875rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Podrás editar estos datos luego desde Mi Perfil.
        </p>
      </form>
    </div>
  );
}
