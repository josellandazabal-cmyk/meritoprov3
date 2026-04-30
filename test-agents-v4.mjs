// ============================================================
// MéritoPro V4 — Suite de pruebas de los 3 Agentes IA
// Ejecutar con: node test-agents-v4.mjs
// Requiere el dev server en localhost:3000
// ============================================================

const BASE = 'http://localhost:3000';
const CRON_SECRET = 'tu-cron-secret-aqui'; // valor en .env.local

function sep(titulo) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${titulo}`);
  console.log('═'.repeat(60));
}

function ok(label, valor) {
  console.log(`  ✓  ${label}: ${JSON.stringify(valor)}`);
}

function warn(label, valor) {
  console.log(`  ⚠  ${label}: ${JSON.stringify(valor)}`);
}

function fail(label, valor) {
  console.log(`  ✗  ${label}: ${JSON.stringify(valor)}`);
}

// ─────────────────────────────────────────────────────────────
// AGENTE 1: ORQUESTADOR — 4 escenarios
// ─────────────────────────────────────────────────────────────

async function testAgente1() {
  sep('AGENTE 1 — ORQUESTADOR / TUTOR (4 casos)');

  // 1a. Payload válido mínimo (sin contexto_usuario)
  console.log('\n[1a] Payload mínimo — debe retornar rechazo literal (corpus/Tavily vacío)');
  const r1a = await fetch(`${BASE}/api/orquestador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'qa-001',
      pregunta_actual: 0,
      nivel_actual: 1,
      aciertos_consecutivos: 0,
      fallos_consecutivos: 0,
    }),
  });
  const d1a = await r1a.json();
  ok('HTTP status', r1a.status);
  if (d1a.error_controlado) ok('Rechazo literal correcto', d1a.mensaje?.slice(0, 60));
  else if (d1a.pregunta) ok('Pregunta generada', d1a.pregunta.estructura?.tipo);
  else warn('Respuesta inesperada', JSON.stringify(d1a).slice(0, 120));

  // 1b. Payload con contexto_usuario completo
  console.log('\n[1b] Payload con contexto_usuario completo V4');
  const r1b = await fetch(`${BASE}/api/orquestador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'qa-002',
      pregunta_actual: 5,
      nivel_actual: 2,
      aciertos_consecutivos: 2,
      fallos_consecutivos: 0,
      contexto_usuario: {
        cargo_aspira: 'Procurador Judicial II',
        profesion: 'Abogado',
        nivel_educativo: 'especializacion',
        progreso_sm2: {
          dominio_alto: ['Constitución Política'],
          dominio_medio: ['Ley 1952'],
          brechas: ['Decreto Ley 262', 'Gestión Documental'],
        },
        indice_preparacion_actual: 42,
        dias_hasta_concurso: 180,
      },
    }),
  });
  const d1b = await r1b.json();
  ok('HTTP status', r1b.status);
  if (d1b.error_controlado) ok('Rechazo literal (sin embeddings)', d1b.mensaje?.slice(0, 60));
  else if (d1b.pregunta) {
    ok('Pregunta tipo', d1b.pregunta.estructura?.tipo);
    ok('Nivel dificultad', d1b.nivel_dificultad);
    ok('Generado por', d1b.generado_por);
    ok('Norma relacionada', d1b.pregunta.norma_relacionada?.slice(0, 60));
  } else warn('Respuesta inesperada', JSON.stringify(d1b).slice(0, 120));

  // 1c. Payload inválido — debe retornar 400
  console.log('\n[1c] Payload inválido — debe retornar 400 Zod');
  const r1c = await fetch(`${BASE}/api/orquestador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: '', pregunta_actual: -1 }),
  });
  const d1c = await r1c.json();
  if (r1c.status === 400) ok('Zod rechazó payload inválido', r1c.status);
  else fail('Esperaba 400', { status: r1c.status, resp: JSON.stringify(d1c).slice(0, 80) });

  // 1d. Diagnóstico completado (pregunta_actual >= 40)
  console.log('\n[1d] pregunta_actual = 40 — debe retornar {completado: true}');
  const r1d = await fetch(`${BASE}/api/orquestador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'qa-003',
      pregunta_actual: 40,
      nivel_actual: 3,
      aciertos_consecutivos: 0,
      fallos_consecutivos: 0,
    }),
  });
  const d1d = await r1d.json();
  if (d1d.completado === true) ok('Fin de diagnóstico detectado', d1d.completado);
  else fail('Esperaba {completado: true}', d1d);
}

// ─────────────────────────────────────────────────────────────
// AGENTE 2: WEBHOOK TELEGRAM (Motivador)
// ─────────────────────────────────────────────────────────────

async function testAgente2Webhook() {
  sep('AGENTE 2 — WEBHOOK TELEGRAM / MOTIVADOR (3 casos)');

  // 2a. Comando /start
  console.log('\n[2a] Comando /start — debe retornar {ok: true}');
  const r2a = await fetch(`${BASE}/api/webhooks/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: { chat: { id: 99999 }, text: '/start', from: { first_name: 'QA' } },
    }),
  });
  const d2a = await r2a.json();
  ok('HTTP status', r2a.status);
  ok('Respuesta ok', d2a.ok);

  // 2b. Respuesta de repaso con contenido normativo (Claude evaluará)
  console.log('\n[2b] Respuesta SM-2 — Claude debe evaluar con cita normativa');
  console.log('     (Puede tardar 5-15 seg — Claude está activo con ANTHROPIC_API_KEY real)');
  const r2b = await fetch(`${BASE}/api/webhooks/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        chat: { id: 99999 },
        text: 'Las faltas gravísimas están reguladas en el artículo 62 de la Ley 1952 de 2019 y acarrean destitución e inhabilidad general.',
        from: { first_name: 'Carlos' },
      },
    }),
  });
  const d2b = await r2b.json();
  ok('HTTP status (debe ser 200 siempre)', r2b.status);
  ok('Agente procesó', d2b.ok);

  // 2c. Payload incompleto — debe retornar {ok:true} sin explotar
  console.log('\n[2c] Payload incompleto — debe retornar {ok:true} sin crash');
  const r2c = await fetch(`${BASE}/api/webhooks/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { chat: { id: 99999 } } }),
  });
  const d2c = await r2c.json();
  if (r2c.status === 200 && d2c.ok) ok('Robusto ante payload incompleto', true);
  else fail('Crash inesperado', { status: r2c.status, resp: d2c });
}

