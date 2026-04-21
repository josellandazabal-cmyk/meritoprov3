// ============================================================
// AGENTE 1: EL TUTOR (Orquestador Cognitivo) — V4
//
// Flujo estricto (Directivas_Agentes_V4.md §1 y §3):
//   1. Validar payload Zod.
//   2. Resolver consulta contextual (tema / debilidad / cargo).
//   3. buscarCorpusLegal(query) — pgvector, umbral 0.72, top 6.
//   4. Si corpus vacío → buscarWebVerificado(query) — Tavily *.gov.co.
//   5. Si ambos vacíos → FRASE_RECHAZO_LITERAL (no llamar a Anthropic).
//   6. Construir system en 2 bloques cacheables:
//        [reglas V4 inmutables, contexto RAG + Tavily].
//   7. Inyectar `contexto_usuario` como primer JSON del user message.
//   8. Llamar a Anthropic con tool_use forzado `emitir_pregunta`.
//   9. Validar la pregunta devuelta contra el esquema Zod canónico.
//
// Cero PREGUNTAS_DEMO. Cero invenciones. Cero fallback silencioso.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { llamarAgenteHerramienta, type ToolSpec } from '@/lib/ia/anthropic';
import {
  SYSTEM_PROMPT_TUTOR_V4,
  construirBloqueContextoRAG,
  FRASE_RECHAZO_LITERAL,
} from '@/lib/ia/prompts';
import {
  buscarCorpusLegal,
  formatearChunksParaContexto,
} from '@/lib/rag/corpus';
import {
  buscarWebVerificado,
  formatearTavilyParaContexto,
} from '@/lib/rag/tavily';

// ------------------------------------------------------------
// 1) Validación del payload entrante
// ------------------------------------------------------------

const TOTAL_PREGUNTAS_DIAGNOSTICO = 40;

const ContextoUsuarioSchema = z.object({
  cargo_aspira: z.string().min(2),
  profesion: z.string().optional().default('no_declarada'),
  nivel_educativo: z
    .enum([
      'bachiller',
      'tecnico',
      'tecnologo',
      'profesional',
      'especializacion',
      'maestria',
      'doctorado',
    ])
    .optional()
    .default('profesional'),
  progreso_sm2: z
    .object({
      dominio_alto: z.array(z.string()).default([]),
      dominio_medio: z.array(z.string()).default([]),
      brechas: z.array(z.string()).default([]),
    })
    .optional()
    .default({ dominio_alto: [], dominio_medio: [], brechas: [] }),
  indice_preparacion_actual: z.number().min(0).max(100).optional().default(0),
  dias_hasta_concurso: z.number().int().optional().default(180),
});

const PayloadSchema = z.object({
  lead_id: z.string().min(1),
  pregunta_actual: z.number().int().nonnegative(),
  nivel_actual: z.number().int().min(1).max(3).default(1),
  aciertos_consecutivos: z.number().int().nonnegative().default(0),
  fallos_consecutivos: z.number().int().nonnegative().default(0),
  respuesta_anterior: z.boolean().optional(),
  // Opcional: permite al cliente forzar tema o tipo.
  tipo_forzado: z
    .enum(['tipo_I', 'tipo_II', 'tipo_III', 'comportamental'])
    .optional(),
  tema_forzado: z.string().optional(),
  // Si el cliente no manda contexto, el orquestador cae en defaults (diagnóstico inicial).
  contexto_usuario: ContextoUsuarioSchema.optional(),
});

type Payload = z.infer<typeof PayloadSchema>;

// ------------------------------------------------------------
// 2) Esquema canónico de la pregunta emitida por el modelo
//    Debe coincidir con src/types/preguntas.ts
// ------------------------------------------------------------

const PreguntaTipoISchema = z.object({
  tipo: z.literal('tipo_I'),
  enunciado: z.string().min(20),
  opciones: z
    .array(
      z.object({
        id: z.enum(['A', 'B', 'C', 'D']),
        texto: z.string().min(1),
      })
    )
    .length(4),
  correcta_id: z.enum(['A', 'B', 'C', 'D']),
});

