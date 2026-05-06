# Documentacion conocimiento base — Corpus RAG MéritoPro

Esta carpeta es la **única fuente primaria** de conocimiento para los agentes IA de MéritoPro. Todo lo que los agentes citen debe provenir de aquí (o del fallback Tavily restringido a `*.gov.co`).

Ver `Directivas_Agentes_V4.md` en la raíz del proyecto para las reglas completas de uso.

---

## Estructura recomendada

Organizá los PDFs dentro de subcarpetas temáticas. Esto facilita la ingesta (cada subcarpeta se procesa por lotes) y el filtrado por categoría a la hora de hacer búsquedas RAG.

```
Documentacion conocimiento base/
├── 01_constitucion_y_organos_control/
│   └── CONSTITUCION_POLITICA_COLOMBIA_1991.pdf
├── 02_regimen_disciplinario/
│   └── LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf
├── 03_pgn_regimen_interno/
│   ├── DECRETO_LEY_262_2000_REGIMEN_INTERNO_PGN.pdf
│   ├── MANUAL_ESPECIFICO_FUNCIONES_REQUISITOS_PGN.pdf
│   └── ADICION_MANUAL_FUNCIONES_RES_039_115_2022_PGN.pdf
├── 04_procedimiento_administrativo/
│   └── LEY_1437_2011_CPACA.pdf
├── 05_contratacion_estatal/
│   ├── LEY_80_1993_CONTRATACION_ESTATAL.pdf
│   └── LEY_1150_2007_CONTRATACION_MODIFICA_LEY80.pdf
├── 06_transparencia_anticorrupcion/
│   └── LEY_1474_2011_ESTATUTO_ANTICORRUPCION.pdf
├── 07_mecanismos_resolucion_conflictos/
│   └── LEY_2220_2022_ESTATUTO_CONCILIACION.pdf
├── 08_reglas_concurso_2026/
│   ├── RESOLUCION_076_2026_REGLAS_CONCURSO_PGN.pdf
│   └── GUIA_METODOLOGICA_PRUEBAS_CNSC_PGN.pdf
└── 99_uso_interno/
    └── Marketing base.pdf           (NO se ingesta al RAG del Tutor)
```

> La subcarpeta `99_uso_interno/` se excluye del pipeline RAG del Agente 1. Material de marketing, operaciones y notas internas vive ahí.

### Convención de nombres

- Ruta siempre en `SNAKE_CASE_MAYUSCULAS`.
- Prefijo numérico `NN_` indica orden y categoría (el número no cambia si se agregan PDFs; los nuevos toman el siguiente libre).
- Los nombres de archivo reproducen exactamente la cita legal (`LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf`). Esta coherencia ayuda al modelo a devolver citas consistentes.

---

## Metadata por chunk (obligatoria)

Cada fragmento (chunk) ingestado a `pgvector` lleva los siguientes campos en la tabla `corpus_legal`:

```sql
create table public.corpus_legal (
  id          bigserial primary key,
  categoria   text not null,          -- '02_regimen_disciplinario' (nombre de carpeta)
  documento   text not null,          -- 'LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf'
  norma       text not null,          -- 'Ley 1952 de 2019'
  articulo    text,                   -- 'Art. 28'
  numeral     text,                   -- 'Numeral 4' (opcional)
  contenido   text not null,          -- texto del chunk
  tokens      int  not null,
  pagina_pdf  int,                    -- página original de donde se extrajo
  hash        text not null unique,   -- SHA-1 del contenido (anti-duplicados)
  embedding   vector(1024) not null,   -- voyage-3-large (Voyage AI)
  created_at  timestamptz not null default now()
);

create index corpus_legal_embedding_idx
  on public.corpus_legal using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index corpus_legal_categoria_idx on public.corpus_legal(categoria);
create index corpus_legal_norma_idx     on public.corpus_legal(norma);
```

La cita que devuelve el modelo al usuario se construye exactamente de `norma + articulo + numeral` de la fila coincidente. Esto es lo que garantiza que la Regla 3 del §2 de Directivas V4 se cumpla.

---

## Protocolo de ingesta

1. **Extraer texto** con `pdf-parse` (o `pdfplumber` si el PDF es escaneado + OCR).
2. **Chunking normativo** — no partir por número de tokens a ciegas. Partir por **artículo** del texto normativo. Un chunk = 1 artículo (o 1 numeral si el artículo es muy largo).
3. **Tokens objetivo:** 300–800 por chunk. Si un artículo supera 800, dividir por numerales; si aun así excede, dividir por incisos conservando el encabezado del artículo en cada pieza.
4. **Metadata extraction** — usar un regex específico o un pase Claude Haiku rápido para extraer `norma`, `articulo`, `numeral` de cada chunk. Persistir en las columnas.
5. **Embeddings** con `voyage-3-large` (Voyage AI, 1024 dims, multilingual — ecosistema Anthropic). Usar `input_type: 'document'` durante la ingesta y `input_type: 'query'` al consultar. No mezclar modelos en la misma tabla: si alguna vez migrás a otro proveedor, re-ingestá todo desde cero.
6. **Deduplicación por `hash`** — nunca insertar un chunk ya existente. Útil cuando se reprocesan PDFs tras una corrección.
7. **Verificación post-ingesta** — correr una query de sanity check contra preguntas conocidas (ej. "¿cuántos años tiene la acción disciplinaria?") y validar que el top-1 retornado es del chunk correcto.

Pipeline sugerido: `scripts/ingesta/ingest_pdfs.ts` (script separado, corre on-demand o al pushear nuevos PDFs).

---

## Fuentes permitidas en fallback Tavily (recordatorio)

Si el corpus local no responde, Tavily solo puede buscar en:

- `gov.co` (cualquier subdominio gubernamental colombiano)
- `funcionpublica.gov.co`
- `procuraduria.gov.co`
- `suin-juriscol.gov.co`
- `corteconstitucional.gov.co`
- `ramajudicial.gov.co`

Cualquier otra fuente se descarta. El agente cita con `[Verificado online: URL]` (ver §3.3 de Directivas V4).

---

## Mantenimiento

- **Versionado de PDFs.** Si sale una reforma, NO sobreescribir el PDF anterior. Guardar ambos: `LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf` y `LEY_1952_CODIGO_GENERAL_DISCIPLINARIO_MODIF_LEY_XXXX_2026.pdf`. El chunker agrega las dos versiones; el Agente 1 sabe por el campo `norma` cuál prevalece.
- **Auditoría trimestral.** Correr `SELECT categoria, COUNT(*), AVG(tokens) FROM corpus_legal GROUP BY categoria;` y comparar contra los totales esperados. Alertar si bajó 10%+ (posible regresión del pipeline).
- **Log de preguntas sin respuesta.** El Agente 1 loguea en `ia_llamadas.tarea = 'fallback_sin_respuesta'` cada vez que cae al rechazo del §7. Si un tema aparece >3 veces en la semana, es señal de que falta literatura en el corpus — agregar PDF o artículo relevante.
