// ============================================================
// MéritoPro V4 — Pipeline de ingesta del corpus legal
// ------------------------------------------------------------
// Lee los PDFs de `Documentacion conocimiento base/`, los
// parte por artículo, calcula embeddings con Voyage voyage-3-large
// (1024 dim) y los inserta en public.corpus_legal con dedupe por hash.
//
// Requisitos:
//   npm i -D tsx pdf-parse
//   .env.local con:
//     VOYAGE_API_KEY
//     NEXT_PUBLIC_SUPABASE_URL
//     SUPABASE_SERVICE_ROLE_KEY
//
// Uso (desde la raíz del proyecto):
//   npx tsx scripts/ingesta/ingest_corpus.ts
//   npx tsx scripts/ingesta/ingest_corpus.ts --only=LEY_1952
//   npx tsx scripts/ingesta/ingest_corpus.ts --dry
// ============================================================

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const execFileP = promisify(execFile);
// createRequire permite resolver CommonJS desde este módulo ESM.
// pdf-parse es CJS y tiene `exports` restrictivo en su package.json,
// pero require() lo resuelve sin problemas y evita el debug-mode bug.
const requireCJS = createRequire(import.meta.url);

/**
 * Extrae texto de un PDF. Prioridad:
 *   1. `pdf-parse` (npm) — preferido en producción.
 *      Importamos el módulo interno `lib/pdf-parse.js` para saltarnos el
 *      entrypoint debug que intenta leer un PDF de test y truena en npm.
 *   2. `pdftotext` (Poppler CLI) — fallback universal (Linux/Mac/WSL).
 */
