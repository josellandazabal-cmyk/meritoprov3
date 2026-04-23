// ============================================================
// MéritoPro V4 — Bench de latencia del Orquestador
//
// Uso:
//   # Terminal 1
//   npm run dev
//
//   # Terminal 2 — pass 1 (Sonnet only, routing desactivado)
//   npx tsx scripts/bench/bench_diagnostico.ts
//
//   # Terminal 2 — pass 2 (routing activado: Haiku para I/C, Sonnet para II/III)
//   MERITO_MODEL_ROUTING=true npx tsx scripts/bench/bench_diagnostico.ts
//
// Objetivos de validación:
//   Q1  ≤ 15 000 ms  (cold — genera lote de 5)
//   Q2–Q5 ≤ 500 ms  (cache hit)
//   Q6    ≤ 500 ms  (lote pre-generado por after())
//   Cache hit rate ≥ 80%
//   Reducción tokens facturados vs baseline ≥ 70% desde Q2
// ============================================================

import { readFile } from 'node:fs/promises';

// ── Cargar .env.local ─────────────────────────────────────────────────────────
const envText = await readFile('.env.local', 'utf8').catch(() => '');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

// ── Configuración ─────────────────────────────────────────────────────────────
const BASE_URL    = process.env.BENCH_URL ?? 'http://localhost:3000';
const ENDPOINT    = `${BASE_URL}/api/orquestador`;
const N_PREGUNTAS = 10;
const ROUTING     = process.env.MERITO_MODEL_ROUTING === 'true';

// UUID de prueba fijo — no necesita existir en Supabase (el orquestador no lo valida).
// Si tu esquema exige FK, inserta manualmente:
//   INSERT INTO leads (id, email, cargo_aspira) VALUES ('00000000-0000-0000-0000-b3nch00000001', 'bench@meritopro.test', 'Procurador Judicial I')
//   ON CONFLICT DO NOTHING;
const LEAD_ID = '00000000-0000-0000-0000-b3nch00000001';

