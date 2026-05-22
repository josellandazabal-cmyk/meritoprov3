/**
 * Mercado Pago Checkout Pro — cliente para Colombia (MCO).
 *
 * Env vars requeridas en .env.local:
 *   MP_ACCESS_TOKEN   — "APP_USR-..." producción (Mercado Pago panel → Credenciales)
 *   MP_PUBLIC_KEY     — "APP_USR-..." clave pública (solo se expone en el front si se usa SDK JS)
 *   MP_WEBHOOK_SECRET — clave secreta del webhook (Mercado Pago panel → Webhooks → Clave)
 *   NEXT_PUBLIC_SITE_URL — https://meritoprocol.com
 */

const BASE = 'https://api.mercadopago.com'
const ACCESS_TOKEN = () => process.env.MP_ACCESS_TOKEN ?? ''
const WEBHOOK_SECRET = () => process.env.MP_WEBHOOK_SECRET ?? ''
const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meritoprocol.com'

export function mpConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface DatosCheckoutMP {
  referenceId: string        // pgn-2026-{userId|leadId}-{timestamp}
  email: string
  nombre: string
  cursoSlug: string
  montoCop: number
  leadId?: string
  userId?: string
  codigoDescuento?: string
}

export interface PreferenciaMP {
  id: string
  init_point: string         // URL de producción
  sandbox_init_point: string
  external_reference: string
}

export interface PagoMP {
  id: number
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | 'in_process'
  status_detail: string
  external_reference: string
  transaction_amount: number
  currency_id: string
  payment_method_id: string
  payment_type_id: string
  payer: { email: string; first_name?: string; last_name?: string }
  date_approved: string | null
  date_created: string
  metadata?: Record<string, string>
}

// Payload que envía MP al webhook (tipo "payment")
export interface WebhookPayloadMP {
  id: number
  live_mode: boolean
  type: 'payment' | 'merchant_order' | string
  action: string
  data: { id: string }
}

// ---------------------------------------------------------------------------
// Crear preferencia de pago (devuelve init_point para redirigir al cliente)
// ---------------------------------------------------------------------------
export async function crearPreferencia(datos: DatosCheckoutMP): Promise<{ ok: true; preferencia: PreferenciaMP } | { ok: false; error: string }> {
  const token = ACCESS_TOKEN()
  if (!token) return { ok: false, error: 'MP_ACCESS_TOKEN no configurado' }

  const siteUrl = SITE_URL()
  const reference = `${datos.cursoSlug}-${datos.referenceId}-${Date.now()}`

  const body = {
    items: [{
      id: datos.cursoSlug,
      title: 'MéritoPro — Acceso Completo Concurso PGN 2026',
      quantity: 1,
      unit_price: datos.montoCop,
      currency_id: 'COP',
    }],
    payer: {
      name: datos.nombre,
      email: datos.email,
    },
    back_urls: {
      success: `${siteUrl}/dashboard/bienvenida?ref=${reference}`,
      failure: `${siteUrl}/checkout?error=pago_fallido`,
      pending: `${siteUrl}/checkout?estado=pendiente&ref=${reference}`,
    },
    auto_return: 'approved',
    notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    external_reference: reference,
    metadata: {
      ...(datos.leadId  ? { lead_id:  datos.leadId }  : {}),
      ...(datos.userId  ? { user_id:  datos.userId }  : {}),
      ...(datos.codigoDescuento ? { codigo_descuento: datos.codigoDescuento } : {}),
      curso_slug: datos.cursoSlug,
    },
    // Expiración de la preferencia: 48 horas
    expires: true,
    expiration_date_to: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }

  try {
    const res = await fetch(`${BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': reference,
      },
      body: JSON.stringify(body),
    })

    const json = await res.json() as PreferenciaMP & { message?: string; error?: string }
    if (!res.ok) {
      return { ok: false, error: json.message ?? json.error ?? `HTTP ${res.status}` }
    }

    return { ok: true, preferencia: { ...json, external_reference: reference } }
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 100) }
  }
}

// ---------------------------------------------------------------------------
// Obtener detalle de un pago (para verificar en el webhook)
// ---------------------------------------------------------------------------
export async function obtenerPago(paymentId: string | number): Promise<{ ok: true; pago: PagoMP } | { ok: false; error: string }> {
  const token = ACCESS_TOKEN()
  if (!token) return { ok: false, error: 'MP_ACCESS_TOKEN no configurado' }

  try {
    const res = await fetch(`${BASE}/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const json = await res.json() as PagoMP & { message?: string }
    if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` }
    return { ok: true, pago: json }
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 100) }
  }
}

// ---------------------------------------------------------------------------
// Verificar firma del webhook
//
// Mercado Pago envía en el header x-signature:
//   ts={unix_timestamp},v1={hmac_sha256}
//
// El HMAC se calcula sobre el template:
//   id:{data.id};request-id:{x-request-id};ts:{timestamp}
// ---------------------------------------------------------------------------
export async function verificarFirmaMP(
  req: Request,
  payload: WebhookPayloadMP
): Promise<boolean> {
  const secret = WEBHOOK_SECRET()
  if (!secret) {
    console.warn('[MP webhook] MP_WEBHOOK_SECRET no configurado — firma no verificada')
    return true // en dev sin secret, no bloquear
  }

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  // Extraer ts y v1 del header
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string])
  )
  const ts  = parts['ts']  ?? ''
  const v1  = parts['v1']  ?? ''
  if (!ts || !v1) return false

  // Construir template firmado
  const template = `id:${payload.data.id};request-id:${xRequestId};ts:${ts}`

  // HMAC-SHA256
  const key  = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(template))
  const hex  = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')

  return hex === v1
}

// ---------------------------------------------------------------------------
// Listar pagos aprobados recientes (para sync del admin)
// ---------------------------------------------------------------------------
export async function listarPagosAprobados(diasAtras = 1): Promise<{ ok: true; pagos: PagoMP[] } | { ok: false; error: string }> {
  const token = ACCESS_TOKEN()
  if (!token) return { ok: false, error: 'MP_ACCESS_TOKEN no configurado' }

  const desde = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString()

  try {
    const url = `${BASE}/v1/payments/search?status=approved&date_created.from=${desde}&sort=date_created&criteria=desc&limit=50`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const json = await res.json() as { results: PagoMP[]; message?: string }
    if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` }
    return { ok: true, pagos: json.results ?? [] }
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 100) }
  }
}
