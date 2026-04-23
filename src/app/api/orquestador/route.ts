// ============================================================
// AGENTE 1: EL TUTOR (Orquestador Cognitivo) — V4 + perf/diag-batch-cache
//
// Flujo estricto (Directivas_Agentes_V4.md §1 y §3):
//   1. Validar payload Zod.
//   2. Fast-path: servir desde caché si la pregunta ya está generada.
//   3. Resolver consulta contextual (tema / debilidad / cargo).
//   4. buscarCorpusLegal(query, topK=20) — pgvector, umbral 0.55, top 20.
//   5. Si corpus vacío → buscarWebVerificado(query) — Tavily *.gov.co.
//   6. Si ambos vacíos → FRASE_RECHAZO_LITERAL (no llamar a Anthropic).
//   7. Construir system en 2 bloques cacheables:
//        [reglas V4 inmutables, contexto RAG + Tavily].
//   8. Llamar a Anthropic con emitir_lote_preguntas (5 en 1 llamada).
//   9. Validar cada pregunta con Zod, almacenar válidas en caché de sesión.
//  10. Disparar en background (after()) la generación del siguiente lote
//      cuando se sirve desde caché y la siguiente pregunta no está cacheada.
//
// Cero PREGUNTAS_DEMO. Cero invenciones. Cero fallback silencioso.
// ============================================================

import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  llamarAgenteHerramientaConMeta,
  type ToolSpec,
  type AnthropicUsage,
} from '@/lib/ia/anthropic';
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
import {
  BATCH_SIZE,
  getCached,
  storeBatch,
  setGenerating,
  needsRefill,
} from '@/lib/cache/preguntas';

// ------------------------------------------------------------
// 1) Validación del payload entrante
// ------------------------------------------------------------

const TOTAL_PREGUNTAS_DIAGNOSTICO = 40;
const TOTAL_PREGUNTAS_MIN = 3;
const TOTAL_PREGUNTAS_MAX = 60;

// topK alto para generación de lotes: más material = más diversidad temática.
const TOP_K_LOTE = 20;

// Model routing — Plan A (bench Abr-2026, commit perf/plan-a):
//   - Diagnóstico inicial: SIEMPRE Haiku 4.5 (1.6x más rápido que Sonnet, calidad
//     equivalente para Tipo I y Comportamental que dominan las primeras 40
//     preguntas). Aun en Tipo II/III mixto, la ganancia de UX justifica el
//     cambio en MVP. Si hay regresión de calidad, revertir a MODEL_ROUTING=true
//     y dejar que el router por tipo decida.
//   - Entrenamiento (modo avanzado): Sonnet para Tipo II/III (razonamiento),
//     Haiku para Tipo I/Comportamental — solo si MERITO_MODEL_ROUTING=true.
// El flag env-var queda disponible como escape hatch para forzar el comportamiento
// anterior sin redeployar.
const MODEL_ROUTING_ENTRENA = process.env.MERITO_MODEL_ROUTING === 'true';
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';
const MODEL_SONNET = 'claude-sonnet-4-6';

function elegirModelo(opts: { tipoSesion?: string; tipoForzado?: string }): string | undefined {
  const { tipoSesion, tipoForzado } = opts;

  // Diagnóstico inicial → Haiku siempre.
  if (tipoSesion === 'diagnostico') return MODEL_HAIKU;

  // Entrenamiento con routing activo → por tipo.
  if (MODEL_ROUTING_ENTRENA) {
    if (tipoForzado === 'tipo_I' || tipoForzado === 'comportamental') return MODEL_HAIKU;
    if (tipoForzado === 'tipo_II' || tipoForzado === 'tipo_III') return MODEL_SONNET;
    return MODEL_SONNET; // Lote mixto de entrenamiento → razonamiento completo
  }

  // Entrenamiento sin routing → default (anthropic.ts usa Sonnet).
  return undefined;
}

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
  tipo_forzado: z
    .enum(['tipo_I', 'tipo_II', 'tipo_III', 'comportamental'])
    .optional(),
  tema_forzado: z.string().optional(),
  total_objetivo: z
    .number()
    .int()
    .min(TOTAL_PREGUNTAS_MIN)
    .max(TOTAL_PREGUNTAS_MAX)
    .optional()
    .default(TOTAL_PREGUNTAS_DIAGNOSTICO),
  tipo_sesion: z.string().optional().default('diagnostico'),
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
      /(Art\.|Constitución|Ley|Decreto|Resolución|Sentencia|Código|Acuerdo|Jurisprudencia)/i,
      'La cita debe incluir al menos una palabra normativa (Ley/Art./Sentencia/…)'
    ),
});