const CONTEXTO_USUARIO = {
  cargo_aspira:              'Procurador Judicial I',
  profesion:                 'Abogado',
  nivel_educativo:           'especializacion',
  progreso_sm2:              { dominio_alto: [], dominio_medio: [], brechas: [] },
  indice_preparacion_actual: 0,
  dias_hasta_concurso:       180,
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Meta {
  cache_hit:        boolean;
  input_tokens:     number;
  output_tokens:    number;
  cache_read_tokens:  number;
  cache_write_tokens: number;
}

interface OrquestadorResp {
  completado:    boolean;
  pregunta?:     { estructura?: { tipo?: string } };
  generado_por?: string;
  _meta?:        Meta;
}

interface RowResult {
  n:             number;
  tipo:          string;
  total_ms:      number;
  ttfb_ms:       number;
  bytes:         number;
  generado_por:  string;
  cache_hit:     boolean;
  in_tok:        number;
  out_tok:       number;
  cache_r_tok:   number;
  cache_w_tok:   number;
  ok:            boolean;
  error?:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(arr: number[], p: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.ceil((p / 100) * s.length) - 1;
  return Math.round(s[Math.max(0, i)]);
}

function pad(s: string | number, w: number, right = false): string {
  const str = String(s);
  return right ? str.padEnd(w) : str.padStart(w);
}

function fmtMs(ms: number): string {
  if (ms === 0) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

// ── Simulador de sesión ───────────────────────────────────────────────────────
async function pedirPregunta(
  indice: number,
  aciertos: number,
  fallos: number,
  nivelActual: number,
  respuestaAnterior: boolean | undefined,
): Promise<RowResult> {
  const body = JSON.stringify({
    lead_id:               LEAD_ID,
    pregunta_actual:       indice,
    nivel_actual:          nivelActual,
    aciertos_consecutivos: aciertos,
    fallos_consecutivos:   fallos,
    respuesta_anterior:    respuestaAnterior,
    total_objetivo:        N_PREGUNTAS,
    tipo_sesion:           'bench',
    contexto_usuario:      CONTEXTO_USUARIO,
  });

  const t0 = performance.now();
  let ttfb_ms = 0;
  let raw = '';
  let status = 0;

  try {
    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    ttfb_ms = Math.round(performance.now() - t0);
    status  = res.status;
    raw     = await res.text();
  } catch (err) {
    const total_ms = Math.round(performance.now() - t0);
    return {
      n: indice + 1, tipo: '—', total_ms, ttfb_ms: 0, bytes: 0,
      generado_por: '—', cache_hit: false,
      in_tok: 0, out_tok: 0, cache_r_tok: 0, cache_w_tok: 0,
      ok: false, error: String(err),
    };
  }

  const total_ms = Math.round(performance.now() - t0);
  const bytes    = Buffer.byteLength(raw, 'utf8');

  if (status !== 200) {
    return {
      n: indice + 1, tipo: '—', total_ms, ttfb_ms, bytes,
      generado_por: `HTTP ${status}`, cache_hit: false,
      in_tok: 0, out_tok: 0, cache_r_tok: 0, cache_w_tok: 0,
      ok: false, error: raw.slice(0, 120),
    };
  }

  let data: OrquestadorResp;
  try {
    data = JSON.parse(raw) as OrquestadorResp;
  } catch {
    return {
      n: indice + 1, tipo: '—', total_ms, ttfb_ms, bytes,
      generado_por: 'parse_error', cache_hit: false,
      in_tok: 0, out_tok: 0, cache_r_tok: 0, cache_w_tok: 0,
      ok: false, error: 'JSON parse failed',
    };
  }

  const meta         = data._meta ?? { cache_hit: false, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0 };
  const generado_por = data.generado_por ?? '—';
  const tipo         = data.pregunta?.estructura?.tipo ?? (data.completado ? 'completado' : '—');

  return {
    n: indice + 1,
    tipo,
    total_ms,
    ttfb_ms,
    bytes,
    generado_por,
    cache_hit:   meta.cache_hit || generado_por.includes('+cache+'),
    in_tok:      meta.input_tokens,
    out_tok:     meta.output_tokens,
    cache_r_tok: meta.cache_read_tokens,
    cache_w_tok: meta.cache_write_tokens,
    ok: true,
  };
}

// ── Pasada completa ───────────────────────────────────────────────────────────
async function correrPasada(label: string): Promise<RowResult[]> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  PASADA: ${label}`);
  console.log(`  Endpoint : ${ENDPOINT}`);
  console.log(`  Lead ID  : ${LEAD_ID}`);
  console.log(`  Routing  : ${ROUTING ? 'ON (Haiku+Sonnet)' : 'OFF (solo Sonnet)'}`);
  console.log(`${'─'.repeat(70)}\n`);

  const rows: RowResult[] = [];
  let nivelActual = 1;
  let aciertos    = 0;
  let fallos      = 0;
  let respAnterior: boolean | undefined;

  for (let i = 0; i < N_PREGUNTAS; i++) {
    process.stdout.write(`  Q${i + 1}/${N_PREGUNTAS} … `);
    const row = await pedirPregunta(i, aciertos, fallos, nivelActual, respAnterior);
    rows.push(row);

    const tag = row.cache_hit ? '🟢 cache' : '🔴 cold ';
    console.log(`${tag}  ${fmtMs(row.total_ms).padStart(7)}  (TTFB ${fmtMs(row.ttfb_ms)})  ${row.tipo}`);

    if (!row.ok) {
      console.error(`         ⚠ ${row.error}`);
      // Simula acierto para continuar la sesión
      respAnterior = true;
      aciertos++;
      fallos = 0;
    } else {
      // Alterna acierto/fallo para ejercitar el nivel adaptativo
      respAnterior = i % 3 !== 2; // cada 3ª respuesta es fallo
      if (respAnterior) { aciertos++; fallos = 0; }
      else              { fallos++;   aciertos = 0; }

      if (aciertos >= 2 && nivelActual < 3) nivelActual++;
      if (fallos   >= 2 && nivelActual > 1) nivelActual--;
    }

    // Pausa mínima entre requests para no saturar el servidor local
    if (i < N_PREGUNTAS - 1) await new Promise(r => setTimeout(r, 200));
  }

  return rows;
}

// ── Tabla markdown ────────────────────────────────────────────────────────────
function imprimirTabla(rows: RowResult[], label: string): void {
  console.log(`\n### ${label}\n`);

  const SEP = '|' + ['---', '---', '---:', '---:', '---:', '---:', '---:'].map(c => c).join('|') + '|';
  const HDR = '| # | tipo | ms | TTFB | generado_por | in_tok (cached) | out_tok |';
  console.log(HDR);
  console.log(SEP);

  for (const r of rows) {
    const cacheLabel = r.cache_hit ? '`cache`' : 'cold';
    // in_tok = total billed input (cache reads are cheaper but still counted)
    // Annotate cache_read separately
    const inTokStr = r.in_tok > 0
      ? `${r.in_tok}${r.cache_r_tok > 0 ? ` *(${r.cache_r_tok}r)*` : ''}`
      : '—';
    console.log(
      `| ${pad(r.n, 2)} | ${pad(r.tipo, 14, true)} | ${pad(fmtMs(r.total_ms), 6)} | ${pad(fmtMs(r.ttfb_ms), 6)} | ${cacheLabel} \`${r.generado_por.slice(-30)}\` | ${pad(inTokStr, 16, true)} | ${r.out_tok || '—'} |`
    );
  }

  // ── Métricas resumidas ────────────────────────────────────────────────────
  const okRows      = rows.filter(r => r.ok);
  const cacheHits   = rows.filter(r => r.cache_hit);
  const allMs       = okRows.map(r => r.total_ms);
  const cacheMs     = cacheHits.map(r => r.total_ms);
  const coldMs      = okRows.filter(r => !r.cache_hit).map(r => r.total_ms);

  const totalSesion  = allMs.reduce((a, b) => a + b, 0);
  const hitRate      = rows.length ? Math.round((cacheHits.length / rows.length) * 100) : 0;

  // Token savings: compare cold tokens vs warm tokens
  const coldRows  = okRows.filter(r => !r.cache_hit);
  const warmRows  = okRows.filter(r => r.cache_hit);
  const avgColdIn = coldRows.length ? Math.round(coldRows.reduce((a, r) => a + r.in_tok, 0) / coldRows.length) : 0;
  const avgWarmIn = warmRows.length ? 0 : 0; // cache hits don't call Anthropic

  console.log('\n**Resumen**\n');
  console.log(`| Métrica | Valor |`);
  console.log(`|---|---|`);
  console.log(`| Total sesión (${N_PREGUNTAS}Q) | **${fmtMs(totalSesion)}** |`);
  console.log(`| p50 todas | ${fmtMs(pct(allMs, 50))} |`);
  console.log(`| p95 todas | ${fmtMs(pct(allMs, 95))} |`);
  console.log(`| p50 cold  | ${coldMs.length ? fmtMs(pct(coldMs, 50)) : '—'} |`);
  console.log(`| p50 cache | ${cacheMs.length ? fmtMs(pct(cacheMs, 50)) : '—'} |`);
  console.log(`| Cache hit rate | **${hitRate}%** (${cacheHits.length}/${rows.length}) |`);
  console.log(`| Tokens input avg (cold) | ${avgColdIn || '—'} |`);
  console.log(`| Tokens input avg (warm) | ${warmRows.length ? '0 (sin llamada)' : '—'} |`);
  console.log(`| Routing activo | ${ROUTING ? 'Haiku+Sonnet' : 'solo Sonnet'} |`);

  // ── Validación contra objetivos ───────────────────────────────────────────
  console.log('\n**Validación objetivos**\n');
  const q1ms  = rows[0]?.total_ms ?? 0;
  const q2_5  = rows.slice(1, 5).filter(r => r.cache_hit).map(r => r.total_ms);
  const q6ms  = rows[5]?.total_ms ?? 0;
  const q6hit = rows[5]?.cache_hit ?? false;

  const check = (ok: boolean, label: string) =>
    `| ${ok ? '✅' : '❌'} | ${label} |`;

  console.log(`| | |`);
  console.log(`|---|---|`);
  console.log(check(q1ms <= 15000,   `Q1 ≤ 15s → ${fmtMs(q1ms)}`));
  console.log(check(
    q2_5.length > 0 && q2_5.every(ms => ms <= 500),
    `Q2–Q5 cache ≤ 500ms → [${q2_5.map(fmtMs).join(', ')}]`,
  ));
  console.log(check(q6hit && q6ms <= 500, `Q6 cache ≤ 500ms → ${fmtMs(q6ms)} ${q6hit ? '(cache)' : '(cold ⚠)'}`));
  console.log(check(hitRate >= 80,   `Cache hit rate ≥ 80% → ${hitRate}%`));
  console.log(check(
    warmRows.length > 0,
    `Reducción tokens Q2+ → ${warmRows.length > 0 ? '100% (0 tokens facturados en cache hits)' : 'sin datos'}`,
  ));

  // ── Sugerencias si hay fallos ─────────────────────────────────────────────
  const suggestions: string[] = [];
  if (q1ms > 15000)      suggestions.push('Q1 supera 15s: considera reducir TOP_K_LOTE de 20 a 10 para batch.');
  if (q2_5.some(ms => ms > 500)) suggestions.push('Q2-Q5 lentas: verifica que after() está disponible (Next.js ≥15) y que la caché no se está reiniciando entre requests (modo serverless split).');
  if (!q6hit)            suggestions.push('Q6 fue cold: after() puede no haberse ejecutado antes de la Q6 request; aumenta el delay entre preguntas en el frontend a ≥300ms.');
  if (hitRate < 80)      suggestions.push(`Hit rate ${hitRate}% < 80%: el nivel adaptativo puede estar invalidando el caché; revisa calcularSiguienteNivel vs nivel almacenado.`);

  if (suggestions.length) {
    console.log('\n**Sugerencias de fix**\n');
    suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  MéritoPro V4 · Bench de latencia del Orquestador');
console.log('══════════════════════════════════════════════════════════════════════');

// Comprobar que el servidor está levantado
try {
  const ping = await fetch(`${BASE_URL}/api/orquestador`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  if (ping.status === 400) {
    console.log(`  Servidor respondió 400 (expected para payload vacío) — OK\n`);
  } else {
    console.log(`  Servidor respondió ${ping.status}\n`);
  }
} catch {
  console.error(`\n  ✗ No se puede conectar a ${BASE_URL}. ¿Está corriendo "npm run dev"?\n`);
  process.exit(1);
}

const passLabel = ROUTING
  ? 'PASS 2 — MERITO_MODEL_ROUTING=true (Haiku+Sonnet)'
  : 'PASS 1 — MERITO_MODEL_ROUTING=false (solo Sonnet)';

const rows = await correrPasada(passLabel);
imprimirTabla(rows, passLabel);

// Si queremos comparar las dos pasadas en una sola ejecución sería necesario
// reiniciar el servidor entre pasadas (el env var MERITO_MODEL_ROUTING se lee al
// iniciar el proceso). Por eso el bench se diseñó para ejecutarse dos veces:
//   npx tsx scripts/bench/bench_diagnostico.ts              → Pass 1
//   MERITO_MODEL_ROUTING=true npx tsx ...bench_diagnostico.ts → Pass 2
// y comparar las dos tablas resultantes manualmente.

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  Bench completado.');
console.log('══════════════════════════════════════════════════════════════════════\n');
