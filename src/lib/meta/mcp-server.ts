// ============================================================
// MéritoPro — Meta Graph API v20.0 Integration
// Expone herramientas para audiencias personalizadas, CAPI,
// lead ads, insights y gestión de campañas.
//
// Emails se hashean con SHA-256 antes de enviar a Meta (CAPI req).
// ============================================================

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Tool definitions (compatible con MCP o uso directo)
// ---------------------------------------------------------------------------

export interface MetaTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const META_TOOLS: MetaTool[] = [
  {
    name: 'meta_update_custom_audience',
    description: 'Agrega o remueve emails de una audiencia personalizada de Meta Ads.',
    inputSchema: {
      type: 'object',
      properties: {
        audience_id: { type: 'string', description: 'ID de la audiencia en Meta' },
        emails: { type: 'string', description: 'Array JSON de emails a procesar' },
        accion: { type: 'string', description: '"ADD" o "REMOVE"' },
      },
      required: ['audience_id', 'emails', 'accion'],
    },
  },
  {
    name: 'meta_send_capi_event',
    description: 'Envía un evento de conversión al Conversion API de Meta.',
    inputSchema: {
      type: 'object',
      properties: {
        event_name: { type: 'string', description: 'Nombre del evento (ej: Purchase, Lead)' },
        email: { type: 'string', description: 'Email del usuario' },
        valor_cop: { type: 'number', description: 'Valor de la conversión en COP' },
        event_time: { type: 'number', description: 'Unix timestamp del evento' },
        event_id: { type: 'string', description: 'ID único del evento (deduplicación)' },
      },
      required: ['event_name', 'email', 'event_time', 'event_id'],
    },
  },
  {
    name: 'meta_get_lead_ads',
    description: 'Obtiene leads capturados por formularios de Meta Lead Ads.',
    inputSchema: {
      type: 'object',
      properties: {
        form_id: { type: 'string', description: 'ID del formulario de Lead Ads' },
        limit: { type: 'number', description: 'Máximo de leads a traer (default 25)' },
      },
      required: ['form_id'],
    },
  },
  {
    name: 'meta_get_ad_insights',
    description: 'Obtiene métricas de rendimiento de anuncios.',
    inputSchema: {
      type: 'object',
      properties: {
        date_preset: { type: 'string', description: 'Rango: today, yesterday, last_7d, last_30d' },
        level: { type: 'string', description: 'campaign, adset o ad' },
      },
      required: ['date_preset', 'level'],
    },
  },
  {
    name: 'meta_set_campaign_budget',
    description: 'Actualiza el presupuesto diario de una campaña.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID de la campaña' },
        daily_budget_cop: { type: 'number', description: 'Nuevo presupuesto diario en COP' },
      },
      required: ['campaign_id', 'daily_budget_cop'],
    },
  },
  {
    name: 'meta_pause_ad',
    description: 'Pausa o activa un anuncio, adset o campaña.',
    inputSchema: {
      type: 'object',
      properties: {
        object_id: { type: 'string', description: 'ID del objeto a pausar/activar' },
        status: { type: 'string', description: '"PAUSED" o "ACTIVE"' },
      },
      required: ['object_id', 'status'],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function getMetaConfig(): { accessToken: string; adAccountId: string; pixelId: string } {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pixelId = process.env.META_PIXEL_ID ?? '';

  if (!accessToken || !adAccountId) {
    throw new Error('[Meta] META_ACCESS_TOKEN y META_AD_ACCOUNT_ID son requeridos');
  }
  return { accessToken, adAccountId, pixelId };
}

async function metaFetch(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: Record<string, unknown>
): Promise<unknown> {
  const { accessToken } = getMetaConfig();
  const base = 'https://graph.facebook.com/v20.0';
  const url = `${base}${path}`;

  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method === 'GET') {
    // append access_token to URL for GET
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}access_token=${accessToken}`, opts);
    return res.json();
  }

  opts.body = JSON.stringify({ ...body, access_token: accessToken });
  const res = await fetch(url, opts);
  return res.json();
}

// ---------------------------------------------------------------------------
// Ejecutor principal de herramientas
// ---------------------------------------------------------------------------

export async function ejecutarToolMeta(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const { adAccountId, pixelId } = getMetaConfig();

  switch (name) {
    case 'meta_update_custom_audience': {
      const audienceId = args.audience_id as string;
      const rawEmails = args.emails as string | string[];
      const accion = args.accion as 'ADD' | 'REMOVE';

      const emailsList: string[] =
        typeof rawEmails === 'string' ? (JSON.parse(rawEmails) as string[]) : rawEmails;

      const hashedEmails = emailsList.map(hashEmail);

      return metaFetch(`/${audienceId}/users`, 'POST', {
        payload: {
          schema: ['EMAIL_SHA256'],
          data: hashedEmails.map((h) => [h]),
        },
        method: accion === 'REMOVE' ? 'delete' : 'add',
      });
    }

    case 'meta_send_capi_event': {
      const eventName = args.event_name as string;
      const email = args.email as string;
      const valorCop = args.valor_cop as number | undefined;
      const eventTime = args.event_time as number;
      const eventId = args.event_id as string;

      const userData: Record<string, string> = {
        em: hashEmail(email),
      };

      const customData: Record<string, unknown> = {};
      if (valorCop !== undefined) {
        customData.value = (valorCop / 4400).toFixed(2); // COP → USD aproximado
        customData.currency = 'USD';
      }

      return metaFetch(`/${pixelId}/events`, 'POST', {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            event_id: eventId,
            action_source: 'website',
            user_data: userData,
            custom_data: customData,
          },
        ],
      });
    }

    case 'meta_get_lead_ads': {
      const formId = args.form_id as string;
      const limit = (args.limit as number | undefined) ?? 25;
      return metaFetch(
        `/${formId}/leads?fields=field_data,created_time&limit=${limit}`,
        'GET'
      );
    }

    case 'meta_get_ad_insights': {
      const datePreset = args.date_preset as string;
      const level = args.level as string;
      return metaFetch(
        `/act_${adAccountId}/insights?date_preset=${datePreset}&level=${level}&fields=impressions,clicks,spend,cpm,cpc,ctr,actions`,
        'GET'
      );
    }

    case 'meta_set_campaign_budget': {
      const campaignId = args.campaign_id as string;
      const budgetCop = args.daily_budget_cop as number;
      // Meta espera centavos de la moneda. COP no tiene centavos estándar, se usa como entero × 100.
      return metaFetch(`/${campaignId}`, 'POST', {
        daily_budget: Math.round(budgetCop * 100),
      });
    }

    case 'meta_pause_ad': {
      const objectId = args.object_id as string;
      const status = args.status as string;
      return metaFetch(`/${objectId}`, 'POST', { status });
    }

    default:
      throw new Error(`[Meta MCP] Herramienta desconocida: ${name}`);
  }
}
