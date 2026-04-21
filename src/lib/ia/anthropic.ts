// ============================================================
// MéritoPro V4 — Cliente Anthropic (Claude 3.5 Sonnet)
// Wrapper con prompt caching para los 3 agentes.
//
// Soporta:
//   - system prompt multi-bloque con cache_control ephemeral
//     (bloque 1 = reglas inmutables, bloque 2 = contexto RAG/Tavily)
//   - respuesta de texto libre (tutor / motivador)
//   - respuesta estructurada vía tool_use forzado (generación de preguntas)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-ant-tu-')) {
      throw new Error('ANTHROPIC_API_KEY no está configurado en .env.local');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODELO_POR_DEFECTO = 'claude-sonnet-4-20250514';

// ------------------------------------------------------------
// Tipos de entrada
// ------------------------------------------------------------

export interface BloqueSystem {
  /** Texto del bloque */
  text: string;
  /** Cachear con ephemeral (default true) */
  cache?: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

interface LlamadaBase {
  bloquesSystem: BloqueSystem[]; // [reglas inmutables, contexto RAG, ...]
  userMessage: string;
  maxTokens?: number;
  model?: string;
}

interface LlamadaTexto extends LlamadaBase {
  tool?: undefined;
}

interface LlamadaHerramienta extends LlamadaBase {
  tool: ToolSpec; // tool_choice = forzado
}

// ------------------------------------------------------------
// Construcción del array `system` con cache_control
// ------------------------------------------------------------

function construirSystemBlocks(bloques: BloqueSystem[]) {
  return bloques
    .filter((b) => b.text && b.text.trim().length > 0)
    .map((b) =>
      b.cache === false
        ? { type: 'text' as const, text: b.text }
        : {
            type: 'text' as const,
            text: b.text,
            cache_control: { type: 'ephemeral' as const },
          }
    );
}

// ------------------------------------------------------------
// Llamada de texto libre (Tutor chat, Motivador Telegram)
// ------------------------------------------------------------

export async function llamarAgenteTexto(params: LlamadaTexto): Promise<string> {
  const {
    bloquesSystem,
    userMessage,
    maxTokens = 2048,
    model = MODELO_POR_DEFECTO,
  } = params;

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: construirSystemBlocks(bloquesSystem),
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text : '';
}

// ------------------------------------------------------------
// Llamada con tool_use forzado (generación de preguntas JSON)
// ------------------------------------------------------------

export async function llamarAgenteHerramienta<T = unknown>(
  params: LlamadaHerramienta
): Promise<T | null> {
  const {
    bloquesSystem,
    userMessage,
    tool,
    maxTokens = 2048,
    model = MODELO_POR_DEFECTO,
  } = params;

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: construirSystemBlocks(bloquesSystem),
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return null;
  return toolUse.input as T;
}

// ------------------------------------------------------------
// Back-compat: API vieja (`llamarAgente` + `parsearRespuestaJSON`)
// Algunos agentes todavía no migrados (Motivador/Persuasor) la usan.
// ------------------------------------------------------------

interface AgentCallParamsLegacy {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

export async function llamarAgente(
  params: AgentCallParamsLegacy
): Promise<string> {
  return llamarAgenteTexto({
    bloquesSystem: [{ text: params.systemPrompt, cache: true }],
    userMessage: params.userMessage,
    maxTokens: params.maxTokens,
  });
}

export function parsearRespuestaJSON<T>(respuesta: string): T | null {
  try {
    let cleaned = respuesta.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    return JSON.parse(cleaned.trim()) as T;
  } catch {
    console.error('[Anthropic] JSON parse error:', respuesta.slice(0, 200));
    return null;
  }
}
