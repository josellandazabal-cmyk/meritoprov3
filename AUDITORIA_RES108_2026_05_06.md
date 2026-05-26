# Auditoría — Integración Resolución 108 de 2026 al stack MéritoPro

**Fecha:** 6 mayo 2026
**Alcance:** Resolución 076 + Resolución 108 correctiva (PGN 2026)
**Estado global:** ✅ código mergeado · 🟡 corpus en re-ingesta · ⏳ deploy Vercel en cola

---

## 1. Resumen ejecutivo

Se cerró la inconsistencia entre los datos oficiales de la Convocatoria 2026 (Res 076 + Res 108 correctiva) y los parámetros internos del proyecto. El cambio toca tres capas: corpus legal (RAG), código del producto (route handler Next.js 15) y documentación maestra (4 markdown). El push a `origin/master` quedó hecho con el commit `89091b8`, lo que dispara el auto-deploy de Vercel. La ingesta de embeddings al pgvector se reanudó con delay 1000 ms y termina sola (idempotente).

Los datos correctos que ahora viven en el sistema:

- **2.824 vacantes definitivas** (no 2.826 — ese era el conteo provisional pre-Res 108).
- **291 convocatorias** activas.
- **Inscripciones: 1 al 12 de junio 2026** en `méritoconstruyendoexcelencia.com.co`.
- **Operador oficial: Universidad de Antioquia.**
- **Cargo Asesor 1AS-19:** 153 cargos, salario base $10.403.514.

---

## 2. Estado por capa

### 2.1. Código (Next.js / Supabase)

| Item | Estado | Detalle |
|---|---|---|
| Commit `89091b8` en `origin/master` | ✅ pusheado | `feat(corpus): integrar Resolución 108 de 2026 (versión 2 correctiva)` |
| HEAD local vs remoto | ✅ sincronizado | `git diff HEAD origin/master --stat` vacío. |
| Fix Next.js 15 — params async | ✅ aplicado | `src/app/api/crm/referidos/[codigo]/route.ts` ahora usa `params: Promise<{ codigo: string }>` y `await params`. Desbloquea `tsc`. |
| Auto-deploy Vercel | ⏳ en cola | Se dispara con el push; ETA 30-60 s para build + 1-2 min para healthcheck. |

### 2.2. Corpus pgvector (RAG)

PDFs renombrados a convención `snake_case`:

| Archivo | Categoría | Norma | Chunking | Estado de ingesta |
|---|---|---|---|---|
| `RESOLUCION_108_2026_CORRECTIVA_CONCURSO_PGN.pdf` | `08_reglas_concurso_2026` | Resolución 108 de 2026 PGN | `articulos` | ✅ 5 chunks insertados |
| `RESOLUCION_108_2026_CONVOCATORIAS_VERSION2.pdf` | `08_reglas_concurso_2026` | Convocatorias Concurso de Méritos PGN 2026 (V2) | `parrafos` | 🟡 en curso · 1.146 chunks · delay 1000 ms · ETA ≈ 3 min |
| `RESOLUCION_108_2026_COMPILADO_CONVOCATORIAS_VR03.pdf` | `08_reglas_concurso_2026` | Compilado Convocatorias PGN 2026 (VR03) | `parrafos` | ⏳ siguiente en cola |

El script `scripts/ingesta/ingest_corpus.ts` deduplica por hash MD5, así que reanudar tras cancelación no produce duplicados — sólo procesa los chunks que aún no están en la tabla.

### 2.3. Documentación maestra

| Archivo | Cambio |
|---|---|
| `BETA_v0.1_RELEASE.md` | Header: "Res 076 + Res 108 correctiva. 2.824 vacantes definitivas en 291 convocatorias. Inscripciones 1-12 jun 2026." |
| `MASTER_DOC_MeritoPro.md` | Línea 4: marco normativo + sitio oficial + fechas inscripción. |
| `Plan_de_Marketing_MeritoPro.md` | `replace_all` "2.826 vacantes" → "2.824 vacantes" (3 ocurrencias). |
| `Documentacion conocimiento base/Plan_de_Ingesta.md` | Matriz actualizada con las 3 entradas de Res 108 + URL `méritoconstruyendoexcelencia.com.co`. |

---

## 3. Verificación SQL (correr al cierre de la ingesta)

