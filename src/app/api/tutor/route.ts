// ============================================================
// /api/tutor — Endpoint del Tutor IA (chat in-app)
//
// Flujo (cumple Directivas_Agentes_V4.md):
//   1. Valida sesión auth (chat solo para usuarios logueados).
//   2. Lee contexto_usuario desde `usuarios` + `leads` (cargo_aspira, etc.).
//   3. RAG: buscarCorpusLegal(mensaje) sobre pgvector.
//   4. Si 0 chunks → fallback Tavily a *.gov.co.
//   5. Si tampoco → devuelve la FRASE_RECHAZO_LITERAL (REGLA 4).
//   6. Si hay contexto → llama al Tutor con SYSTEM_PROMPT_TUTOR_V4
//      + chunks como segundo bloque del system (cacheable).
//
// El user message va prefijado con el JSON `contexto_usuario` (REGLA
// hiper-personalización).
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

async function obtenerContextoUsuario(
  userId: string
): Promise<ContextoUsuario> {
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload inválido' },
        { status: 400 }
      );
    }

    const { mensaje } = parsed.data;
    const contexto = await obtenerContextoUsuario(user.id);

    // 1) RAG primario sobre corpus_legal
    const chunks = await buscarCorpusLegal(mensaje, 6);
    let bloqueContexto = formatearChunksParaContexto(chunks);
    let fuente: 'corpus' | 'tavily' | 'rechazo' = 'corpus';

    // 2) Fallback Tavily si corpus vacío
    if (chunks.length === 0) {
      const hits = await buscarWebVerificado(mensaje);
      if (hits.length > 0) {
        bloqueContexto = formatearTavilyParaContexto(hits);
        fuente = 'tavily';
      } else {
        // 3) Rechazo literal
        return NextResponse.json({
          respuesta: FRASE_RECHAZO_LITERAL,
          fuente: 'rechazo',
        });
      }
    }

    // 4) Llamar al Tutor con system prompt + bloque de contexto cacheable
    const userMessage = `contexto_usuario = ${JSON.stringify(contexto)}

Pregunta del aspirante:
${mensaje}`;

    const respuesta = await llamarAgenteTexto({
      bloquesSystem: [
        { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
        { text: bloqueContexto, cache: false },
      ],
      userMessage,
      maxTokens: 1024,
    });

    if (!respuesta || respuesta.trim().length === 0) {
      return NextResponse.json({
        respuesta: FRASE_RECHAZO_LITERAL,
        fuente: 'rechazo',
      });
    }

    return NextResponse.json({ respuesta, fuente });
  } catch (error) {
    console.error('[/api/tutor] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del tutor' },
      { status: 500 }
    );
  }
}
