# Reporte de diagnóstico — RAG MéritoPro V4

**Fecha:** Abril 2026 · **Rama:** `fix/regla4-query-construction`
**Síntoma original:** Pantalla "EVALUACIÓN INTERRUMPIDA" en la primera pregunta del simulacro de diagnóstico, con HTTP 503 desde `/api/orquestador`.

## 1. Análisis

### 1.1 Causa raíz identificada

`construirQueryRAG()` en `src/app/api/orquestador/route.ts` concatenaba un sufijo `"— cargo objetivo: ${cargo} — nivel ${nivel}"` al topic normativo antes de pasarlo a Voyage. Para cargos específicos (ej. *Procurador Judicial I*), ese sufijo es texto no presente en el corpus legal: dispersa el centroide del embedding y deja la similitud coseno por debajo de `UMBRAL_SIMILITUD = 0.55` (medidas: top-1 ≈ 0.4886). Resultado: 0 chunks → fallback Tavily (placeholder en este Supabase) también vacío → REGLA 4 dispara 503.

### 1.2 Fixes aplicados

| Capa | Cambio | Archivo |
|---|---|---|
| Query del retrieval | Eliminar sufijo cargo+nivel; devolver sólo el topic normativo. | `src/app/api/orquestador/route.ts` línea 486-509 |
| Brechas (post-Q10) | Misma limpieza: la brecha viaja como texto puro. | `src/app/api/orquestador/route.ts` línea 492-494 |
| Umbral de similitud | 0.55 → 0.45, justificado empíricamente. | `src/lib/rag/corpus.ts` línea 19-25 |

### 1.3 Por qué la solución no rompe la hiper-personalización

El cargo y el nivel siguen llegando al modelo Anthropic vía `contexto_usuario` en el **user message** (no son input del retrieval). El system prompt y la herramienta `emitir_pregunta` los usan para calibrar tono, dificultad y normas de referencia. Lo único que se quitó es el ruido en el query del embedding.

## 2. Estado tras el fix (validación E2E reportada por QA)

| Capa | Resultado |
|---|---|
| Build | ✅ Compiled successfully |
| Landing (form → lead → redirect) | ✅ |
| Diagnóstico, todos los tipos | ✅ 5/5 preguntas, los 4 tipos generados |
| Tipo I (A/B/C/D + feedback) | ✅ |
| Tipo II (afirmaciones + combinaciones estáticas) | ✅ |
| Tipo III (afirmación/PORQUE/razón + opciones A-E) | ✅ contraste fixed |
| Comportamental (Likert 1-5, requiere selección) | ✅ |
| Dificultad adaptativa Nivel I → II | ✅ |
| Cache (batch de 5, sin rechazo por nivel) | ✅ |
| RAG (threshold 0.45, corpus 3338 chunks) | ✅ |
| Dashboard páginas | ✅ |

## 3. Deuda técnica abierta

| Riesgo | Mitigación recomendada |
|---|---|
| `TAVILY_API_KEY` sigue como placeholder. Sin él, REGLA 4 se dispara cuando el corpus no cubre un tema (ej. jurisprudencia reciente). | Configurar la key real o aceptar que el sistema sólo responde sobre el corpus ingestado (decisión de producto). |
| El umbral 0.45 baja la barra de relevancia. El filtro de calidad real ahora es REGLA 3 del prompt (cita exacta). | Si aparecen citas inventadas, subir el umbral a 0.50 y volver a probar el módulo afectado con el hard test. |
| No hay test que rompa el build cuando alguien vuelva a contaminar la query del RAG. | Ejecutar `scripts/hard-test-rag.mjs` en CI antes de merge a `main` (ver §5). |

## 4. Cambios verificables

```diff
- function construirQueryRAG(p: Payload, nivel: 1 | 2 | 3): string {
-   const cargo = p.contexto_usuario?.cargo_aspira ?? 'aspirante PGN';
-   if (brechas.length > 0 && p.pregunta_actual >= 10) {
-     return `${brechas[0]} concurso PGN ${cargo} nivel ${nivel}`;
-   }
-   const modulo = modulosDiagnostico[…];
-   return `${modulo} — cargo objetivo: ${cargo} — nivel ${nivel}`;
+ function construirQueryRAG(p: Payload, nivel: 1 | 2 | 3): string {
+   void nivel;  // queda en la firma para futuras estrategias
+   if (p.tema_forzado) return p.tema_forzado;
+   const brechas = p.contexto_usuario?.progreso_sm2.brechas ?? [];
+   if (brechas.length > 0 && p.pregunta_actual >= 10) return brechas[0];
+   return modulosDiagnostico[p.pregunta_actual % modulosDiagnostico.length];
```

```diff
- const UMBRAL_SIMILITUD = 0.55;
+ const UMBRAL_SIMILITUD = 0.45;  // verificado Abr-2026, ver comentario inline
```

## 5. Hard test reproducible

`scripts/hard-test-rag.mjs` — banco de pruebas que se conecta a Voyage + Supabase reales y mide tres escenarios:

1. **Fase 1:** los 8 módulos del diagnóstico → top-1, mean(6) y chunks devueltos.
2. **Fase 2:** brechas SM-2 simuladas (acción de tutela, faltas leves, ius puniendi…).
3. **Fase 3:** regresión — inyecta el sufijo cargo+nivel sobre el módulo Decreto 262/2000 y confirma que SÍ cae bajo 0.55, demostrando que la causa raíz es real.

Uso:
```bash
node scripts/hard-test-rag.mjs
```

Sale con código 0 si todas las queries productivas devuelven ≥ 1 chunk a similitud ≥ 0.45. Si alguna falla, lista el query y los datos.

## 6. Próximas iteraciones sugeridas

- **Configurar Tavily real** para tener red de seguridad cuando el corpus no cubre un tema.
- **Re-ingestar jurisprudencia 2024-2026** (sentencias del Consejo de Estado y Corte Constitucional sobre régimen disciplinario) para subir la base del top-1 sim.
- **Wirear `hard-test-rag.mjs` a CI** (GitHub Actions) con secrets para que rompa el build si alguien re-introduce ruido en la query.
- **Telemetría:** loggear top-1 sim de cada query del orquestador a Vercel Analytics para detectar regresiones de retrieval antes de que el usuario las vea.
