'use server';

// ============================================================
// Server Action — Sugeridor de cargo PGN basado en perfil del aspirante.
//
// Recibe profesión, años de experiencia, nivel educativo y meta salarial
// (opcional) y devuelve los TOP 3 cargos PGN para los que el aspirante
// CUMPLE los requisitos mínimos, ordenados por afinidad.
//
// Algoritmo:
//   1. Filtra cargos donde experienciaAniosMin <= años del aspirante.
//   2. Bonifica si la profesión está en profesionesAfines del cargo.
//   3. Bonifica si la formación (técnica/profesional/posgrado) cumple
//      la formacionMinima.
//   4. Si el aspirante puso meta salarial, ordena por proximidad.
//
// NO usa LLM — es determinístico, rápido (<10ms) y verificable.
// La IA en el corpus solo se usa para generación de preguntas; aquí
// la lógica es transparente para que el aspirante entienda por qué le
// sugerimos cada cargo.
// ============================================================

import { REQUISITOS_CARGOS_PGN, type RequisitoCargo } from '@/lib/concurso/datos-oficiales';

export interface PerfilAspirante {
  profesion: string;
  experienciaAnios: number;
  nivelEducativo: 'bachiller' | 'tecnologo' | 'profesional' | 'especializacion' | 'maestria_doctorado';
  metaSalarialMillones?: number;
}

export interface SugerenciaCargo {
  cargo: string;
  nivel: RequisitoCargo['nivel'];
  cumpleRequisitos: boolean;
  razon: string;
  salarioMM: [number, number];
  funcionesClave: string;
  brechaExperiencia: number; // 0 si cumple, N años faltantes si no
  scoreAfinidad: number; // 0-100
}

export interface ResultadoSugerencia {
  ok: boolean;
  sugerencias: SugerenciaCargo[];
  mensaje?: string;
}

const NIVEL_EDUCATIVO_RANK: Record<PerfilAspirante['nivelEducativo'], number> = {
  bachiller: 1,
  tecnologo: 2,
  profesional: 3,
  especializacion: 4,
  maestria_doctorado: 5,
};

function formacionRequiereProfesional(req: RequisitoCargo): boolean {
  const f = req.formacionMinima.toLowerCase();
  return /título profesional|abogado|profesional/.test(f);
}

function formacionRequierePosgrado(req: RequisitoCargo): boolean {
  return /posgrado|especialización|maestría/i.test(req.formacionMinima);
}

function formacionRequiereTecnologo(req: RequisitoCargo): boolean {
  return /tecnólogo|tecnología|técnico/i.test(req.formacionMinima);
}

function calcularScore(
  perfil: PerfilAspirante,
  req: RequisitoCargo
): { score: number; razones: string[]; cumple: boolean } {
  const razones: string[] = [];
  let score = 0;
  let cumple = true;

  // 1. Experiencia
  const brecha = req.experienciaAniosMin - perfil.experienciaAnios;
  if (brecha <= 0) {
    score += 30;
    razones.push(
      `Cumples los ${req.experienciaAniosMin} años de experiencia mínima`
    );
  } else {
    cumple = false;
    razones.push(
      `Te faltan ${brecha} año${brecha === 1 ? '' : 's'} para cumplir experiencia mínima`
    );
  }

  // 2. Formación
  const rangoUsuario = NIVEL_EDUCATIVO_RANK[perfil.nivelEducativo];
  let rangoMin = 1;
  if (formacionRequierePosgrado(req)) rangoMin = 4;
  else if (formacionRequiereProfesional(req)) rangoMin = 3;
  else if (formacionRequiereTecnologo(req)) rangoMin = 2;

  if (rangoUsuario >= rangoMin) {
    score += 30;
    if (rangoMin === 4) razones.push('Tu posgrado cumple el requisito');
    else if (rangoMin === 3) razones.push('Tu título profesional cumple');
    else if (rangoMin === 2) razones.push('Tu formación tecnológica cumple');
    else razones.push('Tu nivel educativo es suficiente');
  } else {
    cumple = false;
    if (rangoMin === 4) razones.push('Requiere posgrado (especialización mínimo)');
    else if (rangoMin === 3) razones.push('Requiere título profesional');
    else if (rangoMin === 2) razones.push('Requiere tecnología o técnica');
  }

  // 3. Profesión afín
  const profUsuario = perfil.profesion.toLowerCase().trim();
  const matchProfesion = req.profesionesAfines.some(
    (p) => p.toLowerCase().includes(profUsuario) || profUsuario.includes(p.toLowerCase())
  );
  if (matchProfesion) {
    score += 25;
    razones.push(`Tu profesión (${perfil.profesion}) es afín al cargo`);
  } else if (req.profesionesAfines.length === 1 && req.profesionesAfines[0] === 'Derecho') {
    razones.push('Cargo de Derecho — tu profesión no es afín directa');
    if (cumple) score -= 5;
  }

  // 4. Salario alineado con meta (si aplica)
  if (perfil.metaSalarialMillones) {
    const promedio = (req.salarioRangoMM[0] + req.salarioRangoMM[1]) / 2;
    const diferencia = Math.abs(promedio - perfil.metaSalarialMillones);
    if (diferencia <= 2) {
      score += 15;
      razones.push(`Salario en tu meta ($${req.salarioRangoMM[0]}M-$${req.salarioRangoMM[1]}M)`);
    } else if (promedio > perfil.metaSalarialMillones) {
      score += 8;
      razones.push(`Salario ($${promedio}M) supera tu meta`);
    }
  }

  return { score, razones, cumple };
}

export async function sugerirCargo(
  perfil: PerfilAspirante
): Promise<ResultadoSugerencia> {
  if (!perfil.profesion || perfil.experienciaAnios < 0) {
    return {
      ok: false,
      sugerencias: [],
      mensaje: 'Necesitamos tu profesión y años de experiencia para sugerir.',
    };
  }

  const evaluadas = REQUISITOS_CARGOS_PGN.map((req) => {
    const { score, razones, cumple } = calcularScore(perfil, req);
    const brecha = Math.max(0, req.experienciaAniosMin - perfil.experienciaAnios);
    return {
      cargo: req.cargo,
      nivel: req.nivel,
      cumpleRequisitos: cumple,
      razon: razones.join(' · '),
      salarioMM: req.salarioRangoMM,
      funcionesClave: req.funcionesClave,
      brechaExperiencia: brecha,
      scoreAfinidad: score,
    } satisfies SugerenciaCargo;
  });

  // Ordenar: primero cargos que cumple, dentro de cada grupo por score desc
  evaluadas.sort((a, b) => {
    if (a.cumpleRequisitos !== b.cumpleRequisitos) {
      return a.cumpleRequisitos ? -1 : 1;
    }
    return b.scoreAfinidad - a.scoreAfinidad;
  });

  return {
    ok: true,
    sugerencias: evaluadas.slice(0, 3),
  };
}
