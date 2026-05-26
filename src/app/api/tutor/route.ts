// ============================================================
// /api/tutor — Endpoint del Tutor IA (chat in-app)
//
// Flujo:
//   0. Guard tópico — rechaza preguntas obviamente fuera del ámbito PGN.
//   1. Límite diario — máx LIMITE_DIARIO peticiones/usuario/día (429 si excede).
//   2. Valida sesión auth.
//   3. RAG sobre corpus_legal → fallback Tavily → rechazo literal.
//   4. Llama al Tutor con SYSTEM_PROMPT_TUTOR_V4.
//   5. Incrementa contador de uso diario.
// ============================================================

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { llamarAgenteTexto } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_TUTOR_V4, FRASE_RECHAZO_LITERAL } from '@/lib/ia/prompts';
import {
  buscarCorpusLegal,
  formatearChunksParaContexto,
} from '@/lib/rag/corpus';
import {
  buscarWebVerificado,
  formatearTavilyParaContexto,
} from '@/lib/rag/tavily';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ── Configuración de límite ───────────────────────────────────────────────
const LIMITE_DIARIO = 20; // peticiones por usuario por día

// ── Guard de tópico — rechaza antes de llegar a RAG/Claude ───────────────
// Patrones de preguntas claramente fuera del ámbito jurídico/concurso PGN.
const PATRONES_OFF_TOPIC = [
  /\breceta[s]?\s+de\b/i,
  /\bcocina[r]?\b/i,
  /\bpelícula[s]?|serie[s]?\s+(de\s+tv|netflix)/i,
  /\bmúsica\b.*\b(canción|artista|álbum)\b/i,
  /\b(chiste[s]?|broma[s]?)\b/i,
  /\b(criptomoneda[s]?|bitcoin|ethereum|nft)\b/i,
  /\b(partido\s+de\s+fútbol|marcador|gol[es]?)\b/i,
  /\b(horóscopo|tarot|astrología)\b/i,
  /\b(dieta|adelgazar|ejercicio\s+físico)\b/i,
  /\b(videojuego[s]?|gaming|gamer)\b/i,
];

function esOffTopic(mensaje: string): boolean {
  return PATRONES_OFF_TOPIC.some((p) => p.test(mensaje));
}

// ─────────────────────────────────────────────────────────────────────────

const PayloadSchema = z.object({
  mensaje: z.string().min(1, 'Mensaje vacío').max(2000, 'Mensaje demasiado largo'),
});

interface ContextoUsuario {
  cargo_aspira: string;
  profesion: string;
  nivel_educativo: string;
  progreso_sm2: {
    dominio_alto: string[];
    dominio_medio: string[];
    brechas: string[];
  };
  indice_preparacion_actual: number;
  dias_hasta_concurso: number;
}

const CONTEXTO_DEFAULT: ContextoUsuario = {
  cargo_aspira: 'aspirante PGN',
  profesion: 'Por definir',
  nivel_educativo: 'Profesional',
  progreso_sm2: { dominio_alto: [], dominio_medio: [], brechas: [] },
  indice_preparacion_actual: 0,
  dias_hasta_concurso: 180,
};

function diasHasta(iso: string | null): number {
  if (!iso) return CONTEXTO_DEFAULT.dias_hasta_concurso;
  const fecha = new Date(iso).getTime();
  if (Number.isNaN(fecha)) return CONTEXTO_DEFAULT.dias_hasta_concurso;
  const hoy = Date.now();
  const dias = Math.round((fecha - hoy) / 86_400_000);
  return Math.max(0, dias);
}

