/**
 * scripts/beta-enviar-emails.mjs
 * Envía notificaciones beta (email + WhatsApp/SMS + Telegram) a los leads
 * usando cupones ya creados en BD.
 *
 * Uso: node --env-file=.env.local scripts/beta-enviar-emails.mjs
 *
 * Env vars opcionales para WhatsApp/SMS:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *   TWILIO_WA_FROM   → WhatsApp (ej: whatsapp:+14155238886 en sandbox)
 *   TWILIO_SMS_FROM  → SMS fallback (ej: +15551234567)
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const FROM = process.env.RESEND_DOMAIN_VERIFIED === '1'
  ? 'MéritoPro <noreply@meritoprocol.com>'
  : 'MéritoPro <onboarding@resend.dev>'

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizarCelular(celular) {
  if (!celular) return null
  const d = celular.replace(/\D/g, '')
  if (d.startsWith('57') && d.length === 12) return `+${d}`
  if (d.length === 10 && d.startsWith('3'))   return `+57${d}`
  return null
}

async function enviarTwilio(to, from, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token || !from) return false
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    )
    return res.ok
  } catch { return false }
}

async function enviarWAoSMS(celular, mensaje) {
  const numero = normalizarCelular(celular)
  if (!numero) return { canal: '—', ok: false }

  const waFrom = process.env.TWILIO_WA_FROM
  if (waFrom) {
    const ok = await enviarTwilio(`whatsapp:${numero}`, waFrom, mensaje)
    if (ok) return { canal: 'WA', ok: true }
  }

  const smsFrom = process.env.TWILIO_SMS_FROM
  if (smsFrom) {
    const ok = await enviarTwilio(numero, smsFrom, mensaje)
    return { canal: 'SMS', ok }
  }

  return { canal: '—', ok: false }
}

async function enviarTelegram(chatId, nombre, codigo) {
  if (!BOT_TOKEN || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'Markdown',
        text: `🎯 *¡Hola ${nombre.split(' ')[0]}!*\n\nTienes acceso *beta 100% gratuito* a MéritoPro.\n\n*Tu código:* \`${codigo}\`\n\n👉 Úsalo en meritoprocol.com/checkout\n\n_Solo te pedimos feedback de tu experiencia 🙏_`,
      }),
    })
    return (await res.json()).ok === true
  } catch { return false }
}

function emailHtml(nombre, codigo) {
  const primerNombre = nombre.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
<div style="max-width:580px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
    <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">MéritoPro · Beta Exclusiva</p>
    <h1 style="margin:12px 0 0;color:white;font-size:24px;font-weight:800;">Fuiste elegido beta tester, ${primerNombre} 🎯</h1>
  </div>

  <div style="padding:36px 40px;">
    <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 20px;">
      Seleccionamos un grupo pequeño de aspirantes para ser los <strong>primeros en probar MéritoPro</strong> antes del lanzamiento oficial. Tu opinión va a moldear el producto que miles de aspirantes usarán para clasificar en la <strong>PGN 2026</strong>.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 28px;">
      Como agradecimiento, tienes <strong>acceso completo al 100%</strong> — sin costo, sin letra pequeña.
    </p>

    <div style="background:#fefce8;border:2px dashed #fbbf24;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 8px;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Tu código de acceso beta</p>
      <p style="margin:0;font-family:monospace;font-size:30px;font-weight:900;color:#1e293b;letter-spacing:0.12em;">${codigo}</p>
      <p style="margin:8px 0 0;color:#78716c;font-size:12px;">Válido 30 días · Uso único · Personal e intransferible</p>
    </div>

    <p style="color:#334155;font-size:15px;font-weight:700;margin:0 0 12px;">¿Cómo activarlo?</p>
    <ol style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:2;">
      <li>Ve a <a href="https://meritoprocol.com/checkout" style="color:#f59e0b;font-weight:600;">meritoprocol.com/checkout</a></li>
      <li>Ingresa el código en el campo de descuento</li>
      <li>Tu acceso se activa de inmediato, sin pago</li>
    </ol>

    <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin:0 0 28px;">
      <p style="margin:0;color:#166534;font-size:14px;line-height:1.7;">
        <strong>Lo único que te pedimos:</strong> Usa la plataforma al menos 3 días y cuéntanos bugs, sugerencias o lo que quieras mejorar a <a href="mailto:soporte@meritoprocol.com" style="color:#16a34a;font-weight:600;">soporte@meritoprocol.com</a>
      </p>
    </div>

    <div style="text-align:center;">
      <a href="https://meritoprocol.com/checkout" style="display:inline-block;background:#fbbf24;color:#1e293b;font-weight:800;font-size:16px;padding:14px 36px;border-radius:10px;text-decoration:none;">
        Activar mi acceso →
      </a>
    </div>
  </div>

  <div style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MéritoPro · <a href="https://meritoprocol.com/legal/terminos" style="color:#94a3b8;">Términos</a></p>
  </div>
</div>
</body></html>`
}

function mensajeWA(nombre, codigo) {
  const n = nombre.split(' ')[0]
  return `🎯 *MéritoPro — Acceso Beta*\n\nHola ${n}, fuiste elegido como beta tester.\n\nTu código de acceso *100% gratuito*:\n\`${codigo}\`\n\nÚsalo en: meritoprocol.com/checkout\n\n📌 Válido 30 días. Uso único.\n\n_Solo te pedimos feedback de tu experiencia_ 🙏`
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const twilioActivo = !!(process.env.TWILIO_ACCOUNT_SID && (process.env.TWILIO_WA_FROM || process.env.TWILIO_SMS_FROM))

  console.log('\n══════════════════════════════════════════')
  console.log('  MéritoPro · Notificaciones Beta')
  console.log(`  Email: ${FROM}`)
  console.log(`  WhatsApp/SMS: ${twilioActivo ? 'activo' : 'no configurado (solo email + Telegram)'}`)
  console.log('══════════════════════════════════════════\n')

  // Leer cupones beta (el más reciente por lead)
  const { data: cupones, error } = await sb
    .from('codigos_garantia')
    .select('codigo, lead_id, expira_at')
    .eq('motivo', 'beta-feedback')
    .order('created_at', { ascending: false })

  if (error) { console.error('Error:', error.message); process.exit(1) }

  const porLead = new Map()
  for (const c of cupones) {
    if (!porLead.has(c.lead_id)) porLead.set(c.lead_id, c)
  }

  console.log(`🎟️  Enviando a ${porLead.size} beta testers...\n`)
  console.log(`${'Nombre'.padEnd(28)} | Código        | Email | TG  | WA/SMS`)
  console.log('─'.repeat(70))

  for (const [leadId, cupon] of porLead) {
    const { data: lead } = await sb
      .from('leads')
      .select('nombre, email, celular, telegram_chat_id')
      .eq('id', leadId)
      .maybeSingle()

    if (!lead) { console.log(`  ⚠️  Lead ${leadId.slice(0,8)} no encontrado`); continue }

    const nombre = lead.nombre || lead.email.split('@')[0]

    // Email
    const { error: errEmail } = await resend.emails.send({
      from: FROM,
      to: lead.email,
      subject: `${nombre.split(' ')[0]}, fuiste elegido beta tester de MéritoPro 🎯`,
      html: emailHtml(nombre, cupon.codigo),
    })

    // Telegram
    const tgOk = lead.telegram_chat_id
      ? await enviarTelegram(lead.telegram_chat_id, nombre, cupon.codigo)
      : null

    // WhatsApp / SMS
    let waResult = { canal: '—', ok: false }
    if (lead.celular && twilioActivo) {
      waResult = await enviarWAoSMS(lead.celular, mensajeWA(nombre, cupon.codigo))
    }

    const emailStatus = errEmail ? '✗' : '✓'
    const tgStatus    = tgOk === null ? '—' : tgOk ? '✓' : '✗'
    const waStatus    = waResult.canal === '—' ? '—' : waResult.ok ? `✓ ${waResult.canal}` : `✗ ${waResult.canal}`

    console.log(`${nombre.padEnd(28)} | ${cupon.codigo.padEnd(13)} | ${emailStatus}     | ${tgStatus}   | ${waStatus}`)
  }

  console.log('\n══════════════════════════════════════════')
  if (!twilioActivo) {
    console.log('\n💡 Para activar WhatsApp/SMS agrega en .env.local:')
    console.log('   TWILIO_ACCOUNT_SID=ACxxxxx')
    console.log('   TWILIO_AUTH_TOKEN=xxxxx')
    console.log('   TWILIO_WA_FROM=whatsapp:+14155238886  ← sandbox Twilio')
    console.log('   TWILIO_SMS_FROM=+15551234567          ← fallback SMS')
  }
  console.log()
}

main().catch(e => { console.error(e); process.exit(1) })
