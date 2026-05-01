#!/usr/bin/env node
// ============================================================
// hard-test-rag.mjs — Banco de pruebas del RAG en producción
//
// Objetivo: validar empíricamente que la combinación
//   (queries de construirQueryRAG) × (UMBRAL_SIMILITUD = 0.45)
// produce ≥ 1 chunk con similitud confortable para los 8 módulos
// del diagnóstico y para el set de brechas SM-2 esperado.
//
// Además, ejecuta una "regression check" inyectando los sufijos
// "— cargo objetivo: X — nivel N" para confirmar que SÍ caen por
// debajo del umbral (es decir, la causa raíz que documentamos
// sigue siendo real y el fix aplicado es correcto).
//
// Uso:
//   1. Asegúrate de tener .env.local con VOYAGE_API_KEY y
//      SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (o ANON_KEY).
//   2. node scripts/hard-test-rag.mjs
//
// Salida: tabla con top-1 / mean(6) / chunks por query, resumen
// global, y veredicto OK / FAIL con la lista de fallas.
// ============================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Carga de .env.local ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    let v = t.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
} catch (e) {
  console.error('[hard-test] No pude leer .env.local:', e.message);
  process.exit(1);
}

const {
  VOYAGE_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} = process.env;

if (!VOYAGE_API_KEY || VOYAGE_API_KEY.startsWith('pa-tu-')) {
  console.error('[hard-test] VOYAGE_API_KEY no configurada o placeholder.');
  process.exit(1);
}
if (!NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[hard-test] NEXT_PUBLIC_SUPABASE_URL faltante.');
  process.exit(1);
}
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseKey) {
  console.error('[hard-test] Falta SUPABASE_SERVICE_ROLE_KEY o ANON_KEY.');
  process.exit(1);
}

const UMBRAL = 0.45;
const TOP_K = 6;

// ------------------------------------------------------------
// Llamadas directas (sin importar el cliente Supabase JS para no
// arrastrar Next.js): fetch a la REST/RPC + fetch a Voyage.
// ------------------------------------------------------------

async function generarEmbedding(texto) {
  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3-large',
      input: texto,
      input_type: 'query',
    }),
  });
  if (!r.ok) throw new Error(`Voyage HTTP ${r.status}: ${await r.text()}`);
  const json = await r.json();
  return json.data[0].embedding;
}

