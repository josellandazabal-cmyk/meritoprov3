/**
 * scripts/beta-bonos.mjs
 *
 * 1. Elimina leads duplicados (mantiene el más reciente por email)
 * 2. Crea cupón 100% auto-aprobado para cada lead real
 * 3. Notifica por email (Resend) y Telegram si está conectado
 *
 * Uso: node --env-file=.env.local scripts/beta-bonos.mjs
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

// IDs que NO son reales (solo datos de prueba/desarrollo)
const EMAILS_TEST = [
  'test@example.com',
  'pedro@test.com',
  'claudia.test@hardtest.com',
  'ana.torres@test.com',
  'test@meritopro.com', // .com no .co
]

function generarCodigo(prefijo) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const parte = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefijo}-${parte}`
}

function emailHtml(nombre, codigo) {
  const primerNombre = nombre.split(' ')[0]
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center;">
      <p style="margin:0;color:#fbbf24;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MéritoPro · Beta Exclusiva</p>
      <h1 style="margin:12px 0 0;color:white;font-size:26px;font-weight:800;">Tu acceso completo está listo, ${primerNombre} 🎯</h1>
    </div>

    <div style="padding:36px 40px;">
      <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Fuiste seleccionado para ser uno de nuestros <strong>primeros usuarios beta de MéritoPro</strong>. Tu opinión va a moldear el producto que miles de aspirantes usarán para clasificar en la PGN 2026.
      </p>

      <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 28px;">
        Como agradecimiento, te damos <strong>acceso completo al 100%</strong> — sin costo, sin letra pequeña.
      </p>

      <div style="background:#fefce8;border:2px dashed #fbbf24;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 8px;color:#92400e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Tu código de acceso</p>
        <p style="margin:0;font-family:monospace;font-size:28px;font-weight:900;color:#1e293b;letter-spacing:0.1em;">${codigo}</p>
        <p style="margin:8px 0 0;color:#78716c;font-size:12px;">Válido por 30 días · Uso único · Personal e intransferible</p>
      </div>

      <div style="margin:0 0 28px;">
        <p style="color:#334155;font-size:15px;font-weight:700;margin:0 0 12px;">¿Cómo usarlo?</p>
        <ol style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.9;">
          <li>Ve a <a href="https://meritoprocol.com/checkout" style="color:#f59e0b;font-weight:600;">meritoprocol.com/checkout</a></li>
          <li>Ingresa el código en el campo "Código de descuento"</li>
          <li>Tu acceso se activa de inmediato, sin pago</li>
        </ol>
      </div>

      <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin:0 0 28px;">
        <p style="margin:0;color:#166534;font-size:14px;line-height:1.7;">
          <strong>Lo único que te pedimos:</strong> Usa la plataforma durante al menos 3 días y cuéntanos tu experiencia. Cualquier bug, sugerencia o feedback lo puedes enviar directamente a <a href="mailto:soporte@meritopro.co" style="color:#16a34a;">soporte@meritopro.co</a>
        </p>
      </div>

      <div style="text-align:center;">
        <a href="https://meritoprocol.com/checkout" style="display:inline-block;background:#fbbf24;color:#1e293b;font-weight:800;font-size:16px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Activar mi acceso →
        </a>
      </div>
    </div>

    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MéritoPro · <a href="https://meritoprocol.com/legal/terminos" style="color:#94a3b8;">Términos</a></p>
    </div>
  </div>
</body>
</html>`
}

async function enviarTelegram(chatId, mensaje) {
  if (!BOT_TOKEN || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'Markdown',
      }),
    })
    const d = await res.json()
    return d.ok === true
  } catch {
    return false
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════')
  console.log('  MéritoPro · Script Beta Bonos')
  console.log('══════════════════════════════════════════\n')

  // 1. Cargar todos los leads
  const { data: todos, error: errLeer } = await sb
    .from('leads')
    .select('id, nombre, email, telegram_chat_id, created_at')
    .order('created_at', { ascending: false })

  if (errLeer) { console.error('Error leyendo leads:', errLeer.message); process.exit(1) }

  // 2. Identificar duplicados (mantener el más reciente por email)
  const vistos = new Map()
  const mantener = []
  const eliminar = []

  for (const lead of todos) {
    const email = lead.email?.toLowerCase()
    if (!email) continue

    // Siempre eliminar emails de prueba
    if (EMAILS_TEST.includes(email)) {
      eliminar.push(lead)
      continue
    }

    if (!vistos.has(email)) {
      vistos.set(email, lead)
      mantener.push(lead)
    } else {
      // Ya vimos este email — este es duplicado (el más antiguo, por el ORDER DESC)
      eliminar.push(lead)
    }
  }

  console.log(`📋 Total leads: ${todos.length}`)
  console.log(`✅ Mantener: ${mantener.length}`)
  console.log(`🗑️  Eliminar: ${eliminar.length}\n`)

  // 3. Eliminar duplicados
  if (eliminar.length > 0) {
    for (const lead of eliminar) {
      const { error } = await sb.from('leads').delete().eq('id', lead.id)
      if (error) console.error(`  ❌ Error eliminando ${lead.email}:`, error.message)
      else console.log(`  🗑️  ${lead.email} (${lead.id.slice(0,8)}) eliminado`)
    }
  }

  // 4. Crear cupones 100% y notificar
  // Excluir el usuario de prueba técnico
  const reales = mantener.filter(l => l.email !== 'test@meritopro.co')

  console.log(`\n🎟️  Creando cupones beta para ${reales.length} leads reales...\n`)

  for (const lead of reales) {
    const nombre = lead.nombre || lead.email.split('@')[0]
    const codigo = generarCodigo('BETA100')
    const expira = new Date(Date.now() + 30 * 86_400_000).toISOString()

    // Insertar cupón 100% auto-aprobado
    const { error: errCupon } = await sb.from('codigos_garantia').insert({
      codigo,
      lead_id: lead.id,
      descuento_pct: 100,
      requiere_aprobacion: true,
      aprobado_at: new Date().toISOString(),
      aprobado_por: 'chairman',
      expira_at: expira,
      motivo: 'beta-feedback',
    })

    if (errCupon) {
      console.error(`  ❌ Error cupón para ${lead.email}:`, errCupon.message)
      continue
    }

    // Email
    let emailOk = false
    try {
      const { error: errEmail } = await resend.emails.send({
        from: 'MéritoPro <onboarding@resend.dev>',
        to: lead.email,
        subject: `${nombre.split(' ')[0]}, tu acceso beta completo a MéritoPro 🎯`,
        html: emailHtml(nombre, codigo),
      })
      emailOk = !errEmail
    } catch (e) {
      console.error(`  ❌ Error email ${lead.email}:`, e.message)
    }

    // Telegram
    let tgOk = false
    if (lead.telegram_chat_id) {
      const msg = `🎯 *¡Tu acceso beta a MéritoPro está listo, ${nombre.split(' ')[0]}!*\n\n` +
        `Como beta tester, tienes acceso *100% gratuito* a la plataforma.\n\n` +
        `Tu código: \`${codigo}\`\n\n` +
        `Úsalo en meritoprocol.com/checkout\n\n` +
        `_Solo te pedimos que nos cuentes tu experiencia 🙌_`
      tgOk = await enviarTelegram(lead.telegram_chat_id, msg)
    }

    console.log(`  ✅ ${nombre.padEnd(30)} | ${codigo} | Email: ${emailOk ? '✓' : '✗'} | TG: ${lead.telegram_chat_id ? (tgOk ? '✓' : '✗') : '—'}`)
  }

  console.log('\n══════════════════════════════════════════')
  console.log('  ¡Listo! Revisa los resultados arriba.')
  console.log('══════════════════════════════════════════\n')
}

main().catch(e => { console.error(e); process.exit(1) })
