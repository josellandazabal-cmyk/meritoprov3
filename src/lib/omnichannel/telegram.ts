// ============================================================
// MéritoPro V3 — Configuración Telegraf (Agente 2: Motivador)
// ============================================================

import { Telegraf } from 'telegraf';

let bot: Telegraf | null = null;

export function getBot(): Telegraf {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    }
    bot = new Telegraf(token);
  }
  return bot;
}

/**
 * Envía un mensaje de texto a un chat de Telegram.
 *
 * Soporta `reply_markup` para botones (reply keyboard o inline keyboard).
 * Si se omite, simplemente envía el mensaje plano.
 */
export async function enviarMensajeTelegram(
  chatId: string,
  mensaje: string,
  opciones?: {
    reply_markup?: unknown;
    parse_mode?: 'Markdown' | 'HTML' | 'MarkdownV2';
  }
): Promise<boolean> {
  try {
    const telegrafBot = getBot();
    await telegrafBot.telegram.sendMessage(chatId, mensaje, {
      parse_mode: opciones?.parse_mode ?? 'Markdown',
      ...(opciones?.reply_markup
        ? { reply_markup: opciones.reply_markup as never }
        : {}),
    });
    return true;
  } catch (error) {
    console.error('[Telegram] Error enviando mensaje:', error);
    return false;
  }
}

// ============================================================
// TECLADO DE BOTONES PERSISTENTE — UX para usuarios no técnicos.
//
// Telegram permite mostrar un "reply keyboard" debajo del input bar
// que reemplaza el teclado nativo con botones predefinidos. Es la
// forma estándar de exponer comandos sin obligar al usuario a
// escribir "/stats" o conocer slash-commands.
//
// resize_keyboard: ajusta tamaño al contenido (más cómodo en móvil)
// is_persistent: el teclado se mantiene visible entre mensajes
// ============================================================
export const TECLADO_PRINCIPAL = {
  keyboard: [
    [{ text: '📊 Mi progreso' }, { text: '💡 Técnica del día' }],
    [{ text: '📝 Inscripciones' }, { text: '❓ Hacer una consulta' }],
    [{ text: '🆘 Ayuda' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
} as const;

/**
 * Texto que Telegram envía al webhook cuando el usuario presiona un
 * botón del teclado principal. Los exportamos para que el handler los
 * mapee a la acción correspondiente.
 */
export const BOTONES_TEXTO = {
  PROGRESO: '📊 Mi progreso',
  HACK: '💡 Técnica del día',
  INSCRIPCIONES: '📝 Inscripciones',
  CONSULTA: '❓ Hacer una consulta',
  AYUDA: '🆘 Ayuda',
} as const;

/**
 * Envía una píldora de repaso SM-2 al usuario por Telegram.
 */
export async function enviarPildoraRepaso(
  chatId: string,
  pregunta: string,
  tema: string,
  norma: string
): Promise<boolean> {
  const mensaje = `🧠 *Píldora de Repaso — MéritoPro*

📋 *Tema:* ${tema}

${pregunta}

📜 _${norma}_

💡 Responde aquí mismo para que tu tutor te evalúe.`;

  return enviarMensajeTelegram(chatId, mensaje);
}

// ============================================================
// Obtener el username del bot (cacheado).
// Si la env var NEXT_PUBLIC_TELEGRAM_BOT_USERNAME está definida, la
// usa (evita una llamada a la API). Si no, llama getMe() y cachea.
// ============================================================

let botUsernameCache: string | null = null;

export async function obtenerBotUsername(): Promise<string | null> {
  if (botUsernameCache) return botUsernameCache;

  const fromEnv = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, '');
  if (fromEnv) {
    botUsernameCache = fromEnv;
    return botUsernameCache;
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; result?: { username?: string } };
    if (!data.ok || !data.result?.username) return null;
    botUsernameCache = data.result.username;
    return botUsernameCache;
  } catch (error) {
    console.warn('[Telegram] obtenerBotUsername falló:', error);
    return null;
  }
}