async function extraerTextoPDF(ruta: string): Promise<string> {
  // 1. pdf-parse vía require() CJS. Soporta dos APIs:
  //    - v1.x: module.exports = function(buf) -> { text }
  //    - v2.x: module.exports = { PDFParse: class } — new PDFParse({ data }).getText()
  try {
    const buf = await readFile(ruta);
    // Tipado laxo porque la shape depende de la versión instalada.
    const mod: unknown = requireCJS('pdf-parse');

    // v1.x: export directo como función
    if (typeof mod === 'function') {
      const parsed = (await (mod as (b: Buffer) => Promise<{ text: string }>)(
        buf
      )) as { text: string };
      return parsed.text;
    }
    // v1.x transpilado con .default
    const modObj = mod as Record<string, unknown>;
    if (typeof modObj?.default === 'function') {
      const parsed = (await (
        modObj.default as (b: Buffer) => Promise<{ text: string }>
      )(buf)) as { text: string };
      return parsed.text;
    }
    // v2.x: clase PDFParse
    const PDFParseClass = modObj?.PDFParse as
      | (new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }> })
      | undefined;
    if (typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: buf });
      const parsed = await parser.getText();
      return parsed.text;
    }

    throw new Error(
      `pdf-parse tiene shape inesperada — keys: ${Object.keys(modObj ?? {}).join(
        ', '
      )}`
    );
  } catch (err) {
    console.error(
      `  (pdf-parse falló, probando pdftotext) — ${(err as Error).message}`
    );
  }
  // 2. Fallback: Poppler CLI (Linux/Mac o Windows con Poppler instalado)
  const { stdout } = await execFileP('pdftotext', ['-layout', '-q', ruta, '-'], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

// ---------- Configuración ----------
const CARPETA_CORPUS = 'Documentacion conocimiento base';
const VOYAGE_MODEL = 'voyage-3-large';
const VOYAGE_DIM = 1024;
// Batch size conservador para no romper límites TPM del tier free-sin-tarjeta
// (10K TPM). Con tarjeta registrada podés subirlo a 64 o 128.
const VOYAGE_BATCH = Number(process.env.VOYAGE_BATCH ?? 8);
// Delay mínimo entre requests (ms). Respeta 3 RPM del tier restringido
// (20s entre requests) o 300 RPM del tier standard (~200ms).
const VOYAGE_REQUEST_DELAY_MS = Number(
  process.env.VOYAGE_REQUEST_DELAY_MS ?? 500
);
const VOYAGE_MAX_RETRIES = 6; // backoff hasta ~2 min por batch en peor caso
const CHUNK_MIN_TOKENS = 40; // descartar chunks muy cortos (ruido)
const CHUNK_MAX_TOKENS = 800; // partir por incisos si se excede

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Categoria =
  | '01_constitucion_y_organos_control'
  | '02_regimen_disciplinario'
  | '03_pgn_regimen_interno'
  | '04_procedimiento_administrativo'
  | '05_contratacion_estatal'
  | '06_transparencia_anticorrupcion'
  | '07_mecanismos_resolucion_conflictos'
  | '08_reglas_concurso_2026'
  // Categorías añadidas tras Auditoria_Corpus_vs_Programa_Oficial.md
  | '09_acciones_constitucionales'
  | '10_derecho_procesal_y_probatorio'
  | '11_derechos_humanos_victimas_infancia'
  | '12_especialidades_sectoriales';

interface DocumentoFuente {
  archivo: string;
  categoria: Categoria;
  norma: string;
  estrategiaChunking: 'articulos' | 'parrafos';
}

const DOCUMENTOS: DocumentoFuente[] = [
  {
    archivo: 'CONSTITUCION_POLITICA_COLOMBIA_1991.pdf',
    categoria: '01_constitucion_y_organos_control',
    norma: 'Constitución Política de Colombia 1991',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf',
    categoria: '02_regimen_disciplinario',
    norma: 'Ley 1952 de 2019',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'DECRETO_LEY_262_2000_REGIMEN_INTERNO_PGN.pdf',
    categoria: '03_pgn_regimen_interno',
    norma: 'Decreto Ley 262 de 2000',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'MANUAL_ESPECIFICO_FUNCIONES_REQUISITOS_PGN.pdf',
    categoria: '03_pgn_regimen_interno',
    norma: 'Manual Específico de Funciones y Requisitos PGN',
    estrategiaChunking: 'parrafos',
  },
  {
    archivo: 'ADICION_MANUAL_FUNCIONES_RES_039_115_2022_PGN.pdf',
    categoria: '03_pgn_regimen_interno',
    norma: 'Resoluciones 039 y 115 de 2022 PGN',
    estrategiaChunking: 'parrafos',
  },
  {
    archivo: 'LEY_1437_2011_CPACA.pdf',
    categoria: '04_procedimiento_administrativo',
    norma: 'Ley 1437 de 2011 (CPACA)',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_80_1993_CONTRATACION_ESTATAL.pdf',
    categoria: '05_contratacion_estatal',
    norma: 'Ley 80 de 1993',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1150_2007_CONTRATACION_MODIFICA_LEY80.pdf',
    categoria: '05_contratacion_estatal',
    norma: 'Ley 1150 de 2007',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1474_2011_ESTATUTO_ANTICORRUPCION.pdf',
    categoria: '06_transparencia_anticorrupcion',
    norma: 'Ley 1474 de 2011',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_2220_2022_ESTATUTO_CONCILIACION.pdf',
    categoria: '07_mecanismos_resolucion_conflictos',
    norma: 'Ley 2220 de 2022',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'RESOLUCION_076_2026_REGLAS_CONCURSO_PGN.pdf',
    categoria: '08_reglas_concurso_2026',
    norma: 'Resolución 076 de 2026 PGN',
    estrategiaChunking: 'articulos',
  },
  {
    // Resolución 108 del 23/04/2026 — modificatoria de la 076. Define
    // versión 2 de la convocatoria con 2.824 vacantes definitivas en 291
    // convocatorias e inscripciones del 1 al 12 de junio de 2026.
    archivo: 'RESOLUCION_108_2026_CORRECTIVA_CONCURSO_PGN.pdf',
    categoria: '08_reglas_concurso_2026',
    norma: 'Resolución 108 de 2026 PGN',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'RESOLUCION_108_2026_CONVOCATORIAS_VERSION2.pdf',
    categoria: '08_reglas_concurso_2026',
    norma: 'Convocatorias Concurso de Méritos PGN 2026 (V2)',
    estrategiaChunking: 'parrafos',
  },
  {
    archivo: 'RESOLUCION_108_2026_COMPILADO_CONVOCATORIAS_VR03.pdf',
    categoria: '08_reglas_concurso_2026',
    norma: 'Compilado Convocatorias PGN 2026 (VR03)',
    estrategiaChunking: 'parrafos',
  },
  {
    archivo: 'GUIA_METODOLOGICA_PRUEBAS_CNSC_PGN.pdf',
    categoria: '08_reglas_concurso_2026',
    norma: 'Guía Metodológica Pruebas CNSC-PGN 2026',
    estrategiaChunking: 'parrafos',
  },

  // ============================================================
  // FASE 1 — Acciones constitucionales y procedimiento (Bloques 4 y 5)
  // ============================================================
  {
    archivo: 'DECRETO_2591_1991_TUTELA.pdf',
    categoria: '09_acciones_constitucionales',
    norma: 'Decreto 2591 de 1991',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_472_1998_ACCIONES_POPULARES_GRUPO.pdf',
    categoria: '09_acciones_constitucionales',
    norma: 'Ley 472 de 1998',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_393_1997_ACCION_CUMPLIMIENTO.pdf',
    categoria: '09_acciones_constitucionales',
    norma: 'Ley 393 de 1997',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1755_2015_DERECHO_PETICION.pdf',
    categoria: '04_procedimiento_administrativo',
    norma: 'Ley 1755 de 2015',
    estrategiaChunking: 'articulos',
  },

  // ============================================================
  // FASE 1 / 2 — Derecho procesal, probatorio, oralidad (Bloque 7)
  // ============================================================
  {
    archivo: 'LEY_1564_2012_CODIGO_GENERAL_PROCESO.pdf',
    categoria: '10_derecho_procesal_y_probatorio',
    norma: 'Ley 1564 de 2012 (CGP)',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_906_2004_PROCEDIMIENTO_PENAL_ACUSATORIO.pdf',
    categoria: '10_derecho_procesal_y_probatorio',
    norma: 'Ley 906 de 2004',
    estrategiaChunking: 'articulos',
  },

  // ============================================================
  // FASE 2 — Derechos humanos, víctimas, infancia (Bloque 8)
  // ============================================================
  {
    archivo: 'LEY_1448_2011_VICTIMAS.pdf',
    categoria: '11_derechos_humanos_victimas_infancia',
    norma: 'Ley 1448 de 2011',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1098_2006_CODIGO_INFANCIA_ADOLESCENCIA.pdf',
    categoria: '11_derechos_humanos_victimas_infancia',
    norma: 'Ley 1098 de 2006',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_1257_2008_NO_VIOLENCIA_MUJER.pdf',
    categoria: '11_derechos_humanos_victimas_infancia',
    norma: 'Ley 1257 de 2008',
    estrategiaChunking: 'articulos',
  },

  // ============================================================
  // FASE 2 / 3 — Especialidades sectoriales (Bloque 9)
  // ============================================================
  {
    archivo: 'LEY_100_1993_SEGURIDAD_SOCIAL_SALUD.pdf',
    categoria: '12_especialidades_sectoriales',
    norma: 'Ley 100 de 1993',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_99_1993_AMBIENTE_SINA.pdf',
    categoria: '12_especialidades_sectoriales',
    norma: 'Ley 99 de 1993',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_685_2001_CODIGO_MINAS.pdf',
    categoria: '12_especialidades_sectoriales',
    norma: 'Ley 685 de 2001',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_160_1994_REFORMA_AGRARIA.pdf',
    categoria: '12_especialidades_sectoriales',
    norma: 'Ley 160 de 1994',
    estrategiaChunking: 'articulos',
  },

  // ============================================================
  // FASE 3 — Reglamentario contratación (Bloque 10)
  // ============================================================
  {
    archivo: 'DECRETO_1082_2015_REGLAMENTARIO_CONTRATACION.pdf',
    categoria: '05_contratacion_estatal',
    norma: 'Decreto 1082 de 2015',
    estrategiaChunking: 'articulos',
  },

  // ============================================================
  // COMPLEMENTO — Normas faltantes para bloques 6 y 7
  // ============================================================
  {
    archivo: 'LEY_594_2000_GESTION_DOCUMENTAL_ARCHIVOS.pdf',
    categoria: '04_procedimiento_administrativo',
    norma: 'Ley 594 de 2000',
    estrategiaChunking: 'articulos',
  },
  {
    archivo: 'LEY_909_2004_EMPLEO_PUBLICO_CARRERA_ADMINISTRATIVA.pdf',
    categoria: '04_procedimiento_administrativo',
    norma: 'Ley 909 de 2004',
    estrategiaChunking: 'articulos',
  },
];

// ---------- Tipos ----------
interface Chunk {
  categoria: Categoria;
  documento: string;
  norma: string;
  articulo: string | null;
  numeral: string | null;
  contenido: string;
  tokens: number;
  pagina_pdf: number | null;
  hash: string;
}

interface ChunkConEmbedding extends Chunk {
  embedding: number[];
}

// ---------- Utilidades ----------
function aprox_tokens(texto: string): number {
  // Español: ~4 chars/token. Aproximación suficiente para filtros.
  return Math.ceil(texto.length / 4);
}

function sha1(s: string): string {
  return createHash('sha1').update(s).digest('hex');
}

function limpiar(texto: string): string {
  return texto
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Chunking ----------
const ARTICULO_REGEX =
  /\n\s*(?:ART[IÍ]?CULO|Art[ií]?culo)\s+(\d{1,4})\s*[°º.]*\s*\.?\s*(?:<[^>]+>)?\s*/g;

const NUMERAL_REGEX =
  /\n\s*(\d{1,3})\s*[.\-)]\s+/g;

function chunkPorArticulos(
  texto: string,
  doc: DocumentoFuente
): Chunk[] {
  const limpio = limpiar(texto);
  const chunks: Chunk[] = [];

  // Encontrar todas las posiciones de "Artículo N"
  const matches: Array<{ numero: string; inicio: number }> = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(ARTICULO_REGEX.source, 'g');
  while ((m = regex.exec(limpio)) !== null) {
    matches.push({ numero: m[1], inicio: m.index });
  }

  if (matches.length === 0) {
    // No se detectaron artículos: caer a chunking por párrafos.
    return chunkPorParrafos(limpio, doc);
  }

  for (let i = 0; i < matches.length; i++) {
    const inicio = matches[i].inicio;
    const fin = i + 1 < matches.length ? matches[i + 1].inicio : limpio.length;
    const bloque = limpio.slice(inicio, fin).trim();
    const articulo = `Art. ${matches[i].numero}`;
    const tokens = aprox_tokens(bloque);

    if (tokens < CHUNK_MIN_TOKENS) continue;

    if (tokens <= CHUNK_MAX_TOKENS) {
      chunks.push({
        categoria: doc.categoria,
        documento: doc.archivo,
        norma: doc.norma,
        articulo,
        numeral: null,
        contenido: bloque,
        tokens,
        pagina_pdf: null,
        hash: sha1(`${doc.norma}|${articulo}|${bloque}`),
      });
    } else {
      // Partir por numerales "1. ... 2. ..."
      const sub = partirPorNumerales(bloque, articulo, doc);
      chunks.push(...sub);
    }
  }
  return chunks;
}

function partirPorNumerales(
  bloque: string,
  articulo: string,
  doc: DocumentoFuente
): Chunk[] {
  const chunks: Chunk[] = [];
  const matches: Array<{ numero: string; inicio: number }> = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(NUMERAL_REGEX.source, 'g');
  while ((m = regex.exec(bloque)) !== null) {
    matches.push({ numero: m[1], inicio: m.index });
  }

  if (matches.length < 2) {
    // No suficientes numerales: trocear por tamaño de token.
    return trocearPorTamaño(bloque, articulo, null, doc);
  }

  // Encabezado del artículo = todo lo anterior al primer numeral.
  const encabezado = bloque.slice(0, matches[0].inicio).trim();

  for (let i = 0; i < matches.length; i++) {
    const ini = matches[i].inicio;
    const fin = i + 1 < matches.length ? matches[i + 1].inicio : bloque.length;
    const cuerpo = bloque.slice(ini, fin).trim();
    const numeral = `Numeral ${matches[i].numero}`;
    const contenido = `${encabezado}\n${cuerpo}`;
    const tokens = aprox_tokens(contenido);
    if (tokens < CHUNK_MIN_TOKENS) continue;

    if (tokens <= CHUNK_MAX_TOKENS) {
      chunks.push({
        categoria: doc.categoria,
        documento: doc.archivo,
        norma: doc.norma,
        articulo,
        numeral,
        contenido,
        tokens,
        pagina_pdf: null,
        hash: sha1(`${doc.norma}|${articulo}|${numeral}|${contenido}`),
      });
    } else {
      chunks.push(...trocearPorTamaño(contenido, articulo, numeral, doc));
    }
  }
  return chunks;
}

function trocearPorTamaño(
  texto: string,
  articulo: string | null,
  numeral: string | null,
  doc: DocumentoFuente
): Chunk[] {
  const chunks: Chunk[] = [];
  const oraciones = texto.split(/(?<=[.!?])\s+/);
  let buffer: string[] = [];
  let tokens = 0;

  const push = () => {
    const contenido = buffer.join(' ').trim();
    if (!contenido || aprox_tokens(contenido) < CHUNK_MIN_TOKENS) return;
    chunks.push({
      categoria: doc.categoria,
      documento: doc.archivo,
      norma: doc.norma,
      articulo,
      numeral,
      contenido,
      tokens: aprox_tokens(contenido),
      pagina_pdf: null,
      hash: sha1(
        `${doc.norma}|${articulo ?? ''}|${numeral ?? ''}|${contenido}`
      ),
    });
  };

  for (const oracion of oraciones) {
    const t = aprox_tokens(oracion);
    if (tokens + t > CHUNK_MAX_TOKENS && buffer.length > 0) {
      push();
      buffer = [];
      tokens = 0;
    }
    buffer.push(oracion);
    tokens += t;
  }
  if (buffer.length > 0) push();
  return chunks;
}

function chunkPorParrafos(texto: string, doc: DocumentoFuente): Chunk[] {
  const limpio = limpiar(texto);
  const parrafos = limpio.split(/\n{2,}/);
  return trocearPorTamaño(parrafos.join('\n\n'), null, null, doc);
}

// ---------- Voyage embeddings ----------
async function embedBatch(
  textos: string[],
  apiKey: string
): Promise<number[][]> {
  // Retry con exponential backoff para 429 (rate limit) y 5xx transitorios.
  let lastErr: Error | null = null;
  for (let intento = 0; intento < VOYAGE_MAX_RETRIES; intento++) {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: textos,
        input_type: 'document',
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };
      return data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => {
          if (d.embedding.length !== VOYAGE_DIM) {
            throw new Error(
              `Embedding dim ${d.embedding.length} != esperada ${VOYAGE_DIM}`
            );
          }
          return d.embedding;
        });
    }

    const body = await res.text();
    lastErr = new Error(`Voyage ${res.status}: ${body.slice(0, 200)}`);

    // No reintentar en errores permanentes (4xx distinto de 429)
    if (res.status !== 429 && res.status < 500) break;

    // Backoff exponencial: 2s, 4s, 8s, 16s, 32s, 60s (cap)
    const waitMs = Math.min(60_000, 2_000 * Math.pow(2, intento));
    console.error(
      `  ⚠ ${res.status} en intento ${intento + 1}/${VOYAGE_MAX_RETRIES} — reintentando en ${waitMs / 1000}s...`
    );
    await sleep(waitMs);
  }
  throw lastErr ?? new Error('Voyage embedBatch agotó reintentos');
}