// ─────────────────────────────────────────────────────────────
// AGENTE 2: CRON REPASO SM-2
// ─────────────────────────────────────────────────────────────

async function testAgente2Cron() {
  sep('AGENTE 2 — CRON REPASO SM-2 (2 casos)');

  // 3a. Sin auth — debe retornar 401
  console.log('\n[3a] Sin Authorization header — debe retornar 401');
  const r3a = await fetch(`${BASE}/api/cron/repaso`);
  const d3a = await r3a.json();
  if (r3a.status === 401) ok('Auth protegido correctamente', 401);
  else warn('Sin CRON_SECRET en .env.local (auth desactivada)', r3a.status);

  // 3b. Con auth correcto — debe procesar demo data
  console.log('\n[3b] Con Authorization correcto — debe procesar píldoras demo');
  const r3b = await fetch(`${BASE}/api/cron/repaso`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const d3b = await r3b.json();
  ok('HTTP status', r3b.status);
  if (d3b.success) {
    ok('Pendientes procesadas', d3b.pendientes);
    ok('Enviados Telegram', d3b.enviados?.telegram);
    ok('Enviados Email', d3b.enviados?.email);
    ok('Errores (esperados sin keys reales)', d3b.errores);
  } else fail('Cron falló', d3b);
}

// ─────────────────────────────────────────────────────────────
// AGENTE 3: CRON REMARKETING (Persuasor)
// ─────────────────────────────────────────────────────────────

async function testAgente3() {
  sep('AGENTE 3 — CRON REMARKETING / PERSUASOR (2 casos)');

  // 4a. Sin auth — debe retornar 401
  console.log('\n[4a] Sin Authorization header — debe retornar 401');
  const r4a = await fetch(`${BASE}/api/cron/remarketing`);
  const d4a = await r4a.json();
  if (r4a.status === 401) ok('Auth protegido correctamente', 401);
  else warn('Sin CRON_SECRET en .env.local (auth desactivada)', r4a.status);

  // 4b. Con auth correcto — Claude genera emails para los 2 leads demo
  console.log('\n[4b] Con auth — Claude genera emails de remarketing para 2 leads demo');
  console.log('     (Puede tardar 15-30 seg — 2 llamadas a Claude con ANTHROPIC_API_KEY real)');
  const r4b = await fetch(`${BASE}/api/cron/remarketing`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const d4b = await r4b.json();
  ok('HTTP status', r4b.status);
  if (d4b.success) {
    ok('Leads procesados', d4b.leads_procesados);
    ok('Enviados (0 si Resend sin key)', d4b.enviados);
    ok('Errores', d4b.errores);
    if (d4b.detalle_errores?.length) {
      d4b.detalle_errores.forEach((e) => warn('Detalle error', e));
    }
  } else fail('Remarketing falló', d4b);
}

// ─────────────────────────────────────────────────────────────
// RUNNER PRINCIPAL
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   MéritoPro V4 — Suite QA de 3 Agentes IA               ║');
  console.log('║   Fecha: ' + new Date().toISOString() + '   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const t0 = Date.now();

  try {
    await testAgente1();
    await testAgente2Webhook();
    await testAgente2Cron();
    await testAgente3();

    sep(`RESULTADO FINAL — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log('\n  Pruebas completadas. Revisa los ⚠ y ✗ arriba.');
    console.log('  Los ⚠ son esperados si las API keys de Resend/Telegram/Voyage/Tavily');
    console.log('  son placeholders. La ANTHROPIC_API_KEY real debería activar Claude.');
    console.log('');
  } catch (err) {
    console.error('\n  ✗ Error crítico:', err.message);
    console.error('    ¿Está corriendo el servidor en localhost:3000?');
    process.exit(1);
  }
}

main();
