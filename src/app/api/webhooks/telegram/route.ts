// ============================================================
// FASE 6: AGENTE 2 — Webhook Telegram (Inbound)
// Recibe mensajes del usuario, evalúa su respuesta con Claude,
// y devuelve feedback por Telegram.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { llamarAgente } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_MOTIVADOR_V4 } from '@/lib/ia/prompts';
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
    const userText = message.text as string;
    const userName = message.from?.first_name || 'Aspirante';

    const supabase = await createClient();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // ============================================================
    // /start <user_id>  → vinculación desde el deep-link del perfil
    // También aceptamos un UUID suelto (sin "/start") como fallback,
    // porque Telegram a veces no propaga el ?start= cuando el usuario
    // ya tenía el chat abierto.
    // ============================================================
    const esStartConToken = userText.startsWith('/start ');
    const esUuidSuelto = uuidRegex.test(userText.trim());

    if (esStartConToken || esUuidSuelto) {
      const token = esStartConToken ? userText.slice(7).trim() : userText.trim();

      if (!uuidRegex.test(token)) {
        await enviarMensajeTelegram(
          chatId,
          `❌ El enlace de vinculación no es válido. Vuelve a tu perfil en MéritoPro y haz click en "Conectar Telegram" de nuevo.`
        );
        return NextResponse.json({ ok: true });
      }

      // Validar que el user_id exista en `usuarios`
      const { data: usuarioObjetivo } = await supabase
        .from('usuarios')
        .select('id, telegram_chat_id')
        .eq('id', token)
        .maybeSingle();

      if (!usuarioObjetivo) {
        await enviarMensajeTelegram(
          chatId,
          `❌ No encontramos tu cuenta de MéritoPro. Asegúrate de estar registrado y vuelve a intentar la vinculación desde tu perfil.`
        );
        return NextResponse.json({ ok: true });
      }

      // Si ya estaba vinculada a otro chat, lo actualizamos
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ telegram_chat_id: chatId })
        .eq('id', token);

      if (updateError) {
        console.error('[Telegram /start vinculación] DB error:', updateError.message);
        await enviarMensajeTelegram(
          chatId,
          `⚠️ Hubo un error guardando la vinculación. Intenta nuevamente desde tu perfil.`
        );
        return NextResponse.json({ ok: true });
      }

      await enviarMensajeTelegram(
        chatId,
        `✅ ¡Listo, ${userName}! Tu cuenta de MéritoPro quedó vinculada a este chat.\n\nA partir de ahora recibirás:\n• Píldoras de repaso diarias (algoritmo SM-2)\n• Evaluación instantánea de tus respuestas\n\nVuelve a tu perfil en MéritoPro para ver "Telegram conectado ✓".`
      );
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // /start sin token → onboarding genérico
    // ============================================================
    if (userText === '/start') {
      await enviarMensajeTelegram(
        chatId,
        `👋 Hola ${userName}, soy tu *Tutor MéritoPro*.\n\n*Para vincular tu cuenta:*\n1. Ve a *meritopro.co* → *Mi Perfil*\n2. Click en "Conectar Telegram"\n3. *O bien*, copia el código que aparece allí y pégalo aquí en este chat.\n\nUna vez vinculado, recibirás tus píldoras de repaso diarias y podrás responderlas aquí mismo.`
      );
      return NextResponse.json({ ok: true });
    }

    if (userText === '/ayuda' || userText === '/help') {
      await enviarMensajeTelegram(
        chatId,
        `📚 *Comandos disponibles:*\n\n/start — Vincular o reactivar tu cuenta\n/ayuda — Ver esta ayuda\n\nPuedes responder a cualquier pregunta de repaso directamente aquí. Tu Tutor IA evaluará tu respuesta al instante.`
      );
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // Mensaje libre → evaluar con el Tutor IA
    // ============================================================
    const { data: usuarioDb } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (!usuarioDb) {
      await enviarMensajeTelegram(
        chatId,
        `Hola ${userName}, parece que aún no has vinculado tu cuenta de MéritoPro. Ve a tu perfil y haz click en "Conectar Telegram" para vincular automáticamente.`
      );
      return NextResponse.json({ ok: true });
    }

    // Get last failed question for context
    const { data: ultimaFallada } = await supabase
      .from('respuestas_preguntas')
      .select('pregunta_id')
      .eq('user_id', usuarioDb.id)
      .eq('correcta', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ultimaPreguntaFallada = ultimaFallada
      ? `Pregunta sobre: ${ultimaFallada.pregunta_id}`
      : 'Pregunta general de repaso SM-2';

    // Build context for Claude
    const userMessage = `
El usuario "${userName}" respondió a una pregunta de repaso SM-2.

**Última pregunta que falló:**
${ultimaPreguntaFallada}

**Su respuesta:**
${userText}

Evalúa si su respuesta es correcta o no. Sé estricto. Responde corto.`;

    try {
      // Call Claude 3.5 Sonnet (Agent 2)
      const evaluacion = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_MOTIVADOR_V4,
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