```sql
-- 1. Confirmar las 3 fuentes de Res 108 ingestadas
SELECT documento, COUNT(*) AS chunks
FROM corpus_legal
WHERE documento LIKE 'RESOLUCION_108_2026%'
GROUP BY documento
ORDER BY documento;

-- Esperado: 3 filas
--   RESOLUCION_108_2026_CORRECTIVA_CONCURSO_PGN.pdf            ~5
--   RESOLUCION_108_2026_CONVOCATORIAS_VERSION2.pdf          ~1146
--   RESOLUCION_108_2026_COMPILADO_CONVOCATORIAS_VR03.pdf       ~?

-- 2. Sanidad: total del corpus
SELECT COUNT(*) AS chunks_totales,
       COUNT(DISTINCT documento) AS documentos_distintos
FROM corpus_legal;

-- 3. Hit de prueba (semántico): "fechas de inscripción"
-- Debería traer chunks que mencionen 1-12 junio 2026 o méritoconstruyendoexcelencia.
SELECT documento, LEFT(texto, 180) AS preview
FROM corpus_legal
WHERE documento LIKE 'RESOLUCION_108_2026%'
  AND texto ILIKE '%inscripci%'
LIMIT 5;
```

⚠️ Falso positivo conocido: `LIKE '%108%'` también captura `DECRETO_1082` (1.331 chunks). Usar siempre el prefijo específico `RESOLUCION_108_2026%`.

---

## 4. Pruebas funcionales recomendadas (post-deploy)

Una vez Vercel termine el build y la ingesta confirme las 3 filas:

1. **Tutor / orquestador** — preguntar:
   - "¿Cuándo abren las inscripciones para el concurso PGN 2026?" → debe citar Res 108 y la fecha 1-12 junio 2026.
   - "¿Cuántas vacantes tiene la convocatoria?" → debe responder 2.824 (no 2.826).
   - "¿Quién opera el concurso?" → Universidad de Antioquia.
2. **REGLA 4 anti-alucinación** — preguntar algo fuera del corpus (ej. jurisprudencia 2025) → debe disparar la frase literal de rechazo, no inventar.
3. **Landing pública** (`/`) — verificar que la copia muestra 2.824 y las fechas correctas.
4. **Hard test del RAG** — `node scripts/hard-test-rag.mjs` y revisar top-1 sim ≥ 0.45 en preguntas sobre Res 108.

---

## 5. Pendientes del lado del usuario

| # | Acción | Responsable | Bloqueante para... |
|---|---|---|---|
| 1 | Esperar fin de la ingesta (ETA ≈ 3-5 min desde el reanudado) | terminal local | verificar SQL §3 |
| 2 | Correr el SQL §3 en Supabase Dashboard | tú | confirmar corpus completo |
| 3 | Revisar build de Vercel (`vercel.com/<proyecto>/deployments`) | tú | producción |
| 4 | Smoke test conversacional sobre el Tutor en producción | tú | OK funcional Res 108 |
| 5 | Configurar `TAVILY_API_KEY` real (sigue placeholder) | tú | reduce rechazos REGLA 4 cuando el corpus no cubre algo |
| 6 | Configurar `TELEGRAM_BOT_TOKEN` | tú | desbloquear Agente 2 (Motivador) |

---

## 6. Riesgos vivos

- **Tavily placeholder** — si un aspirante pregunta por jurisprudencia muy reciente que no está en el corpus, dispara REGLA 4. Alta probabilidad / impacto medio. Mitigación: configurar Tavily real antes de pauta.
- **Voyage rate limits** — el tier free es 3 RPM. Para futuras re-ingestas masivas conviene subir a tier paid (o seguir la ruta delay 1000 ms con paciencia).
- **Latencia P95 del orquestador** — añadir 1.146 chunks nuevos al índice puede bajar el recall si IVFFlat necesita re-tuning de `probes`. La migración `0003` ya lo deja en `probes=20`, pero monitorear top-1 sim los primeros días.

---

## 7. Definición de "hecho" para esta integración

- [x] PDFs oficiales renombrados y commiteados.
- [x] `ingest_corpus.ts` con las 3 entradas de Res 108.
- [x] Docs maestros actualizados (4 markdown).
- [x] Fix Next.js 15 params en `crm/referidos/[codigo]`.
- [x] Push a `origin/master` (commit `89091b8`).
- [ ] Ingesta completada (3 filas en `corpus_legal` con prefijo `RESOLUCION_108_2026`).
- [ ] Deploy Vercel verde.
- [ ] Smoke test del Tutor con preguntas sobre fechas y vacantes.

Cuando los tres últimos pasen a ✓, esta auditoría se cierra y la beta sigue en track con datos oficiales correctos.
