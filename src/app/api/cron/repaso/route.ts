// ============================================================
// FASE 6: AGENTE 2 — Cron de Repaso Diario (SM-2)
// Vercel Cron: envía píldoras de repaso vía Telegram + Email
// a usuarios con next_review_date <= hoy.
// ============================================================

import { NextResponse } from 'next/server';
import { enviarPildoraRepaso } from '@/lib/omnichannel/telegram';
import { enviarEmail, generarEmailRepaso } from '@/lib/omnichannel/resend';

export async function GET(request: Request) {
  // Proteger con CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // TODO: Uncomment when Supabase is connected
    // const supabase = await createClient();
    //
    // Fetch SM-2 repetitions due for review
    // const { data: pendientes } = await supabase
    //   .from('sm2_repetition')
    //   .select(`
    //     *,
    //     usuarios!inner(id, nombre, email, telegram_chat_id)
    //   `)
    //   .lte('next_review_date', new Date().toISOString())
    //   .limit(50);

    // Demo data
    const pendientes = [
      {
        pregunta_id: 'demo-001',
        tema_relacionado: 'Estructura del Estado',
        usuarios: {
          id: 'user-1',
          nombre: 'Carlos García',
          email: 'carlos@ejemplo.com',
          telegram_chat_id: null,
        },
        pregunta_texto: '¿La Procuraduría General de la Nación hace parte de qué órganos del Estado?',
        norma: 'Constitución Política 1991, Art. 117 y Art. 275',
      },
    ];

    let enviados_telegram = 0;
    let enviados_email = 0;
    const errores: string[] = [];

    for (const item of pendientes) {
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
      `[Cron Repaso] ${pendientes.length} pendientes. Telegram: ${enviados_telegram}, Email: ${enviados_email}, Errores: ${errores.length}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pendientes: pendientes.length,
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
