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

// Model routing — Abr-2026 (Plan A habilitado tras schema discriminado):
//   - Diagnóstico inicial: Haiku 4.5 por defecto (~1.6× más rápido que Sonnet,
//     bench probe Abr-2026 = 12s/lote de 5 vs 40s+ Sonnet). La primera versión
//     de Plan A rompía Zod porque el schema de `estructura` era plano; ahora
//     `ESTRUCTURA_ONEOF` discrimina por tipo y Haiku produce 5/5 válidas.
//     Escape hatch: MERITO_PLAN_A=false fuerza Sonnet.
//   - Entrenamiento: router por tipo (Sonnet para II/III, Haiku para
//     I/comportamental cuando se fuerza un solo tipo) detrás de MERITO_MODEL_ROUTING=true.
//     Lote mixto de entrenamiento usa Sonnet por seguridad.
const MODEL_ROUTING_ENTRENA = process.env.MERITO_MODEL_ROUTING === 'true';
const PLAN_A_DIAGNOSTICO = process.env.MERITO_PLAN_A !== 'false'; // default ON
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';
const MODEL_SONNET = 'claude-sonnet-4-6';

function elegirModelo(opts: { tipoSesion?: string; tipoForzado?: string }): string | undefined {
  const { tipoSesion, tipoForzado } = opts;

  // Diagnóstico: Haiku por defecto (Plan A habilitado). MERITO_PLAN_A=false
  // fuerza Sonnet si se detecta regresión.
  if (tipoSesion === 'diagnostico') {
    return PLAN_A_DIAGNOSTICO ? MODEL_HAIKU : MODEL_SONNET;
  }

  // Entrenamiento con routing activo → por tipo (Haiku solo con tipo forzado simple).
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
  // Slug del módulo a evaluar (ej. 'disciplinario'). Cuando viene,
  // el selector de tema usa SOLO el módulo correspondiente. Útil
  // para "Entrenar este módulo" desde el dashboard de diagnóstico.
  modulo_filtro: z.string().optional(),
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

// ------------------------------------------------------------
// Competencias comportamentales — Decreto 815 de 2018 (oficial).
//
// Listado canónico para el concurso PGN:
//   · 6 comunes (todos los niveles)
//   · 7 directivas (Procurador Delegado, Auxiliar)
//   · 5 nivel asesor/profesional (Procurador Judicial I/II, Profesional)
//   · 3 nivel técnico (Técnico Investigador, Sustanciador)
//   · 3 nivel asistencial/administrativo (Secretario, Auxiliar)
//
// Fuente: Decreto 815/2018, Anexos I y II + práctica CNSC en
// Convocatoria Nación 6 (situational judgment, Likert frecuencia/acuerdo).
// ------------------------------------------------------------
const COMPETENCIAS_DECRETO_815 = [
  // Comunes a todos los servidores
  'Aprendizaje continuo',
  'Orientación a resultados',
  'Orientación al usuario y al ciudadano',
  'Compromiso con la organización',
  'Trabajo en equipo',
  'Adaptación al cambio',
  // Nivel directivo
  'Visión estratégica',
  'Liderazgo efectivo',
  'Planeación',
  'Toma de decisiones',
  'Gestión del desarrollo de las personas',
  'Pensamiento sistémico',
  'Resolución de conflictos',
  // Nivel asesor / profesional
  'Aporte técnico-profesional',
  'Comunicación efectiva',
  'Gestión de procedimientos',
  'Instrumentación de decisiones',
  'Experticia profesional',
  // Nivel técnico
  'Confiabilidad técnica',
  'Disciplina',
  'Responsabilidad',
  // Nivel asistencial / administrativo
  'Manejo de la información',
  'Relaciones interpersonales',
  'Colaboración',
] as const;

const PreguntaComportamentalSchema = z.object({
  tipo: z.literal('comportamental'),
  enunciado_situacional: z.string().min(20),
  competencia_evaluada: z.enum(COMPETENCIAS_DECRETO_815),
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
// 2.b) Opciones estáticas para tipo_II y tipo_III
//
// Por diseño de la PGN (ver Directivas_Agentes_V4.md §4 y
// src/types/preguntas.ts), las opciones de tipo_II son siempre las 4
// combinaciones fijas y las de tipo_III son siempre las 5 sentencias
// canónicas. NO las pedimos al modelo (saved tokens + zero drift): las
// inyectamos aquí justo antes de devolver la pregunta al cliente.
// Los componentes TipoDos / TipoTres consumen `pregunta.opciones`.
// ------------------------------------------------------------

const OPCIONES_TIPO_II = [
  { id: 'A' as const, texto: 'Si 1 y 2 son correctas' },
  { id: 'B' as const, texto: 'Si 1 y 3 son correctas' },
  { id: 'C' as const, texto: 'Si 2 y 4 son correctas' },
  { id: 'D' as const, texto: 'Si 1, 2 y 3 son correctas' },
];

const OPCIONES_TIPO_III = [
  {
    id: 'A' as const,
    texto:
      'Afirmación es VERDADERA, Razón es VERDADERA y Razón EXPLICA la Afirmación.',
  },
  {
    id: 'B' as const,
    texto:
      'Afirmación es VERDADERA, Razón es VERDADERA pero Razón NO explica la Afirmación.',
  },
  { id: 'C' as const, texto: 'Afirmación es VERDADERA, Razón es FALSA.' },
  { id: 'D' as const, texto: 'Afirmación es FALSA, Razón es VERDADERA.' },
  { id: 'E' as const, texto: 'Afirmación es FALSA, Razón es FALSA.' },
];

// ------------------------------------------------------------
// Anti-sesgo: shuffle de opciones en Tipo I
//
// Patrón conocido de LLMs: tienden a poner la respuesta correcta en la
// primera posición (A) más del 25% del tiempo (sesgo posicional). Esto
// degrada la calidad del simulacro porque el aspirante aprende a
// "adivinar A" en lugar de razonar la pregunta.
//
// Solución: después de validar el output del modelo con Zod, barajamos
// aleatoriamente los textos de las 4 opciones y reasignamos correcta_id
// al nuevo id (A/B/C/D) que ahora contiene el texto correcto.
//
// Tipo II y Tipo III no necesitan shuffle: sus "opciones" son combinaciones
// lógicas fijas (1y2, 1y3, ambas verdaderas + explica, etc.) — el sesgo
// se mitiga vía prompt en esos casos.
// ------------------------------------------------------------
const ID_OPCIONES_TIPO_I = ['A', 'B', 'C', 'D'] as const;

function barajarOpcionesTipoI(
  estructura: z.infer<typeof PreguntaTipoISchema>
): z.infer<typeof PreguntaTipoISchema> {
  // Texto de la opción correcta antes de barajar
  const textoCorrecto =
    estructura.opciones.find((o) => o.id === estructura.correcta_id)?.texto;
  if (!textoCorrecto) return estructura;

  // Fisher-Yates sobre los textos
  const textos = estructura.opciones.map((o) => o.texto);
  for (let i = textos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [textos[i], textos[j]] = [textos[j], textos[i]];
  }

  // Reasignar ids fijos A/B/C/D a los textos en su nuevo orden
  const nuevasOpciones = textos.map((texto, i) => ({
    id: ID_OPCIONES_TIPO_I[i],
    texto,
  }));

  // Localizar el nuevo id de la opción correcta
  const nuevaCorrecta =
    nuevasOpciones.find((o) => o.texto === textoCorrecto)?.id ??
    estructura.correcta_id;

  return {
    ...estructura,
    opciones: nuevasOpciones,
    correcta_id: nuevaCorrecta,
  };
}

/**
 * Devuelve la pregunta con las opciones estáticas inyectadas en su
 * `estructura` cuando el tipo lo requiere (tipo_II / tipo_III). Para
 * tipo_I baraja las opciones para mitigar el sesgo posicional del LLM.
 *
 * Usar siempre antes de un `NextResponse.json(... pregunta ...)`.
 */
function inyectarOpcionesEstaticas(p: PreguntaEmitida): PreguntaEmitida {
  if (p.estructura.tipo === 'tipo_I') {
    return {
      ...p,
      estructura: barajarOpcionesTipoI(p.estructura),
    } as PreguntaEmitida;
  }
  if (p.estructura.tipo === 'tipo_II') {
    return {
      ...p,
      estructura: { ...p.estructura, opciones: OPCIONES_TIPO_II },
    } as PreguntaEmitida;
  }
  if (p.estructura.tipo === 'tipo_III') {
    return {
      ...p,
      estructura: { ...p.estructura, opciones: OPCIONES_TIPO_III },
    } as PreguntaEmitida;
  }
  return p;
}

// ------------------------------------------------------------
// 3) Tool specs para Anthropic
// ------------------------------------------------------------

// Estructura como discriminated union (oneOf) por tipo. Sin esto, Haiku 4.5
// mezcla campos entre tipos (correcta_id="1" en tipo_II, falta afirmacion/razon
// en tipo_III, comportamental sin competencia_evaluada). Verificado Abr-2026
// con probe directo a Anthropic: Haiku pasa 5/5 en Zod con este schema.
const ESTRUCTURA_ONEOF = {
  oneOf: [
    {
      type: 'object',
      required: ['tipo', 'enunciado', 'opciones', 'correcta_id'],
      properties: {
        tipo: { type: 'string', enum: ['tipo_I'] },
        enunciado: {
          type: 'string',
          description: 'Enunciado de la pregunta, ≥20 caracteres.',
        },
        opciones: {
          type: 'array',
          minItems: 4,
          maxItems: 4,
          items: {
            type: 'object',
            required: ['id', 'texto'],
            properties: {
              id: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
              texto: { type: 'string' },
            },
          },
        },
        correcta_id: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D'],
          description: 'SIEMPRE MAYÚSCULA.',
        },
      },
    },
    {
      type: 'object',
      required: ['tipo', 'enunciado', 'afirmaciones', 'correcta_id'],
      properties: {
        tipo: { type: 'string', enum: ['tipo_II'] },
        enunciado: { type: 'string', description: 'Enunciado ≥20 caracteres.' },
        afirmaciones: {
          type: 'array',
          minItems: 4,
          maxItems: 4,
          items: {
            type: 'object',
            required: ['id', 'texto'],
            properties: {
              id: { type: 'integer', enum: [1, 2, 3, 4] },
              texto: { type: 'string' },
            },
          },
        },
        correcta_id: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D'],
          description:
            'Combinación oficial: A=1 y 2, B=1 y 3, C=2 y 4, D=3 y 4. SIEMPRE MAYÚSCULA.',
        },
      },
    },
    {
      type: 'object',
      required: ['tipo', 'afirmacion', 'razon', 'correcta_id'],
      properties: {
        tipo: { type: 'string', enum: ['tipo_III'] },
        afirmacion: {
          type: 'string',
          description: 'Afirmación lógica ≥10 caracteres.',
        },
        razon: {
          type: 'string',
          description: 'Razón asociada ≥10 caracteres.',
        },
        correcta_id: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D', 'E'],
          description:
            'A: ambas V + razón explica. B: ambas V + razón NO explica. C: afirmación V, razón F. D: afirmación F, razón V. E: ambas F.',
        },
      },
    },
    {
      type: 'object',
      required: ['tipo', 'enunciado_situacional', 'competencia_evaluada', 'escala'],
      properties: {
        tipo: { type: 'string', enum: ['comportamental'] },
        enunciado_situacional: {
          type: 'string',
          description:
            'Situación laboral REAL PGN ≥20 caracteres. Debe ser un caso situacional concreto (no abstracto): un usuario molesto, un compañero que incumple, una decisión bajo presión, un cambio de norma, etc. Adaptado al cargo_objetivo y nivel.',
        },
        competencia_evaluada: {
          type: 'string',
          enum: [...COMPETENCIAS_DECRETO_815],
          description:
            'Competencia del Decreto 815/2018. Para nivel directivo prefiere: Visión estratégica, Liderazgo efectivo, Toma de decisiones, Gestión del desarrollo de las personas. Asesor/Profesional: Aporte técnico-profesional, Comunicación efectiva, Experticia profesional, Instrumentación de decisiones. Técnico: Confiabilidad técnica, Disciplina, Responsabilidad. Asistencial: Manejo de la información, Relaciones interpersonales, Colaboración. Comunes (cualquier nivel): Aprendizaje continuo, Orientación a resultados, Orientación al usuario y al ciudadano, Compromiso con la organización, Trabajo en equipo, Adaptación al cambio.',
        },
        escala: { type: 'string', enum: ['frecuencia', 'acuerdo'] },
      },
    },
  ],
  description:
    'Discriminada por "tipo". Cada variante expone SOLO sus campos propios; no mezclar campos entre tipos.',
};

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
  estructura: ESTRUCTURA_ONEOF,
  explicacion: {
    type: 'string',
    minLength: 30,
    description:
      'OBLIGATORIO ≥30 caracteres y ≤80 palabras. Justificación literal desde el corpus que defiende la respuesta correcta, citando la norma con "Art. X", "Ley Y" o "Sentencia Z" dentro del texto. NUNCA dejar vacío ni menor a 30 caracteres.',
  },
  norma_relacionada: {
    type: 'string',
    minLength: 10,
    description:
      'OBLIGATORIO. Cita canónica en este formato exacto: "[Nombre norma], Art. [N]" (ej. "Ley 1952 de 2019, Art. 38" o "Constitución Política 1991, Art. 275"). DEBE contener literalmente una de estas palabras: "Art.", "Ley", "Decreto", "Constitución", "Resolución", "Código", "Sentencia", "Acuerdo" o "Jurisprudencia". Si viene de web verificada, añadir "[Verificado online: URL]".',
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
  // Regla de oro: la query del retrieval lleva SÓLO el topic normativo.
  // Voyage `voyage-3-large` calibra similitud por densidad semántica, no por
  // keyword overlap; añadir sufijos como "— cargo objetivo: X — nivel N"
  // dispersa el centroide del query y deja la similitud por debajo del
  // umbral 0.55 para nombres de cargo específicos (ej. "Procurador
  // Judicial I"). El cargo y el nivel ya viajan al modelo vía el
  // `contexto_usuario` del user message — no son input del retrieval.
  // Si vuelves a verlos aquí, vas a ver REGLA 4 disparándose en cargos
  // específicos. Verificado experimentalmente Abr-2026.
  void nivel; // intencional: queda en la firma para futuras estrategias.

  if (p.tema_forzado) return p.tema_forzado;

  // ============================================================
  // CARGO-ESPECÍFICO: enriquece la query del corpus con los ejes
  // temáticos que el cargo del aspirante REALMENTE evalúa según el
  // Manual Específico de Funciones PGN.
  //
  // Esto no es opcional — sin esto, un Auxiliar Administrativo
  // recibiría preguntas de Procurador Judicial. Con esto, las queries
  // se enriquecen con palabras clave de las funciones reales del cargo.
  // ============================================================
  const cargoAspirante = p.contexto_usuario?.cargo_aspira ?? '';
  const ejesPorCargo: Record<string, string> = {
    'Procurador Judicial II':
      'intervención judicial alta complejidad orden jurídico patrimonio público Ley 1952 procesos disciplinarios complejos derechos humanos',
    'Procurador Judicial I':
      'intervención judicial primera instancia Ley 1952 acciones constitucionales tutela acción cumplimiento procesos disciplinarios ordinarios',
    'Asesor':
      'asesoría jurídica especializada conceptos despachos proyectos normativos análisis dogmático alta gerencia pública',
    'Profesional Universitario':
      'análisis técnico informes sustanciación procesos disciplinarios apoyo profesional procedimiento administrativo',
    'Coordinador Administrativo':
      'coordinación procesos administrativos gestión documental Ley 594 oficinas regionales apoyo logístico',
    'Técnico Investigador':
      'recolección de pruebas entrevistas apoyo investigativo procesos disciplinarios técnicas investigación judicial',
    'Sustanciador':
      'sustanciación expedientes proyección actos administrativos procedimiento disciplinario apoyo profesional',
    'Técnico Administrativo':
      'apoyo técnico manejo documental atención usuario soporte operativo gestión documental',
    'Secretario Ejecutivo':
      'asistencia ejecutiva agenda correspondencia atención protocolaria gestión documental',
    'Secretario':
      'recepción trámite correspondencia registros archivo oficina gestión documental Ley 594',
    'Auxiliar Administrativo':
      'apoyo operativo correspondencia archivo registros función pública servicio al ciudadano',
    'Oficinista':
      'tareas administrativas elementales registros apoyo logístico gestión documental básica',
  };
  const enriquecidoCargo = ejesPorCargo[cargoAspirante] ?? '';

  // Filtro por módulo (entrenamiento dirigido desde dashboard).
  // Mapea el slug a la query enriquecida que mejor matchea con corpus.
  if (p.modulo_filtro) {
    const slugATema: Record<string, string> = {
      estructura_estado:
        'estructura del Estado colombiano Procuraduría General de la Nación Constitución',
      disciplinario:
        'Ley 1952 de 2019 Código General Disciplinario faltas servidores públicos',
      derechos_fundamentales:
        'derechos fundamentales tutela acción judicial Constitución',
      gestion_documental: 'gestión documental archivo público Ley 594 de 2000',
      carrera_admin:
        'Ley 909 2004 carrera administrativa empleo público mérito concurso ascenso lista de elegibles CNSC provisión empleos vacancia',
      etica:
        'Código de Integridad servicio público valores honestidad respeto compromiso diligencia justicia Decreto 1499 2017 MIPG Resolución 444 PGN deber funcional principios función administrativa Constitución artículo 209',
      aptitud_verbal:
        'comprensión lectora textos normativos servicio público inferencia idea principal jurisprudencia sentencias razonamiento jurídico interpretación',
      ofimatica: 'ofimática Excel Word herramientas digitales',
      comportamental:
        'competencias comportamentales Decreto 815 2018 servidor público nivel directivo asesor profesional técnico liderazgo trabajo en equipo aprendizaje continuo orientación al ciudadano',
    };
    const tema = slugATema[p.modulo_filtro];
    if (tema) {
      // Enriquece con ejes específicos del cargo si los hay
      return enriquecidoCargo ? `${tema} ${enriquecidoCargo}` : tema;
    }
  }

  const brechas = p.contexto_usuario?.progreso_sm2.brechas ?? [];

  if (brechas.length > 0 && p.pregunta_actual >= 10) {
    // Usamos el tema de la brecha tal cual + cargo si está
    return enriquecidoCargo ? `${brechas[0]} ${enriquecidoCargo}` : brechas[0];
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
  const tema = modulosDiagnostico[p.pregunta_actual % modulosDiagnostico.length];
  return enriquecidoCargo ? `${tema} ${enriquecidoCargo}` : tema;
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

// Umbral mínimo aceptable: si el modelo primario produce < MIN_VALIDAS_ACEPTABLE
// de BATCH_SIZE válidas, re-intentamos una sola vez con Sonnet (más fiable).
// Con BATCH_SIZE=5 esto significa <3 válidas → escalación.
const MIN_VALIDAS_ACEPTABLE = Math.ceil(BATCH_SIZE / 2);

async function intentarLote(
  model: string | undefined,
  bloqueContexto: string,
  userMessage: string,
): Promise<{ validas: unknown[]; usage: AnthropicUsage; llamado: boolean }> {
  try {
    const result = await llamarAgenteHerramientaConMeta<LoteOutput>({
      bloquesSystem: [
        { text: SYSTEM_PROMPT_TUTOR_V4, cache: true },
        { text: bloqueContexto, cache: true },
      ],
      userMessage,
      tool: EMITIR_LOTE_TOOL,
      maxTokens: 6000,
      model,
    });
    const raw = result.data?.preguntas;
    if (!Array.isArray(raw)) return { validas: [], usage: result.usage, llamado: true };
    const validas: unknown[] = [];
    raw.forEach((item, i) => {
      const r = PreguntaEmitidaSchema.safeParse(item);
      if (r.success) validas.push(r.data);
      else console.warn(`[Orquestador] Pregunta lote[${i}] inválida (${model ?? 'default'}):`, r.error.issues[0]?.message);
    });
    return { validas, usage: result.usage, llamado: true };
  } catch (err) {
    console.error(`[Orquestador] Error en lote (${model ?? 'default'}):`, err);
    return { validas: [], usage: ZERO_USAGE, llamado: false };
  }
}

function sumarUsage(a: AnthropicUsage, b: AnthropicUsage): AnthropicUsage {
  return {
    input_tokens:                a.input_tokens + b.input_tokens,
    output_tokens:               a.output_tokens + b.output_tokens,
    cache_creation_input_tokens: a.cache_creation_input_tokens + b.cache_creation_input_tokens,
    cache_read_input_tokens:     a.cache_read_input_tokens + b.cache_read_input_tokens,
  };
}

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
    'RECORDATORIO CRÍTICO: "explicacion" SIEMPRE ≥30 caracteres; "norma_relacionada" DEBE contener "Art.", "Ley", "Decreto", "Constitución", "Resolución", "Código", "Sentencia", "Acuerdo" o "Jurisprudencia".',
    // Anti-sesgo posicional: distribuir la respuesta correcta de forma
    // balanceada entre A/B/C/D (Tipo I/II) y A/B/C/D/E (Tipo III).
    // Para Tipo I el shuffle se aplica también server-side post-validación;
    // para Tipo II/III es solo prompt porque las opciones son combinaciones lógicas fijas.
    `DISTRIBUCIÓN DE RESPUESTAS CORRECTAS (anti-sesgo): NO concentres correcta_id en una sola letra. En el lote de ${BATCH_SIZE} preguntas, varía explícitamente — usa A, B, C, D (y E para Tipo III) de forma balanceada. Si detectas que llevas 2 respuestas seguidas con la misma letra, escoge otra distinta para la siguiente.`,
  ].join('\n');

  // 1) Intento primario con el modelo elegido por routing (Haiku para diag por defecto).
  const modeloPrimario = elegirModelo({ tipoSesion, tipoForzado });
  const primer = await intentarLote(modeloPrimario, bloqueContexto, userMessage);
  let validas = primer.validas;
  let usage = primer.usage;

  // 2) Escalación a Sonnet si: (a) el primer intento fue con Haiku y (b) produjo
  //    menos de la mitad del lote válido. Reusa el prompt cacheado (mismos bloques),
  //    así que el coste adicional es bajo (cache_read_tokens >0).
  const escaladaNecesaria =
    modeloPrimario === MODEL_HAIKU &&
    validas.length < MIN_VALIDAS_ACEPTABLE;

  if (escaladaNecesaria) {
    console.warn(
      `[Orquestador] Haiku produjo ${validas.length}/${BATCH_SIZE} válidas — escalando a Sonnet.`,
    );
    const rescate = await intentarLote(MODEL_SONNET, bloqueContexto, userMessage);
    usage = sumarUsage(usage, rescate.usage);
    if (rescate.validas.length > validas.length) {
      validas = rescate.validas;
    }
  }

  storeBatch(sessionId, validas, startIndex, nivel);
  console.log(
    `[Orquestador] Lote almacenado: ${validas.length}/${BATCH_SIZE} válidas desde índice ${startIndex}` +
    (escaladaNecesaria ? ' (con escalación Sonnet)' : ''),
  );
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
        pregunta: inyectarOpcionesEstaticas(parsed.data),
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
      'ANTI-SESGO: NO devuelvas siempre correcta_id="A". Varía la posición de la respuesta correcta entre A/B/C/D (o A-E en Tipo III).',
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
      pregunta: inyectarOpcionesEstaticas(parsedFallback.data),
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
    pregunta: inyectarOpcionesEstaticas(pregunta),
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