async function buscarCorpus(vector, threshold) {
  const url = `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/match_corpus_legal`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_embedding: vector,
      match_threshold: threshold,
      match_count: TOP_K,
    }),
  });
  if (!r.ok) throw new Error(`Supabase RPC HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

// ------------------------------------------------------------
// Test cases
// ------------------------------------------------------------

const MODULOS_DIAGNOSTICO = [
  'estructura del Estado colombiano Procuraduría General de la Nación Constitución',
  'Ley 1952 de 2019 Código General Disciplinario principios',
  'Decreto Ley 262 de 2000 estructura funciones PGN',
  'Ley 1952 de 2019 faltas gravísimas servidores públicos',
  'derechos fundamentales tutela acción judicial',
  'gestión documental archivo público Ley 594 de 2000',
  'carrera administrativa Ley 909 de 2004 función pública',
  'ética servicio público código de integridad',
];

const BRECHAS_SIMULADAS = [
  'acción de tutela artículo 86 Constitución',
  'Ley 1952 de 2019 faltas leves disciplinarias',
  'control disciplinario interno Procuraduría',
  'ius puniendi del Estado servidores públicos',
];

// 11 bloques del programa oficial PGN 2026 — al menos 1 query por bloque
// (ver Auditoria_Corpus_vs_Programa_Oficial.md). Esta fase es la prueba
// de que el corpus cubre todo el examen, no sólo el subset clásico.
const BLOQUES_PROGRAMA_OFICIAL = [
  // Bloque 0
  'Procuraduría General de la Nación Ministerio Público funciones constitucionales',
  // Bloque 1
  'Procurador Judicial perfil funcional intervención oralidad',
  // Bloque 2
  'derecho disciplinario sujetos disciplinables culpabilidad ilicitud sustancial',
  // Bloque 3
  'función preventiva control de gestión Procuraduría sin coadministración',
  // Bloque 4
  'acción de tutela Decreto 2591 1991 trámite competencia',
  'acción popular Ley 472 medidas cautelares grupo',
  'acción de cumplimiento Ley 393 1997 procedencia',
  // Bloque 5
  'derecho de petición Ley 1755 procedimiento administrativo silencio',
  'medios de control CPACA nulidad reparación directa medida cautelar',
  // Bloque 6
  'estatuto conciliación Ley 2220 audiencia agente Ministerio Público',
  // Bloque 7
  'Código General del Proceso valoración probatoria audiencia',
  'procedimiento penal acusatorio audiencia formulación imputación',
  // Bloque 8
  'ley víctimas reparación integral 1448 enfoque diferencial',
  'código infancia adolescencia interés superior derechos prevalentes',
  // Bloque 9
  'régimen general seguridad social salud Ley 100 EPS',
  'licencia ambiental Ley 99 SINA autoridad ambiental',
  // Bloque 10
  'principios contratación estatal selección inhabilidades incompatibilidades',
  'estatuto anticorrupción Ley 1474 transparencia patrimonio público',
];

const CARGOS_REGRESION = ['Procurador Judicial I', 'Procurador Judicial II', 'aspirante PGN'];
const NIVELES = [1, 2, 3];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s.slice(0, n - 1) + '…';
  return s + ' '.repeat(n - s.length);
}

function fmtNum(n) {
  return n === null || n === undefined ? '   —  ' : n.toFixed(3);
}

async function evaluar(query) {
  const t0 = Date.now();
  const vec = await generarEmbedding(query);
  const chunks = await buscarCorpus(vec, UMBRAL);
  const top1 = chunks[0]?.similitud ?? null;
  const mean = chunks.length
    ? chunks.reduce((acc, c) => acc + c.similitud, 0) / chunks.length
    : null;
  return {
    query,
    chunks: chunks.length,
    top1,
    mean,
    docs: [...new Set(chunks.map((c) => c.documento))].slice(0, 2),
    ms: Date.now() - t0,
  };
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  HARD TEST · RAG MéritoPro V4   ·   umbral=${UMBRAL}   ·   topK=${TOP_K}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // ---- Fase 1: módulos del diagnóstico ----
  console.log('▶ Fase 1 · 8 módulos del diagnóstico (queries limpias)\n');
  console.log(pad('query', 56), '| chunks | top-1 | mean  | docs');
  console.log('─'.repeat(98));
  const fallasFase1 = [];
  for (const q of MODULOS_DIAGNOSTICO) {
    const r = await evaluar(q);
    const ok = r.chunks >= 1 && r.top1 >= UMBRAL;
    if (!ok) fallasFase1.push(r);
    console.log(
      pad(q, 56),
      `|   ${r.chunks}    | ${fmtNum(r.top1)} | ${fmtNum(r.mean)} | ${r.docs.join(', ').slice(0, 30)}`,
      ok ? '' : '  ✗ FAIL'
    );
  }

  // ---- Fase 2: brechas SM-2 simuladas ----
  console.log('\n▶ Fase 2 · brechas SM-2 simuladas (path post-Q10)\n');
  console.log(pad('query', 56), '| chunks | top-1 | mean  | docs');
  console.log('─'.repeat(98));
  const fallasFase2 = [];
  for (const q of BRECHAS_SIMULADAS) {
    const r = await evaluar(q);
    const ok = r.chunks >= 1 && r.top1 >= UMBRAL;
    if (!ok) fallasFase2.push(r);
    console.log(
      pad(q, 56),
      `|   ${r.chunks}    | ${fmtNum(r.top1)} | ${fmtNum(r.mean)} | ${r.docs.join(', ').slice(0, 30)}`,
      ok ? '' : '  ✗ FAIL'
    );
  }

  // ---- Fase 2.5: cobertura de los 11 bloques oficiales ----
  console.log('\n▶ Fase 2.5 · cobertura programa oficial PGN 2026 (11 bloques)\n');
  console.log(pad('query (bloque)', 56), '| chunks | top-1 | mean  | docs');
  console.log('─'.repeat(98));
  const fallasBloques = [];
  for (const q of BLOQUES_PROGRAMA_OFICIAL) {
    const r = await evaluar(q);
    const ok = r.chunks >= 1 && r.top1 >= UMBRAL;
    if (!ok) fallasBloques.push(r);
    console.log(
      pad(q, 56),
      `|   ${r.chunks}    | ${fmtNum(r.top1)} | ${fmtNum(r.mean)} | ${r.docs.join(', ').slice(0, 30)}`,
      ok ? '' : '  ✗ FAIL'
    );
  }

  // ---- Fase 3: regresión — el sufijo cargo+nivel debe caer ----
  console.log('\n▶ Fase 3 · regresión — sufijo cargo+nivel (debe caer bajo 0.55)\n');
  console.log(pad('query (con sufijo)', 56), '| chunks | top-1 | bajo 0.55?');
  console.log('─'.repeat(98));
  let regresionConfirmada = 0;
  let regresionTests = 0;
  for (const cargo of CARGOS_REGRESION) {
    for (const nivel of NIVELES) {
      const base = MODULOS_DIAGNOSTICO[2]; // Decreto 262 — caso reportado
      const q = `${base} concurso PGN ${cargo} nivel ${nivel}`;
      const r = await evaluar(q);
      regresionTests++;
      // Esperado: top1 BAJO 0.55 (era el bug). Si está bajo, confirma la
      // causa raíz; si está arriba, ya no es regresión que justifique fix.
      const cayo = (r.top1 ?? 1) < 0.55;
      if (cayo) regresionConfirmada++;
      console.log(
        pad(`${cargo} N${nivel}`, 56),
        `|   ${r.chunks}    | ${fmtNum(r.top1)} | ${cayo ? 'sí ✓' : 'NO  '}`
      );
    }
  }

  // ---- Resumen ----
  const total = MODULOS_DIAGNOSTICO.length + BRECHAS_SIMULADAS.length + BLOQUES_PROGRAMA_OFICIAL.length;
  const fallas = fallasFase1.length + fallasFase2.length + fallasBloques.length;
  const ok = fallas === 0;

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  Queries productivas:   ${total - fallas}/${total}`);
  console.log(`  Bug regresión: confirmado ${regresionConfirmada}/${regresionTests} casos`);
  console.log(`  Veredicto: ${ok ? 'OK ✓ — el fix de construirQueryRAG mantiene RAG productivo' : 'FAIL ✗'}`);
  if (!ok) {
    console.log('\n  Fallas:');
    for (const f of [...fallasFase1, ...fallasFase2, ...fallasBloques]) {
      console.log(`   · "${f.query}" → ${f.chunks} chunks, top1=${fmtNum(f.top1)}`);
    }
    console.log(
      '\n  Posibles causas:',
      '\n   1) PDFs faltantes — corre scripts/ingesta/descargar_corpus_extra.sh',
      '\n   2) Ingesta no ejecutada — corre npx tsx scripts/ingesta/ingest_corpus.ts',
      '\n   3) Threshold demasiado alto — bajar UMBRAL en src/lib/rag/corpus.ts'
    );
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('[hard-test] error fatal:', e);
  process.exit(2);
});
