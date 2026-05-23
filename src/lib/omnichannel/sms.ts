/**
 * Envío de mensajes via Twilio — SMS y WhatsApp.
 *
 * Env vars requeridas:
 *   TWILIO_ACCOUNT_SID   — Account SID de tu consola Twilio
 *   TWILIO_AUTH_TOKEN    — Auth Token de tu consola Twilio
 *   TWILIO_SMS_FROM      — Número Twilio para SMS   ej: +12015551234
 *   TWILIO_WA_FROM       — Número Twilio WhatsApp   ej: whatsapp:+14155238886
 *                          (sandbox: whatsapp:+14155238886 | prod: whatsapp:+TU_NUMERO)
 *
 * Para activar WhatsApp en producción:
 *   1. Compra un número en Twilio o conecta uno existente.
 *   2. Regístralo en Meta → aprobación ~24-48h.
 *   3. Cambia TWILIO_WA_FROM al número aprobado.
 */

const TWILIO_BASE = 'https://api.twilio.com/2010-04-01'

function twilioHeaders(sid: string, token: string) {
  const creds = Buffer.from(`${sid}:${token}`).toString('base64')
  return {
    Authorization: `Basic ${creds}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

/** Normaliza celulares colombianos a E.164 (+57XXXXXXXXXX). */
export function normalizarCelular(celular: string): string | null {
  const digits = celular.replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('3'))   return `+57${digits}`
  if (digits.length === 12 && digits.startsWith('0057'))return `+${digits.slice(2)}`
  return null
}

export interface MensajeResult {
  ok: boolean
  sid?: string
  error?: string
}

async function enviarTwilio(to: string, from: string, body: string): Promise<MensajeResult> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return { ok: false, error: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN no configurados' }

  try {
    const res = await fetch(`${TWILIO_BASE}/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: twilioHeaders(sid, token),
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    })
    const data = await res.json() as { sid?: string; message?: string }
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` }
    return { ok: true, sid: data.sid }
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 120) }
  }
}

/**
 * Envía SMS a un celular colombiano.
 * `celular` puede ser "3001234567", "573001234567" o "+573001234567".
 */
export async function enviarSMS(celular: string, mensaje: string): Promise<MensajeResult> {
  const from = process.env.TWILIO_SMS_FROM
  if (!from) return { ok: false, error: 'TWILIO_SMS_FROM no configurado' }
  const to = normalizarCelular(celular)
  if (!to) return { ok: false, error: `Número inválido: ${celular}` }
  return enviarTwilio(to, from, mensaje)
}

/**
 * Envía mensaje WhatsApp a un celular colombiano.
 * Requiere que el usuario haya optado-in al sandbox de Twilio (en testing)
 * o al número aprobado por Meta (en producción).
 */
export async function enviarWhatsApp(celular: string, mensaje: string): Promise<MensajeResult> {
  const from = process.env.TWILIO_WA_FROM
  if (!from) return { ok: false, error: 'TWILIO_WA_FROM no configurado' }
  const normalized = normalizarCelular(celular)
  if (!normalized) return { ok: false, error: `Número inválido: ${celular}` }
  const to = `whatsapp:${normalized}`
  return enviarTwilio(to, from, mensaje)
}

/**
 * Intenta WhatsApp primero; si falla o no está configurado, cae a SMS.
 */
export async function enviarWAoSMS(celular: string, mensaje: string): Promise<{
  canal: 'whatsapp' | 'sms' | 'ninguno'
  ok: boolean
  error?: string
}> {
  if (process.env.TWILIO_WA_FROM) {
    const wa = await enviarWhatsApp(celular, mensaje)
    if (wa.ok) return { canal: 'whatsapp', ok: true }
  }
  if (process.env.TWILIO_SMS_FROM) {
    const sms = await enviarSMS(celular, mensaje)
    return { canal: 'sms', ok: sms.ok, error: sms.error }
  }
  return { canal: 'ninguno', ok: false, error: 'Sin pasarela SMS/WA configurada' }
}
