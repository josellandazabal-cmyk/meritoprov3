# Auditoría — Corpus actual vs. Programa Oficial PGN 2026

Cruce línea a línea entre los **11 bloques temáticos oficiales** y los **11 PDFs ingestados** (3.338 chunks en `public.corpus_legal`).

**Veredicto global:** cobertura ~55 %. Bloques críticos descubiertos que **disparan REGLA 4 en producción** si la pregunta cae ahí: **4, 7, 8 y 9**.

---

## Tabla maestra

| # | Bloque oficial | Cobertura | Tu corpus | Lo que falta |
|---|---|---|---|---|
| **0** | Procuraduría como institución | 🟢 90 % | Constitución 1991, Decreto 262/2000, Manual Específico, Resoluciones 039 y 115 de 2022 | PEI 2025-2028 (no es ley, pero la convocatoria lo menciona) |
| **1** | Perfil funcional Procurador Judicial I y II | 🟢 100 % | Manual Específico + Decreto 262 | — |
| **2** | Derecho disciplinario | 🟢 100 % | Ley 1952 de 2019 (CGD) completa | — |
| **3** | Función preventiva y control de gestión | 🟡 40 % | Decreto 262 toca prevención sólo de pasada | **Resolución 132 de 2014** (Función Preventiva PGN), **Resolución 490 de 2008** o vigente, manuales internos de gestión preventiva |
| **4** | Acciones constitucionales | 🟠 30 % | Constitución arts. 86-88 (mención general) | **Decreto 2591 de 1991** (tutela), **Ley 393 de 1997** (cumplimiento), **Ley 472 de 1998** (populares y de grupo) |
| **5** | Procedimiento administrativo y contencioso | 🟢 80 % | Ley 1437 de 2011 (CPACA) | **Ley 1755 de 2015** (derecho de petición — modifica Título II del CPACA) |
| **6** | Conciliación y MASC | 🟢 100 % | Ley 2220 de 2022 (Estatuto de Conciliación) | — |
| **7** | Derecho probatorio, procesal, oralidad y argumentación | 🔴 10 % | Sólo lo que se infiere del CPACA | **Ley 1564 de 2012** (Código General del Proceso), **Ley 906 de 2004** (Procedimiento Penal Acusatorio) |
| **8** | Derechos humanos, DIH, víctimas, infancia, familia | 🔴 5 % | Sólo lo que está en Constitución | **Ley 1448 de 2011** (Víctimas), **Ley 1098 de 2006** (Infancia y Adolescencia), **Ley 1257 de 2008** (mujer), **Ley 1361 de 2009** (familia), Convenios de Ginebra (DIH) |
| **9** | Especialidades sectoriales prioritarias | 🔴 5 % | — | **Ley 100 de 1993** (Salud y SS), **Ley 99 de 1993** (Ambiente), **Ley 685 de 2001** (Código de Minas), **Ley 160 de 1994** (Reforma Agraria), **Código Sustantivo del Trabajo** |
| **10** | Contratación, patrimonio público, anticorrupción | 🟢 95 % | Ley 80 de 1993 + Ley 1150 de 2007 + Ley 1474 de 2011 | (recomendable) **Decreto 1082 de 2015** — reglamentario; Ley 2160 de 2021 actualizaciones |

🟢 ≥80 % · 🟡 40-79 % · 🟠 20-39 % · 🔴 <20 %

---

## Riesgo por bloque

### Bloques 7, 8, 9 — RIESGO ALTO de REGLA 4 en producción

Si una pregunta del aspirante cae en estos bloques (CGP, víctimas, infancia, salud, ambiente…), el RAG retorna 0 chunks relevantes y el sistema responde con la frase de rechazo. Eso le pasa al aspirante en pleno simulacro de diagnóstico.

Estos tres bloques son los que más volumen de preguntas tienen históricamente en concursos PGN, especialmente:

- **Bloque 7** — el examen de Procurador Judicial siempre evalúa CGP y procedimiento.
- **Bloque 8** — víctimas e infancia son ejes recurrentes por la naturaleza social del Ministerio Público.
- **Bloque 9** — preguntas situacionales por especialidad (un Procurador Delegado en lo Ambiental tendrá preguntas de Ley 99/93).

### Bloque 4 — RIESGO MEDIO

La acción de tutela y populares se evalúan SIEMPRE (es la columna vertebral de la intervención judicial PGN). Sin Decreto 2591/91, el corpus dice "según el artículo 86 de la Constitución" pero no puede entrar al detalle del trámite, plazos, competencia ni efectos del fallo.

### Bloque 3 — RIESGO MEDIO-BAJO

La función preventiva se evalúa pero está más en lo conceptual; el corpus actual (Decreto 262 + Manual) cubre el marco general. Mejorable pero no bloqueante.

---

## Plan de remediación — orden recomendado

### Fase 1 · Urgente antes del lanzamiento (P0 — 4 horas de ingesta)

Prioridad por volumen de preguntas esperadas. Las normas son acceso libre en `secretariasenado.gov.co` o `suin-juriscol.gov.co`.