const PreguntaTipoIISchema = z.object({
  tipo: z.literal('tipo_II'),
  enunciado: z.string().min(20),
  afirmaciones: z
    .array(
      z.object({
        id: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        texto: z.string().min(1),
      })
    )
    .length(4),
  // Las opciones son fijas (ver types/preguntas.ts); el modelo solo elige correcta_id.
  correcta_id: z.enum(['A', 'B', 'C', 'D']),
});

const PreguntaTipoIIISchema = z.object({
  tipo: z.literal('tipo_III'),
  afirmacion: z.string().min(10),
  razon: z.string().min(10),
  correcta_id: z.enum(['A', 'B', 'C', 'D', 'E']),
});

const PreguntaComportamentalSchema = z.object({
  tipo: z.literal('comportamental'),
  enunciado_situacional: z.string().min(20),
  competencia_evaluada: z.enum([
    'Liderazgo',
    'Trabajo en equipo',
    'Toma de decisiones',
    'Orientación al ciudadano',
  ]),
  escala: z.enum(['frecuencia', 'acuerdo']),
});

const EstructuraSchema = z.discriminatedUnion('tipo', [
  PreguntaTipoISchema,
  PreguntaTipoIISchema,
  PreguntaTipoIIISchema,
  PreguntaComportamentalSchema,
]);

const PreguntaEmitidaSchema = z.object({
  id: z.string().min(3),
  modulo: z.string().min(2),
  tema: z.string().min(2),
  nivel_dificultad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  cargo_objetivo: z.string().min(2),
  estructura: EstructuraSchema,
  explicacion: z.string().min(30),
  norma_relacionada: z
    .string()
    .regex(
      /(Art\.|Constitución|Ley|Decreto|Resolución|Sentencia)/i,
      'La cita debe incluir al menos una palabra normativa (Ley/Art./Sentencia/…)'
    ),
});

type PreguntaEmitida = z.infer<typeof PreguntaEmitidaSchema>;

// ------------------------------------------------------------
// 3) Tool spec para Anthropic (forzamos salida estructurada)
// ------------------------------------------------------------

const EMITIR_PREGUNTA_TOOL: ToolSpec = {
  name: 'emitir_pregunta',
  description:
    'Emite UNA pregunta de diagnóstico para el aspirante al concurso PGN 2026, siguiendo estrictamente la estructura oficial (Tipo I, II, III o Comportamental) y citando la norma exacta del corpus inyectado.',
  input_schema: {
    type: 'object',
    required: [
      'id',
      'modulo',
      'tema',
      'nivel_dificultad',
      'cargo_objetivo',
      'estructura',
      'explicacion',
      'norma_relacionada',
    ],
    properties: {
      id: { type: 'string', description: 'Identificador único, ej: n2-045' },
      modulo: {
        type: 'string',
        description:
          'Módulo temático: eje_disciplinario | normas_servicio_publico | constitucional | comportamental | gestion_documental',
      },
      tema: { type: 'string' },
      nivel_dificultad: { type: 'integer', enum: [1, 2, 3] },
      cargo_objetivo: {
        type: 'string',
        description: 'Cargo PGN al que aplica el caso (debe coincidir con cargo_aspira cuando aplique)',
      },
      estructura: {
        type: 'object',
        description:
          'Objeto que respeta EXACTAMENTE una de las 4 estructuras oficiales (tipo_I / tipo_II / tipo_III / comportamental).',
        properties: {
          tipo: {
            type: 'string',
            enum: ['tipo_I', 'tipo_II', 'tipo_III', 'comportamental'],
          },
          enunciado: { type: 'string' },
          opciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                texto: { type: 'string' },
              },
              required: ['id', 'texto'],
            },
          },
          correcta_id: { type: 'string' },
          // tipo_II
          afirmaciones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                texto: { type: 'string' },
              },
              required: ['id', 'texto'],
            },
          },
          // tipo_III
          afirmacion: { type: 'string' },
          razon: { type: 'string' },
          // comportamental
          enunciado_situacional: { type: 'string' },
          competencia_evaluada: {
            type: 'string',
            enum: [
              'Liderazgo',
              'Trabajo en equipo',
              'Toma de decisiones',
              'Orientación al ciudadano',
            ],
          },
          escala: { type: 'string', enum: ['frecuencia', 'acuerdo'] },
        },
        required: ['tipo'],
      },
      explicacion: {
        type: 'string',
        description:
          'Justificación literal desde el corpus con cita normativa exacta. ≥ 30 caracteres.',
      },
      norma_relacionada: {
        type: 'string',
        description:
          'Cita canónica: "[Norma], Art. [N], [Numeral si aplica]". Si viene de web verificada, añadir [Verificado online: URL].',
      },
    },
  },
};

