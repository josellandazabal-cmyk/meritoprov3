'use client';

// ============================================================
// SugeridorCargoIA — UI del sugeridor de cargo en /completar-perfil.
//
// Aparece como toggle opcional ANTES del select de cargo. Si el usuario
// activa "No estoy seguro qué cargo elegir", se muestra un mini-form
// (profesión, años exp., nivel educativo, meta salarial opcional) que
// llama al server action `sugerirCargo` y devuelve top 3 con razones
// transparentes (algoritmo determinístico, no opaco).
//
// Cuando elige una sugerencia, la inyecta en el campo "cargo_aspira"
// del perfil principal vía callback `onSeleccionar`.
// ============================================================

import { useState, useTransition } from 'react';
import {
  sugerirCargo,
  type PerfilAspirante,
  type SugerenciaCargo,
} from '@/app/dashboard/completar-perfil/sugerir-cargo';

interface Props {
  /** Callback cuando el aspirante elige uno de los cargos sugeridos. */
  onSeleccionar: (cargo: string, nivel: SugerenciaCargo['nivel']) => void;
  /** Profesión actual del form principal (sirve como prefill). */
  profesionInicial?: string;
}

export default function SugeridorCargoIA({
  onSeleccionar,
  profesionInicial = '',
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [profesion, setProfesion] = useState(profesionInicial);
  const [experiencia, setExperiencia] = useState<number>(0);
  const [nivel, setNivel] = useState<PerfilAspirante['nivelEducativo']>('profesional');
  const [metaSalario, setMetaSalario] = useState<string>('');
  const [sugerencias, setSugerencias] = useState<SugerenciaCargo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculando, startTransition] = useTransition();

  const handleSugerir = () => {
    setError(null);
    if (!profesion.trim() || profesion.length < 2) {
      setError('Indica tu profesión o formación.');
      return;
    }
    if (experiencia < 0 || experiencia > 50) {
      setError('Experiencia debe estar entre 0 y 50 años.');
      return;
    }
    startTransition(async () => {
      const res = await sugerirCargo({
        profesion: profesion.trim(),
        experienciaAnios: experiencia,
        nivelEducativo: nivel,
        metaSalarialMillones: metaSalario ? Number(metaSalario) : undefined,
      });
      if (!res.ok) {
        setError(res.mensaje ?? 'No se pudo calcular sugerencias.');
        return;
      }
      setSugerencias(res.sugerencias);
    });
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--color-ia-light)',
          color: 'var(--color-ia)',
          border: '1px dashed var(--color-ia)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1rem',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <span>🎯</span>
        <span>¿No tienes claro a qué cargo aspirar? — La IA lo sugiere</span>
      </button>
    );
  }

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1.25rem',
        backgroundColor: 'var(--color-ia-light)',
        border: '1px solid var(--color-ia)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ia)' }}>
          🎯 Sugerencia de cargo según tu perfil
        </p>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setSugerencias(null);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
          }}
        >
          Cerrar
        </button>
      </div>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
          lineHeight: 1.5,
        }}
      >
        Cruzamos tu perfil con los requisitos oficiales del Manual Específico
        de Funciones de la PGN. La sugerencia es transparente — verás por
        qué cada cargo aplica o no para ti.
      </p>

      {!sugerencias && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '0.75rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-sug">
                Profesión / formación
              </label>
              <input
                id="prof-sug"
                type="text"
                className="form-input"
                value={profesion}
                onChange={(e) => setProfesion(e.target.value)}
                placeholder="Ej: Derecho, Administración…"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="exp-sug">
                Años de experiencia
              </label>
              <input
                id="exp-sug"
                type="number"
                min={0}
                max={50}
                className="form-input"
                value={experiencia}
                onChange={(e) => setExperiencia(Number(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="niv-sug">
                Nivel educativo
              </label>
              <select
                id="niv-sug"
                className="form-input"
                value={nivel}
                onChange={(e) => setNivel(e.target.value as PerfilAspirante['nivelEducativo'])}
              >
                <option value="bachiller">Bachiller</option>
                <option value="tecnologo">Tecnólogo / Técnica</option>
                <option value="profesional">Profesional universitario</option>
                <option value="especializacion">Especialización</option>
                <option value="maestria_doctorado">Maestría / Doctorado</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="sal-sug">
                Meta salarial (millones, opcional)
              </label>
              <input
                id="sal-sug"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="form-input"
                value={metaSalario}
                onChange={(e) => setMetaSalario(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: '0.625rem',
                fontSize: '0.8125rem',
                color: 'var(--color-dominio-brecha)',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSugerir}
            disabled={calculando}
            className="btn btn-primary"
            style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              width: '100%',
            }}
          >
            {calculando ? 'Calculando…' : 'Calcular sugerencias →'}
          </button>
        </>
      )}

      {sugerencias && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sugerencias.map((s, i) => (
            <button
              type="button"
              key={s.cargo}
              onClick={() => onSeleccionar(s.cargo, s.nivel)}
              style={{
                textAlign: 'left',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-white)',
                border: s.cumpleRequisitos
                  ? '1px solid var(--color-dominio-alto)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.375rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Sugerencia {i + 1}
                </span>
                {s.cumpleRequisitos ? (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: 'var(--color-dominio-alto)',
                    }}
                  >
                    ✓ Cumples requisitos
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: 'var(--color-dominio-brecha)',
                    }}
                  >
                    ⚠ Te falta {s.brechaExperiencia} año{s.brechaExperiencia === 1 ? '' : 's'} de experiencia
                  </span>
                )}
              </div>
              <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>
                {s.cargo}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Salario aproximado: ${s.salarioMM[0]}M – ${s.salarioMM[1]}M / mes
              </p>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                }}
              >
                {s.funcionesClave}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-ia)',
                  fontWeight: 500,
                  fontStyle: 'italic',
                }}
              >
                {s.razon}
              </p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSugerencias(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              textDecoration: 'underline',
            }}
          >
            ← Recalcular con otros datos
          </button>
        </div>
      )}
    </div>
  );
}
