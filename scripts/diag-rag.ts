// Diagnóstico RAG — MéritoPro V4
// Corre: npx tsx scripts/diag-rag.ts
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

async function main() {
  // ── 1. Cargar .env.local ───────────────────────────────────────────────
  const env = await readFile('.env.local', 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }

  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY ?? '';
  const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  console.log('\n══════════════════════════════════════════════════');
  console.log('MéritoPro V4 · Diagnóstico RAG');
  console.log('══════════════════════════════════════════════════\n');

  // ── 2. Verificar claves ────────────────────────────────────────────────
  console.log('[1] Claves en .env.local:');
  console.log('  VOYAGE_API_KEY   :', VOYAGE_API_KEY ? `PRESENTE (${VOYAGE_API_KEY.slice(0, 8)}...)` : 'AUSENTE ⚠');
  console.log('  SUPABASE_URL     :', SUPABASE_URL ? 'PRESENTE' : 'AUSENTE ⚠');
  console.log('  SUPABASE_ANON    :', SUPABASE_ANON ? 'PRESENTE' : 'AUSENTE ⚠');

  // ── 3. Placeholder check ───────────────────────────────────────────────
  const isPlaceholder = !VOYAGE_API_KEY
    || VOYAGE_API_KEY.startsWith('pa-tu-')
    || VOYAGE_API_KEY.startsWith('tu-');
  console.log('\n[2] Voyage placeholder check (corpus.ts línea 34):');
  console.log('  isPlaceholder:', isPlaceholder
    ? 'SÍ → generarEmbedding devuelve null  ← CAUSA RAÍZ H5'
    : 'NO → clave pasa el filtro ✓');

  if (isPlaceholder) {
    console.error('\n  ✗ CAUSA RAÍZ H5 CONFIRMADA. Clave placeholder detectada.');
    process.exit(1);
  }

  // ── 4. Embed helper ────────────────────────────────────────────────────
  async function embed(query: string): Promise<number[] | null> {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VOYAGE_API_KEY}` },
      body: JSON.stringify({ model: 'voyage-3-large', input: query, input_type: 'query' }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`  ✗ Voyage HTTP ${res.status}: ${txt.slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? null;
  }

  // ── 5. Probar embedding ────────────────────────────────────────────────
  console.log('\n[3] Probando embedding Voyage (voyage-3-large, input_type=query):');
  const testQuery = 'sanciones disciplinarias servidor público Ley 1952 PGN';
  const vector = await embed(testQuery);
  if (!vector) {
    console.error('  ✗ Embedding falló → H5 confirmada.');
    process.exit(1);
  }
  console.log(`  ✓ dim=${vector.length} (esperado 1024)`);
  if (vector.length !== 1024) {
    console.error(`  ✗ Mismatch dimensional → H1 confirmada.`);
    process.exit(1);
  }

  // ── 6. Count corpus_legal (anon) ──────────────────────────────────────
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  console.log('\n[4] Filas en corpus_legal (anon key — misma key que usa el servidor):');
  const { count, error: cntErr } = await anonClient
    .from('corpus_legal')
    .select('*', { count: 'exact', head: true });
  if (cntErr) {
    console.error('  ✗ RLS bloquea SELECT con anon key:', cntErr.message, '→ H3 confirmada');
  } else {
    console.log(`  count = ${count} filas`);
    if ((count ?? 0) === 0) {
      console.error('  ✗ Corpus vacío → ingesta no llegó a Supabase');
    }
  }

  // ── 7. match_corpus_legal con distintos thresholds ────────────────────
  console.log('\n[5] match_corpus_legal con thresholds decrecientes:');
  const QUERIES = [
    'sanciones disciplinarias servidor público Ley 1952',
    'estructura del Estado colombiano Procuraduría General de la Nación Constitución — cargo objetivo: aspirante PGN — nivel 1',
    'faltas gravísimas artículo 38 Código Disciplinario',
  ];

  for (const q of QUERIES) {
    const v = await embed(q);
    if (!v) { console.error(`  embed falló para: ${q.slice(0,50)}`); continue; }
    console.log(`\n  Query: "${q.slice(0, 70)}..."`);
    for (const thr of [0.72, 0.60, 0.50, 0.40]) {
      const { data, error: rpcErr } = await anonClient.rpc('match_corpus_legal', {
        query_embedding: v,
        match_threshold: thr,
        match_count: 3,
      });
      if (rpcErr) {
        console.log(`    threshold=${thr} → RPC ERROR: ${rpcErr.message}`);
      } else {
        const rows = (data ?? []) as Array<{ norma: string; articulo: string | null; similitud: number }>;
        if (rows.length > 0) {
          const top = rows[0];
          console.log(`    threshold=${thr} → ${rows.length} match(es)  top-1: ${top.norma} ${top.articulo ?? ''} (sim=${top.similitud.toFixed(4)})`);
        } else {
          console.log(`    threshold=${thr} → 0 matches`);
        }
      }
    }
  }

  // ── 8. Verificar GRANT RPC con anon ───────────────────────────────────
  console.log('\n[6] GRANT execute en match_corpus_legal (anon):');
  const v0 = await embed('test');
  if (v0) {
    const { error: grantErr } = await anonClient.rpc('match_corpus_legal', {
      query_embedding: v0,
      match_threshold: 0.9999,
      match_count: 1,
    });
    console.log(grantErr
      ? `  ✗ RPC falló con anon: ${grantErr.message} → H3`
      : '  ✓ RPC ejecutable con anon key');
  }

  // ── 9. H6 — contrato payload página ───────────────────────────────────
  console.log('\n[7] Contrato H6 — payload enviado por diagnostico/[lead_id]/page.tsx:');
  console.log('  Campos que envía la página:');
  console.log('    lead_id, pregunta_actual, nivel_actual,');
  console.log('    aciertos_consecutivos, fallos_consecutivos, respuesta_anterior');
  console.log('  "contexto_usuario" enviado: NO ⚠');
  console.log('  → cargo_aspira default = "aspirante PGN" (genérico)');
  console.log('  → query RAG genérica, posible impacto en umbral 0.72');

  console.log('\n══════════════════════════════════════════════════');
  console.log('Diagnóstico completo.');
  console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: unknown) => {
  console.error('Fatal:', err);
  process.exit(1);
});