type PreguntaEmitida = z.infer<typeof PreguntaEmitidaSchema>;

// ------------------------------------------------------------
// 3) Tool specs para Anthropic
// ------------------------------------------------------------

// Shared item schema — reused by both tools.
const PREGUNTA_ITEM_PROPERTIES = {
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
    description: 'Cargo PGN al que aplica el caso',
  },
  estructura: {
    type: 'object',
    description:
      'Objeto que respeta EXACTAMENTE una de las 4 estructuras oficiales (tipo_I / tipo_II / tipo_III / comportamental). IMPORTANTE: Para tipo_I, tipo_II y tipo_III es estrictamente OBLIGATORIO incluir el campo "correcta_id" (ej. "A", "B").',
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
          properties: { id: { type: 'string' }, texto: { type: 'string' } },
          required: ['id', 'texto'],
        },
      },
      correcta_id: { type: 'string' },
      afirmaciones: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'integer' }, texto: { type: 'string' } },
          required: ['id', 'texto'],
        },
      },
      afirmacion: { type: 'string' },
      razon: { type: 'string' },
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
      'Justificación literal desde el corpus con cita normativa exacta. ≥ 30 caracteres. ≤ 80 palabras (REGLA 5).',
  },
  norma_relacionada: {
    type: 'string',
    description:
      'Cita canónica: "[Norma], Art. [N], [Numeral si aplica]". Si viene de web verificada, añadir [Verificado online: URL].',
  },
};

const PREGUNTA_ITEM_REQUIRED = [
  'id',
  'modulo',
  'tema',
  'nivel_dificultad',
  'cargo_objetivo',
  'estructura',
  'explicacion',
  'norma_relacionada',
];

// Kept for 1:1 fallback generation.
const EMITIR_PREGUNTA_TOOL: ToolSpec = {
  name: 'emitir_pregunta',
  description:
    'Emite UNA pregunta de diagnóstico para el aspirante al concurso PGN 2026, siguiendo estrictamente la estructura oficial (Tipo I, II, III o Comportamental) y citando la norma exacta del corpus inyectado.',
  input_schema: {
    type: 'object',
    required: PREGUNTA_ITEM_REQUIRED,
    properties: PREGUNTA_ITEM_PROPERTIES,
  },
};

// Batch tool: generates BATCH_SIZE questions in a single Anthropic call.
const EMITIR_LOTE_TOOL: ToolSpec = {
  name: 'emitir_lote_preguntas',
  description:
    `Emite exactamente ${BATCH_SIZE} preguntas de diagnóstico para el aspirante al concurso PGN 2026. ` +
    'Cada pregunta sigue el schema oficial y cita la norma exacta del corpus inyectado. ' +
    'Varía los tipos entre las preguntas del lote.',
  input_schema: {
    type: 'object',
    required: ['preguntas'],
    properties: {
      preguntas: {
        type: 'array',
        minItems: BATCH_SIZE,
        maxItems: BATCH_SIZE,
        items: {
          type: 'object',
          required: PREGUNTA_ITEM_REQUIRED,
          properties: PREGUNTA_ITEM_PROPERTIES,
        },
      },
    },
  },
};

