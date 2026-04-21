# Directivas Estrictas Agentes IA (V4)

## 1. REGLAS RAG Y ANTI-ALUCINACIÓN

- La carpeta local es `/Documentacion_conocimiento_base`. Claude SOLO lee de aquí vía pgvector.
- Cero conclusiones propias. Cero opiniones.
- TODA respuesta debe incluir cita exacta (Ej: "Según Ley 1952/2019, Art. 38, Numeral 4...").
- Si el contexto RAG no contiene la respuesta, FALLBACK a búsqueda web verificada.

## 2. FALLBACK A BÚSQUEDA WEB VERIFICADA

- Si pgvector falla, usar Tavily Search API restringida a sitios gubernamentales:
  - `site:gov.co`
  - `site:funcionpublica.gov.co`
  - `site:procuraduria.gov.co`
  - `site:suin-juriscol.gov.co`
- Formato respuesta: `[Verificado online: URL]`
- Fallo total: "No se encuentra jurisprudencia o norma verificada. No puedo especular."

## 3. HIPER-PERSONALIZACIÓN

- Respuestas genéricas prohibidas.
- Inyectar perfil del usuario en CADA llamada (cargo, profesión, progreso SM-2).
- Adaptar tono. Generar casos prácticos del cargo específico.
- Atacar debilidades. Desviar ejemplos hacia temas débiles del usuario.

## 4. DIAGNÓSTICO PREMIUM

- UI tipo "Simulacro Oficial de Nivelación" (estilo Pearson VUE).
- Pantalla pre-test con dashboard analítico.
- Reloj en cuenta regresiva. Botón "Marcar para revisión".
- Dificultad adaptativa: Nivel 1 → 2 → 3 según aciertos.
- Lenguaje: "Evaluación", "Simulacro", "Competencia demostrada". Cero "quiz" o "juego".
