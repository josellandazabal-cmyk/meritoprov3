/**
 * scripts/test-telegram.mjs
 *
 * Verifica que el bot de Telegram funciona y envía mensajes reales.
 *
 * Uso:
 *   node --env-file=.env.local scripts/test-telegram.mjs
 *   node --env-file=.env.local scripts/test-telegram.mjs --chat=123456789
 */

import { createClient } from '@supabase/supabase-js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!TOKEN) { console.error('❌  TELEGRAM_BOT_TOKEN no está en .env.local'); process.exit(1) }

const BASE = `https://api.telegram.org/bot${TOKEN}`

async function tgCall(method, body = {}) {
  const res = await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ── 1. Verificar identidad del bot ────────────────────────────────────────
console.log('\n══════════════════════════════════════════')
console.log('  MéritoPro · Test Bot Telegram')
console.log('══════════════════════════════════════════\n')

const me = await tgCall('getMe')
if (!me.ok) {
  console.error('❌  Token inválido o bot suspendido:', me.description)
  process.exit(1)
}
console.log(`✅  Bot activo: @${me.result.username} (id: ${me.result.id})`)

// ── 2. Estado del webhook ─────────────────────────────────────────────────
const webhook = await tgCall('getWebhookInfo')
if (webhook.ok) {
  const w = webhook.result
  console.log(`\n📡  Webhook: ${w.url || '(no configurado)'}`)
  if (w.last_error_message) {
    console.warn(`⚠️   Último error: ${w.last_error_message}`)
    console.warn(`    Fecha error:  ${new Date(w.last_error_date * 1000).toLocaleString('es-CO')}`)
  } else {
    console.log('    Sin errores recientes ✓')
  }
  console.log(`    Pendientes en cola: ${w.pending_update_count ?? 0}`)
}

// ── 3. Obtener chat_ids desde Supabase ────────────────────────────────────
let chatIds = []

// Argumento manual: --chat=123456789
const argChat = process.argv.find(a => a.startsWith('--chat='))?.split('=')[1]
if (argChat) {
  chatIds = [{ nombre: 'Manual', chat_id: argChat }]
} else if (SB_URL && SB_KEY) {
  const sb = createClient(SB_URL, SB_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  // Leads con telegram conectado
  const { data: leads } = await sb
    .from('leads')
    .select('nombre, email, telegram_chat_id')
    .not('telegram_chat_id', 'is', null)
    .limit(10)

  // Usuarios con telegram conectado
  const { data: usuarios } = await sb
    .from('usuarios')
    .select('nombre, telegram_chat_id')
    .not('telegram_chat_id', 'is', null)
    .limit(10)

  const vistos = new Set()
  for (const l of leads ?? []) {
    if (l.telegram_chat_id && !vistos.has(l.telegram_chat_id)) {
      chatIds.push({ nombre: l.nombre || l.email, chat_id: String(l.telegram_chat_id) })
      vistos.add(l.telegram_chat_id)
    }
  }
  for (const u of usuarios ?? []) {
    if (u.telegram_chat_id && !vistos.has(u.telegram_chat_id)) {
      chatIds.push({ nombre: u.nombre, chat_id: String(u.telegram_chat_id) })
      vistos.add(u.telegram_chat_id)
    }
  }
} else {
  console.warn('\n⚠️  Sin Supabase configurado. Usa --chat=<ID> para enviar a un chat específico.')
}

// ── 4. Enviar mensaje de prueba ───────────────────────────────────────────
if (chatIds.length === 0) {
  console.log('\n📭  No hay chat_ids en la BD. Usa: node test-telegram.mjs --chat=TU_CHAT_ID')
  console.log('\n    Para saber tu chat_id: escríbele a @userinfobot en Telegram.\n')
  process.exit(0)
}

console.log(`\n📨  Enviando mensaje de prueba a ${chatIds.length} usuario(s)...\n`)

for (const { nombre, chat_id } of chatIds) {
  const msg = `🧪 *Prueba MéritoPro*\n\nHola ${nombre?.split(' ')[0] ?? 'aspirante'}, este es un mensaje de prueba del bot. Si lo ves, Telegram está funcionando correctamente ✅\n\n_${new Date().toLocaleString('es-CO')}_`

  const res = await tgCall('sendMessage', {
    chat_id,
    text: msg,
    parse_mode: 'Markdown',
  })

  if (res.ok) {
    console.log(`  ✅  ${nombre} (${chat_id}) → enviado (msg_id: ${res.result.message_id})`)
  } else {
    console.log(`  ❌  ${nombre} (${chat_id}) → error: ${res.description}`)
    if (res.error_code === 403) console.log('      (usuario bloqueó el bot o nunca lo inició)')
    if (res.error_code === 400) console.log('      (chat_id inválido)')
  }
}

console.log('\n══════════════════════════════════════════\n')