// ------------------------------------------------------------
// 4) Lógica de dificultad adaptativa (espejo del algoritmo V4)
// ------------------------------------------------------------

function calcularSiguienteNivel(p: Payload): 1 | 2 | 3 {
  const base = p.nivel_actual as 1 | 2 | 3;
  if (p.aciertos_consecutivos >= 2 && base < 3) return (base + 1) as 1 | 2 | 3;
  if (p.fallos_consecutivos >= 2 && base > 1) return (base - 1) as 1 | 2 | 3;
  return base;
}

// ------------------------------------------------------------
// 5) Construcción de la consulta para RAG/Tavily
// ------------------------------------------------------------

function construirQueryRAG(p: Payload, nivel: 1 | 2 | 3): string {
  if (p.tema_forzado) return p.tema_forzado;

  const brechas = p.contexto_usuario?.progreso_sm2.brechas ?? [];
  const cargo = p.contexto_usuario?.cargo_aspira ?? 'aspirante PGN';

  // Si hay brechas y estamos en diagnóstico avanzado, ataca la más crítica.
  if (brechas.length > 0 && p.pregunta_actual >= 10) {
    return `${brechas[0]} concurso PGN ${cargo} nivel ${nivel}`;
  }

  // Diagnóstico inicial: barrido temático estructurado por el índice de pregunta.
  const modulosDiagnostico = [
    'estructura del Estado colombiano Procuraduría General de la Nación Constitución',
    'Ley 1952 de 2019 Código General Disciplinario principios',
    'Decreto Ley 262 de 2000 estructura funciones PGN',
    'faltas gravísimas servidores públicos PGN',
    'derechos fundamentales tutela acción judicial',
    'gestión documental archivo público Ley 594 de 2000',
    'carrera administrativa Ley 909 de 2004 función pública',
    'ética servicio público código de integridad',
  ];
  const modulo =
    modulosDiagnostico[p.pregunta_actual % modulosDiagnostico.length];

  return `${modulo} — cargo objetivo: ${cargo} — nivel ${nivel}`;
}

