/**
 * Crea un usuario de prueba en Supabase con acceso completo al curso pgn-2026.
 * Ejecutar: node --env-file=.env.local scripts/crear-test-user.mjs
 */
import { createClient } from '@supabase/supabase-js'

// Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno
// Ejecutar: node --env-file=.env.local scripts/crear-test-user.mjs
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const TEST_EMAIL    = 'test@meritopro.co'
const TEST_PASSWORD = 'MeritoPro2026!'
const CURSO_SLUG    = 'pgn-2026'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let userId

// 1. Crear o recuperar usuario
const { data: createData, error: createError } = await sb.auth.admin.createUser({
  email:          TEST_EMAIL,
  password:       TEST_PASSWORD,
  email_confirm:  true,
  user_metadata:  { nombre: 'Usuario de Prueba' },
})

if (createError) {
  if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
    console.log('El usuario ya existe — buscando su ID...')
    const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
    const existing = users.find(u => u.email === TEST_EMAIL)
    if (!existing) { console.error('No se encontró el usuario.'); process.exit(1) }
    userId = existing.id
  } else {
    console.error('Error creando usuario:', createError.message)
    process.exit(1)
  }
} else {
  userId = createData.user.id
  console.log('Usuario creado:', userId)
}

// 2. Verificar si ya tiene pago aprobado
const { data: pagoExistente } = await sb
  .from('intenciones_pago')
  .select('id, estado, reference')
  .eq('user_id', userId)
  .eq('estado', 'aprobada')
  .maybeSingle()

if (pagoExistente) {
  console.log('Ya tiene pago aprobado (ref:', pagoExistente.reference + ')')
} else {
  const reference = `TEST-${userId.slice(0, 8)}-${Date.now()}`
  const { error: pagoError } = await sb.from('intenciones_pago').insert({
    reference,
    user_id:        userId,
    email:          TEST_EMAIL,
    monto_cop:      297000,
    estado:         'aprobada',
    wompi_tx_id:    'TEST-MANUAL',
    aprobada_at:    new Date().toISOString(),
    payment_method: 'test',
  })
  if (pagoError) {
    console.error('Error insertando pago:', pagoError.message)
    process.exit(1)
  }
  console.log('Pago de prueba creado (ref:', reference + ')')
}

console.log('\n✅ Usuario de prueba listo:')
console.log('   Email    :', TEST_EMAIL)
console.log('   Password :', TEST_PASSWORD)
console.log('   URL      : http://localhost:3000/login')
console.log('\n   (En producción: https://meritoprocol.com/login)')
