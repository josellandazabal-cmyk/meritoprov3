// Smoke test del endpoint /api/orquestador (sin DB real ni API keys reales).
// Flujo esperado con keys placeholder:
//   1. VOYAGE_API_KEY = pa-tu-... → generarEmbedding() null → buscarCorpusLegal() []
//   2. TAVILY_API_KEY = tvly-tu-... → buscarWebVerificado() []
//   3. origenContexto === 'vacio' → 503 + FRASE_RECHAZO_LITERAL (sin llamar Anthropic)
import { POST } from '../src/app/api/orquestador/route.ts';

const payload = {
  lead_id: 'test-lead',
  pregunta_actual: 0,
  nivel_actual: 1,
  aciertos_consecutivos: 0,
  fallos_consecutivos: 0,
  contexto_usuario: {
    cargo_aspira: 'Procurador Judicial II',
    profesion: 'abogado',
    nivel_educativo: 'especializacion',
    progreso_sm2: { dominio_alto: [], dominio_medio: [], brechas: [] },
    indice_preparacion_actual: 0,
    dias_hasta_concurso: 180,
  },
};

try {
  const req = new Request('http://localhost/api/orquestador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await POST(req);
  const body = await res.json();
  console.log('status:', res.status);
  console.log('body:', JSON.stringify(body, null, 2));

  if (res.status === 503 && typeof body.mensaje === 'string' && body.mensaje.startsWith('No se encuentra jurisprudencia')) {
    console.log('\n✓ SMOKE TEST OK — 503 + frase de rechazo literal correcta');
  } else {
    console.error('\n✗ SMOKE TEST FAIL — resultado inesperado');
    process.exit(1);
  }
} catch (err) {
  console.error('\n✗ SMOKE TEST ERROR — excepción al invocar el handler:');
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
}