// ------------------------------------------------------------
// 6) Handler POST
// ------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 6.1 · Validación
  let payload: Payload;
  try {
    const raw = await req.json();
    payload = PayloadSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: 'Payload inválido', detalle: (err as Error).message },
      { status: 400 }
    );
  }

  // 6.2 · Terminación del diagnóstico
  if (payload.pregunta_actual >= TOTAL_PREGUNTAS_DIAGNOSTICO) {
    return NextResponse.json({ completado: true });
  }

  // 6.3 · Nivel adaptativo
  const nivel = calcularSiguienteNivel(payload);

  // 6.4 · Consulta al corpus
  const query = construirQueryRAG(payload, nivel);
  const chunks = await buscarCorpusLegal(query);

  let corpusFormateado = formatearChunksParaContexto(chunks);
  let tavilyFormateado = '';
  let origenContexto: 'corpus' | 'tavily' | 'vacio' = chunks.length
    ? 'corpus'
    : 'vacio';

  // 6.5 · Fallback Tavily SOLO si corpus vacío
  if (chunks.length === 0) {
    const hits = await buscarWebVerificado(query);
    if (hits.length > 0) {
      tavilyFormateado = formatearTavilyParaContexto(hits);
      origenContexto = 'tavily';
    }
  }

  // 6.6 · Rechazo literal si ambos vacíos — NO se llama a Anthropic
  if (origenContexto === 'vacio') {
    return NextResponse.json(
      {
        completado: false,
        error_controlado: true,
        mensaje: FRASE_RECHAZO_LITERAL,
        query_intentada: query,
      },
      { status: 503 }
    );
  }

  // 6.7 · System en 2 bloques cacheables
  const bloqueContexto = construirBloqueContextoRAG({
    corpusFormateado,
    tavilyFormateado,
  });

  // 6.8 · User message con contexto_usuario como primer payload JSON
  const ctxUsuario =
    payload.contexto_usuario ??
    ContextoUsuarioSchema.parse({ cargo_aspira: 'aspirante PGN' });

  const userMessage = [
    'contexto_usuario = ' + JSON.stringify(ctxUsuario),
    '',
    `tarea = "emitir_pregunta"`,
    `indice_en_diagnostico = ${payload.pregunta_actual}`,
    `nivel_dificultad_asignado = ${nivel}`,
    payload.tipo_forzado
      ? `tipo_obligatorio = "${payload.tipo_forzado}"`
      : `tipo_obligatorio = null (puedes elegir entre tipo_I | tipo_II | tipo_III | comportamental; respeta la rotación oficial)`,
    '',
    'Genera UNA sola pregunta, invocando la tool `emitir_pregunta`. ' +
      'Cita literalmente la norma desde los fragmentos inyectados; si no hay base, devuelves la frase literal de rechazo (no inventes).',
  ].join('\n');

  // 6.9 · Llamada al modelo con tool_use forzado
  let preguntaCruda: unknown = null;
  try {
    preguntaCruda = await llamarAgenteHerramienta({
      bloquesSystem: [
        { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
        { text: bloqueContexto, cache: true },
      ],
      userMessage,
      tool: EMITIR_PREGUNTA_TOOL,
      maxTokens: 1800,
    });
  } catch (err) {
    console.error('[Orquestador] Error llamando Anthropic:', err);
    return NextResponse.json(
      { error: 'Error del modelo', detalle: (err as Error).message },
      { status: 502 }
    );
  }

  if (!preguntaCruda) {
    return NextResponse.json(
      {
        completado: false,
        error_controlado: true,
        mensaje: FRASE_RECHAZO_LITERAL,
      },
      { status: 503 }
    );
  }

  // 6.10 · Validación Zod de la pregunta emitida
  const parsed = PreguntaEmitidaSchema.safeParse(preguntaCruda);
  if (!parsed.success) {
    console.error(
      '[Orquestador] Pregunta inválida del modelo:',
      parsed.error.issues
    );
    return NextResponse.json(
      {
        error: 'El modelo devolvió una pregunta que no cumple el esquema V4.',
        detalle: parsed.error.issues,
      },
      { status: 502 }
    );
  }

  const pregunta: PreguntaEmitida = parsed.data;

  // 6.11 · Respuesta final
  return NextResponse.json({
    completado: false,
    pregunta,
    progreso: {
      actual: payload.pregunta_actual + 1,
      total: TOTAL_PREGUNTAS_DIAGNOSTICO,
      porcentaje: Math.round(
        ((payload.pregunta_actual + 1) / TOTAL_PREGUNTAS_DIAGNOSTICO) * 100
      ),
    },
    nivel_dificultad: nivel,
    generado_por: `tutor_v4+${origenContexto}`,
  });
}
