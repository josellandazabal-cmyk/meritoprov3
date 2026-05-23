/**
 * scripts/beta-enviar-emails.mjs
 * Envía emails beta a los 7 leads usando cupones ya creados en BD.
 * Uso: node --env-file=.env.local scripts/beta-enviar-emails.mjs
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

// Usa resend.dev si el dominio propio no está verificado aún
const FROM = process.env.RESEND_DOMAIN_VERIFIED === '1'
  ? 'MéritoPro <noreply@meritoprocol.com>'
  : 'MéritoPro <onboarding@resend.dev>'

function emailHtml(nombre, codigo) {
  const primerNombre = nombre.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
<div style="max-width:580px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
    <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">MéritoPro · Beta Exclusiva</p>
    <h1 style="margin:12px 0 0;color:white;font-size:24px;font-weight:800;">Tu acceso completo está listo, ${primerNombre} 🎯</h1>
  </div>

  <div style="padding:36px 40px;">
    <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 20px;">
      Fuiste seleccionado como <strong>beta tester de MéritoPro</strong>. Tu opinión va a moldear el producto que miles de aspirantes usarán para clasificar en la <strong>PGN 2026</strong>.
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
        <strong>Lo único que te pedimos:</strong> Usa la plataforma al menos 3 días y cuéntanos bugs, sugerencias o lo que quieras mejorar a <a href="mailto:soporte@meritopro.co" style="color:#16a34a;font-weight:600;">soporte@meritopro.co</a>
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

async function enviarTelegram(chatId, nombre, codigo) {
  if (!BOT_TOKEN || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'Markdown',
        text: `🎯 *¡Hola ${nombre.split(' ')[0]}!*\n\nTienes acceso *beta 100% gratuito* a MéritoPro.\n\n*Tu código:* \`${codigo}\`\n\nÚsalo en meritoprocol.com/checkout\n\n_Solo te pedimos feedback de tu experiencia 🙏_`,
      }),
    })
    return (await res.json()).ok === true
  } catch { return false }
}

async function main() {
  console.log('\n══════════════════════════════════════════')
  console.log('  MéritoPro · Envío Emails Beta')
  console.log(`  Remitente: ${FROM}`)
  console.log('══════════════════════════════════════════\n')

  // Leer cupones beta (el más reciente por lead)
  const { data: cupones, error } = await sb
    .from('codigos_garantia')
    .select('codigo, lead_id, expira_at')
    .eq('motivo', 'beta-feedback')
    .order('created_at', { ascending: false })

  if (error) { console.error('Error:', error.message); process.exit(1) }

  // Deduplicar — quedarse con el más reciente por lead
  const porLead = new Map()
  for (const c of cupones) {
    if (!porLead.has(c.lead_id)) porLead.set(c.lead_id, c)
  }

  console.log(`🎟️  Enviando a ${porLead.size} beta testers...\n`)

  for (const [leadId, cupon] of porLead) {
    const { data: lead } = await sb
      .from('leads')
      .select('nombre, email, telegram_chat_id')
      .eq('id', leadId)
      .maybeSingle()

    if (!lead) { console.log(`  ⚠️  Lead ${leadId.slice(0,8)} no encontrado`); continue }

    const nombre = lead.nombre || lead.email.split('@')[0]

    // Email
    const { error: errEmail } = await resend.emails.send({
      from: FROM,
      to: lead.email,
      subject: `${nombre.split(' ')[0]}, tu acceso beta completo a MéritoPro 🎯`,
      html: emailHtml(nombre, cupon.codigo),
    })

    // Telegram
    const tgOk = lead.telegram_chat_id
      ? await enviarTelegram(lead.telegram_chat_id, nombre, cupon.codigo)
      : null

    const emailStatus = errEmail ? `✗ ${errEmail.message?.slice(0,50)}` : '✓'
    const tgStatus = tgOk === null ? '—' : tgOk ? '✓' : '✗'

    console.log(`  ${nombre.padEnd(30)} | ${cupon.codigo} | Email: ${emailStatus} | TG: ${tgStatus}`)
  }

  console.log('\n══════════════════════════════════════════\n')
}

main().catch(e => { console.error(e); process.exit(1) })