| Norma | Bloque | URL fuente | Tamaño aprox |
|---|---|---|---|
| Ley 1564 de 2012 (CGP) | 7 | https://secretariasenado.gov.co/senado/basedoc/ley_1564_2012.html | Grande (~600 art) |
| Decreto 2591 de 1991 (Tutela) | 4 | https://secretariasenado.gov.co/senado/basedoc/decreto_2591_1991.html | Mediano |
| Ley 472 de 1998 (Populares) | 4 | https://secretariasenado.gov.co/senado/basedoc/ley_0472_1998.html | Mediano |
| Ley 393 de 1997 (Cumplimiento) | 4 | https://secretariasenado.gov.co/senado/basedoc/ley_0393_1997.html | Pequeño |
| Ley 1755 de 2015 (Derecho de petición) | 5 | https://secretariasenado.gov.co/senado/basedoc/ley_1755_2015.html | Pequeño |

### Fase 2 · Antes del primer simulacro masivo (P1 — 6 horas de ingesta)

| Norma | Bloque |
|---|---|
| Ley 1448 de 2011 (Víctimas) | 8 |
| Ley 1098 de 2006 (Infancia y Adolescencia) | 8, 9 |
| Ley 906 de 2004 (Procedimiento Penal Acusatorio) | 7 |
| Ley 100 de 1993 (Salud y Seguridad Social) | 9 |
| Ley 99 de 1993 (Ambiente) | 9 |

### Fase 3 · Para llegar a 90 % (P2 — 4 horas)

| Norma | Bloque |
|---|---|
| Ley 1257 de 2008 (Mujer) | 8 |
| Ley 1361 de 2009 (Familia) | 8 |
| Ley 685 de 2001 (Código de Minas) | 9 |
| Ley 160 de 1994 (Reforma Agraria) | 9 |
| Código Sustantivo del Trabajo (decreto 2663 de 1950) | 9 |
| Decreto 1082 de 2015 (Reglamentario contratación) | 10 |
| Resolución 132 de 2014 PGN (Función Preventiva) | 3 |
| PEI PGN 2025-2028 | 0 |

### Costos de ingesta (Voyage embeddings)

Aprox. **3.000-4.000 chunks adicionales** entre las 3 fases = ~$2-3 USD en tokens Voyage. Despreciable.

---

## Cómo ejecuto la ingesta extra (paso a paso)

1. **Descargar PDFs** de cada norma de las URLs de arriba (te puedo armar el script de descarga si no quieres bajarlos a mano).
2. **Renombrar siguiendo la convención** del corpus actual:
   ```
   LEY_1564_2012_CODIGO_GENERAL_PROCESO.pdf
   DECRETO_2591_1991_TUTELA.pdf
   LEY_472_1998_ACCIONES_POPULARES_GRUPO.pdf
   LEY_393_1997_ACCION_CUMPLIMIENTO.pdf
   LEY_1755_2015_DERECHO_PETICION.pdf
   ...
   ```
3. **Mover a `Documentacion conocimiento base/`**.
4. **Actualizar `scripts/ingesta/ingest_corpus.ts`** con los nuevos slugs (te lo hago yo).
5. **Correr la ingesta** sólo de los nuevos:
   ```bash
   npx tsx scripts/ingesta/ingest_corpus.ts --only=LEY_1564_2012
   npx tsx scripts/ingesta/ingest_corpus.ts --only=DECRETO_2591_1991
   ...
   ```
6. **Validar con `hard-test-rag.mjs`** que las queries de los 11 bloques ahora devuelvan ≥ 1 chunk:
   ```bash
   node scripts/hard-test-rag.mjs
   ```
   Añadir queries de los nuevos temas al script.

---

## Cómo evitar regresión

Una vez ingestadas, añadir al `hard-test-rag.mjs` queries representativas de **cada uno de los 11 bloques** (8 ya están, faltarían 3 más):

```js
const QUERIES_PROGRAMA_OFICIAL = [
  // Bloque 4
  'acción de tutela artículo 86 Constitución decreto 2591',
  'acción popular ley 472 medidas cautelares',
  // Bloque 7
  'Código General del Proceso valoración probatoria',
  'audiencia de juzgamiento procedimiento penal acusatorio',
  // Bloque 8
  'ley de víctimas reparación integral 1448',
  'código infancia adolescencia derechos prevalentes',
  // Bloque 9
  'régimen general salud Ley 100 EPS',
  'licencia ambiental Ley 99 autoridad ambiental',
];
```

Si después de la ingesta extra alguna de estas devuelve 0 chunks → revisar inmediatamente.

---

## Decisiones que necesito de ti

1. **¿Procedo con la Fase 1 (5 normas P0)?** Es lo mínimo razonable para no embarrar la beta con REGLA 4 sistémico.
2. **¿Tienes acceso a los PDFs?** Si no, te genero un script de descarga automatizada desde Secretaría del Senado.
3. **¿Querés que añada las queries de validación al `hard-test-rag.mjs` por bloque?** Te recomiendo que sí.
4. **¿PEI 2025-2028 lo tienes en algún lado?** No lo encontré como PDF público; podría requerir consulta directa a la PGN.

---

## Conclusión ejecutiva

**Hoy:** la beta funciona pero el RAG falla en 4-5 de cada 10 preguntas si pegan en bloques 7, 8 o 9.
**Después de Fase 1 (4 horas de trabajo + ingesta):** cobertura sube a ~75 %, REGLA 4 baja a < 5 %.
**Después de Fase 2 (10 horas más):** cobertura ~90 %, listo para tráfico real.
**Sin Fase 1:** corren riesgo de quemar pauta llevando aspirantes a un producto que no responde temas básicos del examen.
