// ============================================================
// /api/telegram/setup — Configurar webhook del bot de Telegram
//
// El bot solo responde a comandos si Telegram sabe a qué URL enviar
// los updates. Este endpoint llama setWebhook con la URL del deploy
// actual y devuelve el estado para que el owner pueda diagnosticar.
//
// Acceso protegido por CRON_SECRET (mismo patrón que los crons) para
// que sólo el owner pueda re-configurar el webhook desde el navegador
// con header Authorization.
//
// Uso desde browser (con Auth header):
//   GET https://meritoprov3.vercel.app/api/telegram/setup
//   Authorization: Bearer <CRON_SECRET>
//
// O simplemente llamar (sin auth) y el endpoint devuelve el estado
// actual del webhook (getWebhookInfo) sin reconfigurar — útil para
// diagnóstico.
// ============================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TelegramWebhookInfo {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
  };
  description?: string;
}

interface TelegramSetWebhook {
  ok: boolean;
  result?: boolean;
  description?: string;
}

interface TelegramGetMe {
  ok: boolean;
  result?: { username?: string; first_name?: string; id?: number };
  description?: string;
}

function urlBase(req: Request): string {
  // Vercel expone la URL en x-forwarded-host. En local, NEXT_PUBLIC_SITE_URL.
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN no configurado en env vars' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  const autorizado =
    !cronSecret || authHeader === `Bearer ${cronSecret}`;

  // 1) Diagnóstico: ¿quién es el bot?
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
    cache: 'no-store',
  });
  const me = (await meRes.json()) as TelegramGetMe;

  // 2) ¿Está configurado el webhook?
  const infoRes = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
    { cache: 'no-store' }
  );
  const info = (await infoRes.json()) as TelegramWebhookInfo;

  // Si NO está autorizado, solo devolver diagnóstico (sin reconfigurar)
  if (!autorizado) {
    return NextResponse.json({
      ok: true,
      diagnostico: 'solo_lectura',
      bot: me.result,
      webhook: info.result,
      hint:
        'Para reconfigurar el webhook, llama este endpoint con header Authorization: Bearer <CRON_SECRET>',
    });
  }

  // Autorizado: configurar/actualizar el webhook
  const webhookUrl = `${urlBase(request)}/api/webhooks/telegram`;
  const setRes = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
    { cache: 'no-store' }
  );
  const setResult = (await setRes.json()) as TelegramSetWebhook;

  // Re-leer info para confirmar
  const infoFinal = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
    { cache: 'no-store' }
  );
  const infoFinalData = (await infoFinal.json()) as TelegramWebhookInfo;

  return NextResponse.json({
    ok: setResult.ok,
    bot: me.result,
    webhook_anterior: info.result,
    webhook_nuevo: infoFinalData.result,
    set_webhook_response: setResult,
    url_configurada: webhookUrl,
  });
}
