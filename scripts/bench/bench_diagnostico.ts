import { performance } from 'perf_hooks';

const ORQUESTRADOR_URL = 'http://localhost:3000/api/orquestador';
const LEAD_ID = `bench-test-lead-${Date.now()}`;

interface BenchResult {
  q: number;
  tipo: string;
  total_ms: number;
  ttfb_ms: number;
  size_bytes: number;
  generado_por: string;
  cache_hit: boolean;
  input_tok: number;
  output_tok: number;
  cache_read_tok: number;
  cache_write_tok: number;
  status: number;
}

async function runBench() {
  console.log(`🚀 Iniciando benchmark contra ${ORQUESTRADOR_URL}`);
  console.log(`Lead ID: ${LEAD_ID}`);
  console.log(`MERITO_MODEL_ROUTING: ${process.env.MERITO_MODEL_ROUTING || 'false'}\n`);

  const results: BenchResult[] = [];
  let totalTime = 0;

  for (let i = 0; i < 10; i++) {
    const payload = {
      lead_id: LEAD_ID,
      pregunta_actual: i,
      nivel_actual: 1,
      aciertos_consecutivos: 0,
      fallos_consecutivos: 0,
      total_objetivo: 10,
      tipo_sesion: 'diagnostico',
      contexto_usuario: {
        cargo_aspira: 'Procurador Judicial I',
        nivel_educativo: 'profesional'
      }
    };

    const start = performance.now();
    
    let ttfb = 0;
    let responseText = '';
    let status = 0;
    
    try {
      const res = await fetch(ORQUESTRADOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      ttfb = performance.now() - start;
      status = res.status;
      responseText = await res.text();
    } catch (err: any) {
      console.error(`Error en Q${i+1}:`, err.message);
      continue;
    }
    
    const end = performance.now();
    const total_ms = end - start;
    totalTime += total_ms;
    
    let json: any = {};
    try {
      json = JSON.parse(responseText);
    } catch (e) {
      json = { error: 'Invalid JSON' };
    }

    const _meta = json._meta || {};
    const tipo = json.pregunta?.estructura?.tipo || (status === 200 ? 'N/A' : 'ERROR');
    
    results.push({
      q: i + 1,
      tipo,
      total_ms,
      ttfb_ms: ttfb,
      size_bytes: responseText.length,
      generado_por: json.generado_por || 'unknown',
      cache_hit: _meta.cache_hit || false,
      input_tok: _meta.input_tokens || 0,
      output_tok: _meta.output_tokens || 0,
      cache_read_tok: _meta.cache_read_tokens || 0,
      cache_write_tok: _meta.cache_write_tokens || 0,
      status
    });
    
    console.log(`Q${i+1}: ${total_ms.toFixed(0)}ms | HTTP ${status} | hit=${_meta.cache_hit || false} | por=${json.generado_por || 'ERROR'}`);
  }

  // Calculate stats
  if (results.length === 0) {
    console.log("No valid results.");
    return;
  }

  const times = results.map(r => r.total_ms).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const cacheHits = results.filter(r => r.cache_hit).length;
  const hitRate = (cacheHits / results.length) * 100;
  
  let baselineTokens = 0;
  let billedTokens = 0;
  
  results.forEach(r => {
     baselineTokens += r.input_tok + r.output_tok;
     billedTokens += (r.input_tok) + (r.cache_write_tok * 1.25) + (r.cache_read_tok * 0.1) + r.output_tok; 
  });
  
  console.log('\n### Resultados del Benchmark');
  console.log('| # | tipo | ms | ttfb | generado_por | hit | input_tok | cache_read | cache_write | output_tok | HTTP |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  results.forEach(r => {
    console.log(`| Q${r.q} | ${r.tipo} | ${r.total_ms.toFixed(0)} | ${r.ttfb_ms.toFixed(0)} | ${r.generado_por} | ${r.cache_hit ? '✅' : '❌'} | ${r.input_tok} | ${r.cache_read_tok} | ${r.cache_write_tok} | ${r.output_tok} | ${r.status} |`);
  });
  
  console.log(`\n**Resumen:**`);
  console.log(`- **p50:** ${p50.toFixed(0)} ms`);
  console.log(`- **p95:** ${p95.toFixed(0)} ms`);
  console.log(`- **Total Time:** ${totalTime.toFixed(0)} ms`);
  console.log(`- **Cache Hit Rate:** ${hitRate.toFixed(1)}%`);

  console.log('\n### Validaciones de SLA:');
  const q1 = results.find(r => r.q === 1);
  if (q1) {
    const q1Pass = q1.total_ms <= 15000;
    console.log(`- Q1 ≤ 15s (cold): ${q1Pass ? '✅' : '❌'} (${q1.total_ms.toFixed(0)}ms)`);
  }
  
  const q2to5 = results.filter(r => r.q >= 2 && r.q <= 5 && r.status === 200);
  if (q2to5.length > 0) {
    const q2to5Pass = q2to5.every(r => r.total_ms <= 500);
    const maxQ2to5 = Math.max(...q2to5.map(r => r.total_ms));
    console.log(`- Q2-Q5 ≤ 500ms (cache hit): ${q2to5Pass ? '✅' : '❌'} (max: ${maxQ2to5.toFixed(0)}ms)`);
  } else {
    console.log(`- Q2-Q5 ≤ 500ms (cache hit): ❌ (No valid 200 OK responses in range)`);
  }
  
  const q6 = results.find(r => r.q === 6);
  if (q6) {
    const q6Pass = q6.total_ms <= 500;
    console.log(`- Q6 ≤ 500ms (lote pre-generado): ${q6Pass ? '✅' : '❌'} (${q6.total_ms.toFixed(0)}ms)`);
  }
  
  console.log(`- Cache hit rate ≥ 80%: ${hitRate >= 80 ? '✅' : '❌'} (${hitRate.toFixed(1)}%)`);
  
  let billedQ2On = 0;
  let nonCachedBilledQ2On = 0;
  
  results.filter(r => r.q >= 2).forEach(r => {
    const cost = r.input_tok + r.output_tok + (r.cache_write_tok * 1.25) + (r.cache_read_tok * 0.10);
    billedQ2On += cost;
    const baselineCost = 6000 + 1000;
    nonCachedBilledQ2On += baselineCost;
  });
  
  const costReduction = nonCachedBilledQ2On > 0 ? (1 - (billedQ2On / nonCachedBilledQ2On)) * 100 : 0;
  console.log(`- % reducción de tokens facturados vs baseline ≥ 70% desde Q2: ${costReduction >= 70 ? '✅' : '❌'} (aprox ${costReduction.toFixed(1)}%)`);
}

runBench().catch(console.error);
