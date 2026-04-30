# Plan de Ingesta — Corpus Legal MéritoPro V4

Mapea la **Resolución 076 del 24 de marzo de 2026** (Convocatoria "Mérito Construyendo Excelencia", PGN 2026, 2.826 vacantes) con la normativa obligatoria por nivel/cargo. Es la hoja de ruta para (a) priorizar la ingesta al corpus y (b) personalizar la generación de preguntas del Agente 1 por `cargo_aspira`.

> Fuente de verdad: los PDFs físicamente presentes en esta carpeta. Si una norma aparece aquí pero no en disco, marca `[FALTA]` al lado para que se descargue antes de ingresar el corpus.

---

## 1. Normativa troncal (común a **TODOS** los niveles)

Estas normas deben cargarse primero: son eje temático universal del concurso.

| # | Documento | Norma citable | Archivo | Prioridad |
|---|---|---|---|---|
| 1 | Constitución Política de Colombia, 1991 | `Constitución Política de Colombia 1991` | `CONSTITUCION_POLITICA_COLOMBIA_1991.pdf` | P0 |
| 2 | Decreto Ley 262 de 2000 — Régimen Interno PGN | `Decreto Ley 262 de 2000` | `DECRETO_LEY_262_2000_REGIMEN_INTERNO_PGN.pdf` | P0 |
| 3 | Resolución 076 de 2026 — Reglas del concurso | `Resolución 076 de 2026 PGN` | `RESOLUCION_076_2026_REGLAS_CONCURSO_PGN.pdf` | P0 |
| 4 | Guía Metodológica de Pruebas CNSC-PGN 2026 | `Guía Metodológica Pruebas CNSC-PGN 2026` | `GUIA_METODOLOGICA_PRUEBAS_CNSC_PGN.pdf` | P0 |
| 5 | Manual Específico de Funciones y Requisitos PGN | `Manual Específico de Funciones y Requisitos PGN` | `MANUAL_ESPECIFICO_FUNCIONES_REQUISITOS_PGN.pdf` | P1 |
| 6 | Adiciones al Manual (Resoluciones 039 y 115 de 2022) | `Resoluciones 039 y 115 de 2022 PGN` | `ADICION_MANUAL_FUNCIONES_RES_039_115_2022_PGN.pdf` | P1 |

## 2. Ejes temáticos por nivel

### 2.1 Nivel Profesional (Procurador Judicial I/II, Profesional Universitario)

Enfoque jurídico-disciplinario. Es el perfil con mayor exigencia normativa.

- Troncal P0–P1 completa
- **Ley 1952 de 2019** — Código General Disciplinario (`LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf`) — P0
- **Ley 1437 de 2011** — CPACA, procedimiento administrativo (`LEY_1437_2011_CPACA.pdf`) — P0
- **Ley 80 de 1993** + **Ley 1150 de 2007** — Contratación estatal (`LEY_80_1993_CONTRATACION_ESTATAL.pdf`, `LEY_1150_2007_CONTRATACION_MODIFICA_LEY80.pdf`) — P1
- **Ley 1474 de 2011** — Estatuto Anticorrupción (`LEY_1474_2011_ESTATUTO_ANTICORRUPCION.pdf`) — P1
- **Ley 2220 de 2022** — Estatuto de Conciliación (`LEY_2220_2022_ESTATUTO_CONCILIACION.pdf`) — P2

### 2.2 Nivel Asesor / Ejecutivo / Directivo

Mismo eje del Profesional + énfasis mayor en:
- Constitución (órganos de control, Ministerio Público, funciones PGN — Arts. 275–284)
- Decreto Ley 262 (estructura interna y competencias de los procuradores delegados)
- Contratación estatal (Ley 80, Ley 1150, Ley 1474)

### 2.3 Nivel Técnico

- Troncal P0–P1 completa
- Ley 1437 de 2011 (CPACA, especialmente trámite disciplinario y notificaciones)
- Ley 1474 de 2011 (deberes del servidor, inhabilidades)
- Manual Específico (funciones propias del nivel técnico)

### 2.4 Nivel Administrativo / Operativo

- Troncal P0–P1 completa
- Manual Específico (funciones de apoyo administrativo)
- Constitución (principios función pública, Arts. 123–125)
- Conocimientos de gestión documental y archivo (no hay norma específica en el corpus actual — si la PGN publica eje temático explícito, agregar PDF correspondiente)

## 3. Mapa cargo → `categoria` → archivos

Este mapping es el que usa `scripts/ingesta/ingest_corpus.ts` y el que el Agente 1 referencia al construir la query RAG según `contexto_usuario.cargo_aspira`.

