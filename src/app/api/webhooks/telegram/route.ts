// ============================================================
// FASE 6: AGENTE 2 — Webhook Telegram (Inbound)
// Recibe mensajes del usuario, evalúa su respuesta con Claude,
// y devuelve feedback por Telegram.
// ============================================================

import { NextResponse } from 'next/server';
import { llamarAgente } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_MOTIVADOR_V4 as SYSTEM_PROMPT_MOTIVADOR } from '@/lib/ia/prompts';
import { enviarMensajeTelegram } from '@/lib/omnichannel/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Telegraf webhook format: body.message
    const message = body?.message;
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const userText = message.text;
    const userName = message.from?.first_name || 'Aspirante';

    // Commands
    if (userText === '/start') {
      await enviarMensajeTelegram(
        chatId,
        `👋 ¡Hola ${userName}! Soy tu *Tutor MéritoPro*.\n\nTe enviaré píldoras de repaso basadas en tu curva del olvido. Responde aquí mismo y te evaluaré al instante.\n\n📋 Tu chat ID es: \`${chatId}\`\nCópialo y pégalo en tu perfil de MéritoPro para vincular tu cuenta.`
      );
      return NextResponse.json({ ok: true });
    }

    if (userText === '/ayuda' || userText === '/help') {
      await enviarMensajeTelegram(
        chatId,
        `📚 *Comandos disponibles:*\n\n/start — Iniciar y ver tu chat ID\n/ayuda — Ver esta ayuda\n\nPuedes responder a cualquier pregunta de repaso directamente aquí. Tu tutor IA evaluará tu respuesta al instante.`
      );
      return NextResponse.json({ ok: true });
    }

    // Look up user in Supabase by telegram_chat_id
    // TODO: Uncomment when Supabase is connected
    // const supabase = await createClient();
    // const { data: usuario } = await supabase
    //   .from('usuarios')
    //   .select('*')
    //   .eq('telegram_chat_id', chatId)
    //   .single();

    // For now, simulate finding the user
    const usuario = {
      id: 'demo-user',
      nombre: userName,
      ultima_pregunta_fallada: '¿Cuáles son las faltas gravísimas según el Art. 62 de la Ley 1952 de 2019?',
    };

    // Build context for Claude
    const userMessage = `
El usuario "${usuario.nombre}" respondió a una pregunta de repaso SM-2.

**Última pregunta que falló:**
${usuario.ultima_pregunta_fallada}

**Su respuesta:**
${userText}

Evalúa si su respuesta es correcta o no. Sé estricto. Responde corto.`;

    try {
      // Call Claude 3.5 Sonnet (Agent 2)
      const evaluacion = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_MOTIVADOR,
        userMessage,
        maxTokens: 512,
      });

      await enviarMensajeTelegram(chatId, evaluacion);
    } catch {
      // Fallback if Claude API fails
      await enviarMensajeTelegram(
        chatId,
        `📝 Recibí tu respuesta, ${userName}. En este momento no puedo evaluarla automáticamente. Te recomiendo revisar la pregunta en tu sesión de entrenamiento en la app.\n\n👉 meritopro.co/dashboard/entrenar`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Webhook Telegram] Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