// ------------------------------------------------------------
// 4) Lógica de dificultad adaptativa
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

  if (brechas.length > 0 && p.pregunta_actual >= 10) {
    return `${brechas[0]} concurso PGN ${cargo} nivel ${nivel}`;
  }

  const modulosDiagnostico = [
    'estructura del Estado colombiano Procuraduría General de la Nación Constitución',
    'Ley 1952 de 2019 Código General Disciplinario principios',
    'Decreto Ley 262 de 2000 estructura funciones PGN',
    'Ley 1952 de 2019 faltas gravísimas servidores públicos',
    'derechos fundamentales tutela acción judicial',
    'gestión documental archivo público Ley 594 de 2000',
    'carrera administrativa Ley 909 de 2004 función pública',
    'ética servicio público código de integridad',
  ];
  const modulo = modulosDiagnostico[p.pregunta_actual % modulosDiagnostico.length];
  return `${modulo} — cargo objetivo: ${cargo} — nivel ${nivel}`;
}

// ------------------------------------------------------------
// 6) Generación de lote y almacenamiento en caché
// ------------------------------------------------------------

interface LoteOutput {
  preguntas: unknown[];
}

/**
 * Generates BATCH_SIZE questions via a single Anthropic call, validates each
 * with Zod, and stores the valid ones in the session cache.
 *
 * Returns the count of valid questions stored (0 means total failure).
 */
const ZERO_USAGE: AnthropicUsage = {
  input_tokens: 0, output_tokens: 0,
  cache_creation_input_tokens: 0, cache_read_input_tokens: 0,
};