async function obtenerContextoUsuario(userId: string): Promise<ContextoUsuario> {
  try {
    const supabase = await createClient();
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('lead_id, profesion, nivel_cargo, fecha_examen')
      .eq('id', userId)
      .maybeSingle();

    let cargoAspira = CONTEXTO_DEFAULT.cargo_aspira;
    if (perfil?.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('cargo_aspira')
        .eq('id', perfil.lead_id)
        .maybeSingle();
      if (lead?.cargo_aspira) cargoAspira = lead.cargo_aspira;
    }

    return {
      cargo_aspira: cargoAspira,
      profesion: perfil?.profesion?.trim() || CONTEXTO_DEFAULT.profesion,
      nivel_educativo: CONTEXTO_DEFAULT.nivel_educativo,
      progreso_sm2: CONTEXTO_DEFAULT.progreso_sm2,
      indice_preparacion_actual: CONTEXTO_DEFAULT.indice_preparacion_actual,
      dias_hasta_concurso: diasHasta(perfil?.fecha_examen ?? null),
    };
  } catch {
    return CONTEXTO_DEFAULT;
  }
}

export async function POST(request: Request) {
  try {
    // ── 0. Guard de tópico (antes de auth — sin costo) ───────────────────
    const body = await request.json().catch(() => null);
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload inválido' },
        { status: 400 }
      );
    }
    const { mensaje } = parsed.data;

    if (esOffTopic(mensaje)) {
      return NextResponse.json({ respuesta: FRASE_RECHAZO_LITERAL, fuente: 'rechazo' });
    }

    // ── 1. Auth ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // ── 2. Límite diario ──────────────────────────────────────────────────
    const hoy = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('peticiones_tutor_hoy, fecha_peticiones')
      .eq('id', user.id)
      .maybeSingle();

    const mismaFecha = perfil?.fecha_peticiones === hoy;
    const usadasHoy  = mismaFecha ? (perfil?.peticiones_tutor_hoy ?? 0) : 0;

    if (usadasHoy >= LIMITE_DIARIO) {
      return NextResponse.json(
        {
          error: `Límite diario alcanzado. Puedes hacer hasta ${LIMITE_DIARIO} consultas por día. Vuelve mañana para continuar tu preparación.`,
          limite_diario: LIMITE_DIARIO,
          usadas_hoy: usadasHoy,
        },
        { status: 429 }
      );
    }

    // ── 3. Contexto usuario + RAG ─────────────────────────────────────────
    const contexto = await obtenerContextoUsuario(user.id);

    const chunks = await buscarCorpusLegal(mensaje, 6);
    let bloqueContexto = formatearChunksParaContexto(chunks);
    let fuente: 'corpus' | 'tavily' | 'rechazo' = 'corpus';

    if (chunks.length === 0) {
      const hits = await buscarWebVerificado(mensaje);
      if (hits.length > 0) {
        bloqueContexto = formatearTavilyParaContexto(hits);
        fuente = 'tavily';
      } else {
        return NextResponse.json({ respuesta: FRASE_RECHAZO_LITERAL, fuente: 'rechazo' });
      }
    }

    // ── 4. Llamar al Tutor ────────────────────────────────────────────────
    const userMessage = `contexto_usuario = ${JSON.stringify(contexto)}\n\nPregunta del aspirante:\n${mensaje}`;

    const respuesta = await llamarAgenteTexto({
      bloquesSystem: [
        { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
        { text: bloqueContexto, cache: false },
      ],
      userMessage,
      maxTokens: 800, // reducido para controlar costos (era 1024)
    });

    if (!respuesta || respuesta.trim().length === 0) {
      return NextResponse.json({ respuesta: FRASE_RECHAZO_LITERAL, fuente: 'rechazo' });
    }

    // ── 5. Incrementar uso diario (fire-and-forget, no bloquea respuesta) ─
    supabase.from('usuarios').update({
      peticiones_tutor_hoy: mismaFecha ? usadasHoy + 1 : 1,
      fecha_peticiones:     hoy,
    }).eq('id', user.id).then(() => { /* ignore result */ });

    return NextResponse.json({
      respuesta,
      fuente,
      _uso: { usadas_hoy: usadasHoy + 1, limite_diario: LIMITE_DIARIO },
    });

  } catch (error) {
    console.error('[/api/tutor] Error:', error);
    return NextResponse.json({ error: 'Error interno del tutor' }, { status: 500 });
  }
}