| Carpeta lógica (`categoria`) | Archivos incluidos |
|---|---|
| `01_constitucion_y_organos_control` | `CONSTITUCION_POLITICA_COLOMBIA_1991.pdf` |
| `02_regimen_disciplinario` | `LEY_1952_CODIGO_GENERAL_DISCIPLINARIO.pdf` |
| `03_pgn_regimen_interno` | `DECRETO_LEY_262_2000_REGIMEN_INTERNO_PGN.pdf`, `MANUAL_ESPECIFICO_FUNCIONES_REQUISITOS_PGN.pdf`, `ADICION_MANUAL_FUNCIONES_RES_039_115_2022_PGN.pdf` |
| `04_procedimiento_administrativo` | `LEY_1437_2011_CPACA.pdf` |
| `05_contratacion_estatal` | `LEY_80_1993_CONTRATACION_ESTATAL.pdf`, `LEY_1150_2007_CONTRATACION_MODIFICA_LEY80.pdf` |
| `06_transparencia_anticorrupcion` | `LEY_1474_2011_ESTATUTO_ANTICORRUPCION.pdf` |
| `07_mecanismos_resolucion_conflictos` | `LEY_2220_2022_ESTATUTO_CONCILIACION.pdf` |
| `08_reglas_concurso_2026` | `RESOLUCION_076_2026_REGLAS_CONCURSO_PGN.pdf`, `GUIA_METODOLOGICA_PRUEBAS_CNSC_PGN.pdf` |

## 4. Fuentes oficiales (por si hay que re-descargar un PDF)

Si algún PDF se corrompe o sale una versión actualizada, las fuentes originales son:

- **Constitución Política de Colombia 1991** — `secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html`
- **Ley 1952 de 2019** (CGD) — `suin-juriscol.gov.co` / `secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html`
- **Decreto Ley 262 de 2000** — `suin-juriscol.gov.co` / `procuraduria.gov.co/portal/Normatividad`
- **Manual PGN + Resoluciones 039/115 de 2022** — `procuraduria.gov.co` (Transparencia → Talento Humano)
- **Ley 1437 de 2011** (CPACA) — `funcionpublica.gov.co/eva/gestornormativo`
- **Ley 80 de 1993, Ley 1150 de 2007** — `secretariasenado.gov.co`
- **Ley 1474 de 2011** — `secretariasenado.gov.co`
- **Ley 2220 de 2022** — `secretariasenado.gov.co`
- **Resolución 076 de 2026** — `procuraduria.gov.co/Documents/2026/Concurso-de-meritos/`
- **Guía Metodológica CNSC-PGN** — `cnsc.gov.co/pgn`

## 5. Procedimiento de ingesta (paso a paso)

1. **Asegurar envs en `.env.local`:**
   ```
   VOYAGE_API_KEY=pa-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  (no anon; escritura necesita service_role)
   ```
2. **Correr la migración SQL** (una sola vez):
   ```
   supabase/migrations/0001_corpus_legal_voyage.sql
   ```
   Crea `public.corpus_legal` con `vector(1024)` y la RPC `match_corpus_legal`.
3. **Instalar deps de ingesta (solo si aún no están):**
   ```bash
   npm i -D tsx pdf-parse
   ```
4. **Dry run** (verifica chunking sin llamar a Voyage ni a Supabase):
   ```bash
   npx tsx scripts/ingesta/ingest_corpus.ts --dry
   ```
5. **Ingesta real, por troncal primero:**
   ```bash
   npx tsx scripts/ingesta/ingest_corpus.ts --only=CONSTITUCION
   npx tsx scripts/ingesta/ingest_corpus.ts --only=DECRETO_LEY_262
   npx tsx scripts/ingesta/ingest_corpus.ts --only=LEY_1952
   ```
6. **Ingesta completa** (resto de normas):
   ```bash
   npx tsx scripts/ingesta/ingest_corpus.ts
   ```
7. **Sanity check en Supabase SQL Editor:**
   ```sql
   select categoria, count(*), round(avg(tokens)) as avg_tokens
   from public.corpus_legal
   group by categoria
   order by categoria;
   ```
   Esperable: 300–1200 chunks por ley grande. Si alguna sale con <50, revisar chunking de ese archivo.

## 6. Política de actualización

- **Reforma normativa.** Nunca sobrescribas un PDF; renómbralo (`_MODIF_LEY_XXXX_YYYY.pdf`) y re-ingesta. El `hash` del chunk dedupe automáticamente.
- **Versión del eje temático.** Si la CNSC publica oficialmente los ejes temáticos (la Resolución los prevé con 1 mes de antelación a la Prueba Escrita), agregar un PDF nuevo `EJE_TEMATICO_OFICIAL_2026.pdf` en `08_reglas_concurso_2026/` y registrarlo en `DOCUMENTOS` del script.
- **Log de fallbacks.** El Agente 1 loguea cada rechazo literal en `ia_llamadas.tarea='fallback_sin_respuesta'`. Si un tema aparece >3 veces/semana, hay brecha en el corpus — agregar norma o guía ciudadana a la ingesta.