// ---------- Pipeline principal ----------
// Tipo laxo: el schema de corpus_legal se valida en runtime por la migración.
type AnySupabase = SupabaseClient<never, never, never>;

async function ingestarDocumento(
  doc: DocumentoFuente,
  voyageKey: string,
  supabase: AnySupabase,
  dry: boolean
): Promise<{ insertados: number; saltados: number; errores: number }> {
  const ruta = resolve(CARPETA_CORPUS, doc.archivo);
  console.log(`\n→ ${doc.archivo}`);

  let texto: string;
  try {
    texto = await extraerTextoPDF(ruta);
  } catch (err) {
    const msg = (err as NodeJS.ErrnoException).message;
    // ENOENT = el PDF no se ha descargado. No es error real — significa
    // que la fase correspondiente todavía no fue ingestada. El loop
    // sigue con el resto de documentos.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT' || /no such file/i.test(msg)) {
      console.log(`  ⊘ Saltado: archivo no presente (descarga la Fase correspondiente con scripts/ingesta/descargar_corpus_extra.sh)`);
      return { insertados: 0, saltados: 0, errores: 0 };
    }
    console.error(`  ✗ No se pudo leer: ${msg}`);
    return { insertados: 0, saltados: 0, errores: 1 };
  }
  const chunks =
    doc.estrategiaChunking === 'articulos'
      ? chunkPorArticulos(texto, doc)
      : chunkPorParrafos(texto, doc);

  console.log(`  → ${chunks.length} chunks generados`);
  if (chunks.length === 0) {
    return { insertados: 0, saltados: 0, errores: 0 };
  }

  if (dry) {
    console.log(`  (dry run) ejemplo chunk[0]:`);
    console.log(`    articulo=${chunks[0].articulo} numeral=${chunks[0].numeral}`);
    console.log(`    tokens=${chunks[0].tokens}`);
    console.log(`    preview="${chunks[0].contenido.slice(0, 140)}..."`);
    return { insertados: 0, saltados: chunks.length, errores: 0 };
  }

  // Embeddings por lotes
  const conEmb: ChunkConEmbedding[] = [];
  for (let i = 0; i < chunks.length; i += VOYAGE_BATCH) {
    const lote = chunks.slice(i, i + VOYAGE_BATCH);
    const textos = lote.map((c) => c.contenido);
    try {
      const embeddings = await embedBatch(textos, voyageKey);
      lote.forEach((c, j) => conEmb.push({ ...c, embedding: embeddings[j] }));
      console.log(
        `  · embeddings ${i + lote.length}/${chunks.length} ok`
      );
    } catch (err) {
      console.error(`  ✗ batch ${i}:`, (err as Error).message);
      return {
        insertados: conEmb.length,
        saltados: chunks.length - conEmb.length,
        errores: 1,
      };
    }
    // Delay entre requests para respetar RPM
    if (i + VOYAGE_BATCH < chunks.length) {
      await sleep(VOYAGE_REQUEST_DELAY_MS);
    }
  }

  // Insert con onConflict por hash
  const filas = conEmb.map((c) => ({
    categoria: c.categoria,
    documento: c.documento,
    norma: c.norma,
    articulo: c.articulo,
    numeral: c.numeral,
    contenido: c.contenido,
    tokens: c.tokens,
    pagina_pdf: c.pagina_pdf,
    hash: c.hash,
    embedding: c.embedding,
  }));

  // Supabase no tiene ON CONFLICT DO NOTHING vía JS client directamente,
  // pero upsert con onConflict: 'hash' e ignoreDuplicates hace el trabajo.
  const { error, count } = await supabase
    .from('corpus_legal')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(filas as unknown as any, {
      onConflict: 'hash',
      ignoreDuplicates: true,
      count: 'exact',
    });

  if (error) {
    console.error(`  ✗ insert:`, error.message);
    return { insertados: 0, saltados: 0, errores: 1 };
  }

  const insertados = count ?? filas.length;
  const saltados = filas.length - insertados;
  console.log(`  ✓ insertados=${insertados}  saltados(dup)=${saltados}`);
  return { insertados, saltados, errores: 0 };
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const filtro = onlyArg?.split('=')[1]?.toUpperCase();

  // Load .env.local (Next.js no lo carga automáticamente para scripts fuera)
  try {
    const env = await readFile('.env.local', 'utf8');
    for (const linea of env.split(/\r?\n/)) {
      const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // opcional
  }

  const voyageKey = process.env.VOYAGE_API_KEY;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dry && (!voyageKey || !supaUrl || !supaKey)) {
    console.error(
      'Faltan envs: VOYAGE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
    console.error('Pasa --dry para probar solo el chunking sin llamar APIs.');
    process.exit(1);
  }

  const supabase = !dry
    ? (createClient(supaUrl!, supaKey!, {
        auth: { persistSession: false },
      }) as unknown as AnySupabase)
    : (null as unknown as AnySupabase);

  const docs = filtro
    ? DOCUMENTOS.filter((d) => d.archivo.toUpperCase().includes(filtro))
    : DOCUMENTOS;

  if (docs.length === 0) {
    console.error(`Ningún documento coincide con --only=${filtro}`);
    process.exit(1);
  }

  console.log(
    `\nMéritoPro V4 · Ingesta corpus_legal`,
    dry ? '(DRY RUN)' : `(modelo=${VOYAGE_MODEL}, dim=${VOYAGE_DIM})`
  );
  console.log(`Documentos a procesar: ${docs.length}`);

  let totalIns = 0;
  let totalDup = 0;
  let totalErr = 0;

  for (const doc of docs) {
    const r = await ingestarDocumento(doc, voyageKey ?? '', supabase, dry);
    totalIns += r.insertados;
    totalDup += r.saltados;
    totalErr += r.errores;
  }

  console.log(`\n========== RESUMEN ==========`);
  console.log(`Documentos:           ${docs.length}`);
  if (dry) {
    console.log(`Chunks (dry run):     ${totalDup}`);
  } else {
    console.log(`Insertados:           ${totalIns}`);
    console.log(`Duplicados (hash):    ${totalDup}`);
  }
  console.log(`Errores:              ${totalErr}`);
  console.log(`=============================\n`);

  if (totalErr > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
