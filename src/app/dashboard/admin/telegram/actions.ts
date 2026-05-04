'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// ============================================================
// /dashboard/admin/telegram — server actions
//
// Configurar el webhook de Telegram desde la UI sin necesidad de curl
// ni manipular CRON_SECRET. La protección es: solo usuarios auth pueden
// llamar (y solo afectan al bot único del proyecto, no del usuario).
// ============================================================

export interface DiagnosticoWebhook {
  ok: boolean;
  bot_username?: string;
  bot_id?: number;
  webhook_url?: string;
  pending_updates?: number;
  ultimo_error?: string;
  ultimo_error_fecha?: string;
  configurado_correctamente?: boolean;
  error?: string;
}

interface TelegramAPI {
  ok: boolean;
  result?: unknown;
  description?: string;
}

async function urlBaseDelDeploy(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get('x-forwarded-host');
  const host = forwardedHost || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Lee el estado actual del webhook sin modificarlo. Útil para mostrar
 * un panel de diagnóstico al owner: cuál es el bot, si el webhook está
 * configurado, cuántos updates pendientes hay, último error, etc.
 */
export async function diagnosticarWebhook(): Promise<DiagnosticoWebhook> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'No autenticado' };

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { ok: false, error: 'TELEGRAM_BOT_TOKEN no configurado en env vars' };
    }

    const [meRes, infoRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: 'no-store' }),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, { cache: 'no-store' }),
    ]);

    const me = (await meRes.json()) as TelegramAPI & {
      result?: { username?: string; id?: number };
    };
    const info = (await infoRes.json()) as TelegramAPI & {
      result?: {
        url?: string;
        pending_update_count?: number;
        last_error_message?: string;
        last_error_date?: number;
      };
    };

    if (!me.ok) {
      return { ok: false, error: me.description || 'Bot no responde a getMe' };
    }

    const expectedUrl = `${await urlBaseDelDeploy()}/api/webhooks/telegram`;
    const configuradoCorrectamente = info.result?.url === expectedUrl;

    return {
      ok: true,
      bot_username: me.result?.username,
      bot_id: me.result?.id,
      webhook_url: info.result?.url,
      pending_updates: info.result?.pending_update_count,
      ultimo_error: info.result?.last_error_message,
      ultimo_error_fecha: info.result?.last_error_date
        ? new Date(info.result.last_error_date * 1000).toISOString()
        : undefined,
      configurado_correctamente: configuradoCorrectamente,
    };
  } catch (error) {
    console.error('[Admin Telegram] diagnostico error:', error);
    return { ok: false, error: 'Error de red al consultar Telegram API' };
  }
}

/**
 * Configura el webhook apuntando a la URL del deploy actual.
 * Re-ejecutable: si la URL cambia (ej. nuevo deploy con dominio
 * distinto) el endpoint sobreescribe la anterior.
 */
export async function configurarWebhook(): Promise<DiagnosticoWebhook> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'No autenticado' };

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { ok: false, error: 'TELEGRAM_BOT_TOKEN no configurado en env vars' };
    }

    const webhookUrl = `${await urlBaseDelDeploy()}/api/webhooks/telegram`;
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
      { cache: 'no-store' }
    );
    const set = (await setRes.json()) as TelegramAPI;
    if (!set.ok) {
      return { ok: false, error: set.description || 'setWebhook falló' };
    }

    // Re-leer para confirmar
    return await diagnosticarWebhook();
  } catch (error) {
    console.error('[Admin Telegram] configurar error:', error);
    return { ok: false, error: 'Error de red al configurar webhook' };
  }
}