async function generarYCacharLote(params: {
  sessionId: string;
  startIndex: number;
  nivel: 1 | 2 | 3;
  bloqueContexto: string;
  ctxUsuario: z.infer<typeof ContextoUsuarioSchema>;
  tipoForzado?: string;
  tipoSesion?: string;
}): Promise<{ stored: number; usage: AnthropicUsage }> {
  const { sessionId, startIndex, nivel, bloqueContexto, ctxUsuario, tipoForzado, tipoSesion } = params;

  const indices = Array.from({ length: BATCH_SIZE }, (_, i) => startIndex + i);

  const userMessage = [
    'contexto_usuario = ' + JSON.stringify(ctxUsuario),
    '',
    `tarea = "emitir_lote_preguntas"`,
    `indices_en_diagnostico = [${indices.join(', ')}]`,
    `nivel_dificultad_asignado = ${nivel}`,
    tipoForzado
      ? `tipo_obligatorio = "${tipoForzado}" (aplica este tipo a todas las preguntas del lote)`
      : `tipo_obligatorio = null (varía los tipos: incluye al menos 1 tipo_I, 1 tipo_II, 1 tipo_III y 1 comportamental en el lote)`,
    '',
    `Genera EXACTAMENTE ${BATCH_SIZE} preguntas distintas, invocando la tool \`emitir_lote_preguntas\`.`,
    'Cada pregunta cita literalmente la norma desde los fragmentos inyectados.',
    'Sin inventar normas. Sin especular. Aplica REGLA 5: explicación ≤80 palabras, cada opción ≤20 palabras.',
  ].join('\n');

  let result: { data: LoteOutput | null; usage: AnthropicUsage };
  try {
    result = await llamarAgenteHerramientaConMeta<LoteOutput>({
      bloquesSystem: [
        { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
        { text: bloqueContexto, cache: true },
      ],
      userMessage,
      tool: EMITIR_LOTE_TOOL,
      maxTokens: 6000,
      model: elegirModelo({ tipoSesion, tipoForzado }),
    });
  } catch (err) {
    console.error('[Orquestador] Error en generarYCacharLote:', err);
    storeBatch(sessionId, [], startIndex, nivel);
    return { stored: 0, usage: ZERO_USAGE };
  }

  const { data: loteRaw, usage } = result;

  if (!loteRaw?.preguntas || !Array.isArray(loteRaw.preguntas)) {
    storeBatch(sessionId, [], startIndex, nivel);
    return { stored: 0, usage };
  }

  // Validate each question individually; discard those that fail schema or lack norma.
  const validas: unknown[] = [];
  loteRaw.preguntas.forEach((raw, i) => {
    const r = PreguntaEmitidaSchema.safeParse(raw);
    if (r.success) {
      validas.push(r.data);
    } else {
      console.warn(`[Orquestador] Pregunta lote[${i}] inválida:`, r.error.issues[0]?.message);
    }
  });

  storeBatch(sessionId, validas, startIndex, nivel);
  console.log(`[Orquestador] Lote almacenado: ${validas.length}/${BATCH_SIZE} válidas desde índice ${startIndex}`);
  return { stored: validas.length, usage };
}

// ------------------------------------------------------------
// 7) Construcción del contexto RAG (corpus + Tavily)
// ------------------------------------------------------------

async function obtenerContextoRAG(
  query: string,
  topK: number,
): Promise<{ bloqueContexto: string; origenContexto: 'corpus' | 'tavily' | 'vacio' }> {
  const chunks = await buscarCorpusLegal(query, topK);
  const corpusFormateado = formatearChunksParaContexto(chunks);

  if (chunks.length > 0) {
    return {
      bloqueContexto: construirBloqueContextoRAG({ corpusFormateado, tavilyFormateado: '' }),
      origenContexto: 'corpus',
    };
  }

  const hits = await buscarWebVerificado(query);
  if (hits.length > 0) {
    return {
      bloqueContexto: construirBloqueContextoRAG({ corpusFormateado: '', tavilyFormateado: formatearTavilyParaContexto(hits) }),
      origenContexto: 'tavily',
    };
  }

  return { bloqueContexto: '', origenContexto: 'vacio' };
}

// ------------------------------------------------------------
// 8) Handler POST
// ------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 8.1 · Validación
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

  // 8.2 · Terminación de la sesión
  if (payload.pregunta_actual >= payload.total_objetivo) {
    return NextResponse.json({ completado: true });
  }

  const { lead_id, pregunta_actual, tipo_sesion, tipo_forzado } = payload;
  const nivel = calcularSiguienteNivel(payload);
  const ctxUsuario =
    payload.contexto_usuario ??
    ContextoUsuarioSchema.parse({ cargo_aspira: 'aspirante PGN' });

  // 8.3 · FAST PATH: servir desde caché
  const cached = getCached(lead_id, pregunta_actual, nivel);
  if (cached) {
    const parsed = PreguntaEmitidaSchema.safeParse(cached);
    if (parsed.success) {
      // Trigger background refill if the next question is not yet cached.
      const nextIndex = pregunta_actual + 1;
      if (nextIndex < payload.total_objetivo && needsRefill(lead_id, nextIndex)) {
        setGenerating(lead_id, nextIndex);
        after(async () => {
          const queryNext = construirQueryRAG(
            { ...payload, pregunta_actual: nextIndex },
            nivel,
          );
          const { bloqueContexto, origenContexto } = await obtenerContextoRAG(queryNext, TOP_K_LOTE);
          if (origenContexto === 'vacio') {
            // Release in-flight marker without storing anything.
            storeBatch(lead_id, [], nextIndex, nivel);
            return;
          }
          await generarYCacharLote({
            sessionId: lead_id,
            startIndex: nextIndex,
            nivel,
            bloqueContexto,
            ctxUsuario,
            tipoForzado: tipo_forzado,
            tipoSesion: tipo_sesion,
          });
        });
      }

      return NextResponse.json({
        completado: false,
        pregunta: parsed.data,
        progreso: {
          actual: pregunta_actual + 1,
          total: payload.total_objetivo,
          porcentaje: Math.round(((pregunta_actual + 1) / payload.total_objetivo) * 100),
        },
        nivel_dificultad: nivel,
        generado_por: `tutor_v4+cache+${tipo_sesion}`,
        _meta: { cache_hit: true, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0 },
      });
    }
  }

  // 8.4 · SLOW PATH: RAG fetch + batch generation
  const query = construirQueryRAG(payload, nivel);
  const { bloqueContexto, origenContexto } = await obtenerContextoRAG(query, TOP_K_LOTE);

  // 8.5 · Rechazo literal si ambos vacíos — NO se llama a Anthropic
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

  // 8.6 · Marcar como in-flight y generar lote
  setGenerating(lead_id, pregunta_actual);
  const { stored, usage: loteUsage } = await generarYCacharLote({
    sessionId: lead_id,
    startIndex: pregunta_actual,
    nivel,
    bloqueContexto,
    ctxUsuario,
    tipoForzado: tipo_forzado,
    tipoSesion: tipo_sesion,
  });

  // 8.7 · Obtener la pregunta actual del caché (puede ser null si Zod falló en todas)
  const preguntaParaServir = stored > 0
    ? PreguntaEmitidaSchema.safeParse(getCached(lead_id, pregunta_actual, nivel))
    : null;

  if (!preguntaParaServir?.success) {
    // Batch completamente inválido → fallback 1:1
    const userMessageFallback = [
      'contexto_usuario = ' + JSON.stringify(ctxUsuario),
      '',
      `tarea = "emitir_pregunta"`,
      `indice_en_diagnostico = ${pregunta_actual}`,
      `nivel_dificultad_asignado = ${nivel}`,
      tipo_forzado
        ? `tipo_obligatorio = "${tipo_forzado}"`
        : `tipo_obligatorio = null (elige entre tipo_I | tipo_II | tipo_III | comportamental)`,
      '',
      'Genera UNA sola pregunta, invocando la tool `emitir_pregunta`. ' +
        'Cita literalmente la norma desde los fragmentos inyectados; si no hay base, devuelves la frase literal de rechazo.',
    ].join('\n');

    let fallbackResult: { data: unknown; usage: AnthropicUsage } | null = null;
    try {
      fallbackResult = await llamarAgenteHerramientaConMeta({
        bloquesSystem: [
          { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
          { text: bloqueContexto, cache: true },
        ],
        userMessage: userMessageFallback,
        tool: EMITIR_PREGUNTA_TOOL,
        maxTokens: 1800,
        model: elegirModelo({ tipoSesion: tipo_sesion, tipoForzado: tipo_forzado }),
      });
    } catch (err) {
      console.error('[Orquestador] Error en fallback 1:1:', err);
      return NextResponse.json(
        { error: 'Error del modelo', detalle: (err as Error).message },
        { status: 502 }
      );
    }

    if (!fallbackResult?.data) {
      return NextResponse.json(
        { completado: false, error_controlado: true, mensaje: FRASE_RECHAZO_LITERAL },
        { status: 503 }
      );
    }

    const parsedFallback = PreguntaEmitidaSchema.safeParse(fallbackResult.data);
    if (!parsedFallback.success) {
      console.error('[Orquestador] Fallback 1:1 inválido:', parsedFallback.error.issues);
      return NextResponse.json(
        { error: 'El modelo devolvió una pregunta que no cumple el esquema V4.', detalle: parsedFallback.error.issues },
        { status: 502 }
      );
    }

    const fu = fallbackResult.usage;
    return NextResponse.json({
      completado: false,
      pregunta: parsedFallback.data,
      progreso: {
        actual: pregunta_actual + 1,
        total: payload.total_objetivo,
        porcentaje: Math.round(((pregunta_actual + 1) / payload.total_objetivo) * 100),
      },
      nivel_dificultad: nivel,
      generado_por: `tutor_v4+${origenContexto}+${tipo_sesion}+fallback1x1`,
      _meta: {
        cache_hit: false,
        input_tokens:        fu.input_tokens,
        output_tokens:       fu.output_tokens,
        cache_read_tokens:   fu.cache_read_input_tokens,
        cache_write_tokens:  fu.cache_creation_input_tokens,
      },
    });
  }

  // 8.8 · Respuesta final desde lote generado
  const pregunta: PreguntaEmitida = preguntaParaServir.data;

  return NextResponse.json({
    completado: false,
    pregunta,
    progreso: {
      actual: pregunta_actual + 1,
      total: payload.total_objetivo,
      porcentaje: Math.round(((pregunta_actual + 1) / payload.total_objetivo) * 100),
    },
    nivel_dificultad: nivel,
    generado_por: `tutor_v4+${origenContexto}+${tipo_sesion}`,
    _meta: {
      cache_hit: false,
      input_tokens:        loteUsage.input_tokens,
      output_tokens:       loteUsage.output_tokens,
      cache_read_tokens:   loteUsage.cache_read_input_tokens,
      cache_write_tokens:  loteUsage.cache_creation_input_tokens,
    },
  });
}
