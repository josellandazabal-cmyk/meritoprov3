// ============================================================
// FASE 6: AGENTE 2 — Cron de Repaso Diario (SM-2)
// Vercel Cron: envía píldoras de repaso vía Telegram + Email
// a usuarios con next_review_date <= hoy.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enviarPildoraRepaso } from '@/lib/omnichannel/telegram';
import { enviarEmail, generarEmailRepaso } from '@/lib/omnichannel/resend';

export async function GET(request: Request) {
  // Proteger con CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch SM-2 repetitions due for review today
    const { data: pendientes, error: dbError } = await supabase
      .from('sm2_repetition')
      .select('id, pregunta_id, tema_relacionado, user_id')
      .lte('next_review_date', new Date().toISOString())
      .limit(50);

    if (dbError) {
      console.error('[Cron Repaso] DB Error:', dbError.message);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    // Fetch user data for each repetition
    const itemsProcesados = [];
    for (const p of pendientes || []) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, nombre, email, telegram_chat_id')
        .eq('id', p.user_id)
        .maybeSingle();

      if (usuario) {
        itemsProcesados.push({
          pregunta_id: p.pregunta_id,
          tema_relacionado: p.tema_relacionado,
          pregunta_texto: `Pregunta sobre: ${p.tema_relacionado}`,
          norma: 'Ver corpus_legal para cita exacta',
          usuarios: usuario,
        });
      }
    }

    let enviados_telegram = 0;
    let enviados_email = 0;
    const errores: string[] = [];

    for (const item of itemsProcesados) {
      const usuario = item.usuarios;

      // Canal 1: Telegram (si tiene chat_id)
      if (usuario.telegram_chat_id) {
        const ok = await enviarPildoraRepaso(
          usuario.telegram_chat_id,
          item.pregunta_texto,
          item.tema_relacionado,
          item.norma
        );
        if (ok) enviados_telegram++;
        else errores.push(`Telegram falló para ${usuario.id}`);
      }

      // Canal 2: Email (siempre)
      const htmlEmail = generarEmailRepaso(
        usuario.nombre,
        item.pregunta_texto,
        item.tema_relacionado,
        item.norma
      );

      const okEmail = await enviarEmail({
        to: usuario.email,
        subject: `🧠 ${usuario.nombre}, repasa esto hoy — ${item.tema_relacionado}`,
        html: htmlEmail,
      });

      if (okEmail) enviados_email++;
      else errores.push(`Email falló para ${usuario.id}`);
    }

    console.log(
      `[Cron Repaso] ${itemsProcesados.length} pendientes. Telegram: ${enviados_telegram}, Email: ${enviados_email}, Errores: ${errores.length}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pendientes: itemsProcesados.length,
      enviados: { telegram: enviados_telegram, email: enviados_email },
      errores: errores.length,
    });
  } catch (error) {
    console.error('[Cron Repaso] Error:', error);
    return NextResponse.json(
      { error: 'Error ejecutando cron de repaso' },
      { status: 500 }
    );
  }
}
