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
 */
export async function enviarMensajeTelegram(
  chatId: string,
  mensaje: string
): Promise<boolean> {
  try {
    const telegrafBot = getBot();
    await telegrafBot.telegram.sendMessage(chatId, mensaje, {
      parse_mode: 'Markdown',
    });
    return true;
  } catch (error) {
    console.error('[Telegram] Error enviando mensaje:', error);
    return false;
  }
}

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
