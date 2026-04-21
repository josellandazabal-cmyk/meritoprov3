---
name: ui-ux-institucional
description: Skill del UX Architect de MéritoPro, para profesionales adultos del sector público colombiano. Activa SIEMPRE que la tarea implique diseñar o maquetar pantallas, componentes React + Tailwind, layouts, formularios, dashboards, tarjetas, modales, barras de progreso, navegación (sidebar desktop / bottom bar móvil), estados (loading, empty, error), tipografía, colores, accesibilidad, UX writing, o cuando el usuario mencione "landing", "pantalla de X", "UI", "diseño", "mockup", "componente", "bloqueante", "tinder swipe", "barra de probabilidad". Garantiza que el diseño respete los tokens de CLAUDE.md §9 (tono institucional, adulto, cero ruido decorativo) y que nunca se invente visual — siempre se parte de mockups locales.
---

# UI/UX Institucional MéritoPro

**Tono:** institucional, formal, adulto. Público: profesionales colombianos del sector público bajo presión. Cero infantilismo, cero emojis en UI, cero gamificación con medallas.

## 5 principios de diseño
1. Una pantalla, una acción siguiente (un solo CTA primario).
2. La métrica principal es "Probabilidad de Aprobar" (no puntos).
3. Fidelidad a mockups locales — no inventes visual.
4. Accesibilidad: contraste WCAG AA, focus visible, `aria-label`, `role` en modales.
5. Mobile first desde 375px.

## Tokens (Tailwind)

| Rol | Token | Uso |
|---|---|---|
| Fondo | `bg-white` / `slate-50` | Página, tarjeta |
| Texto principal | `slate-900` | Títulos, cuerpo |
| Texto secundario | `slate-500` | Labels, meta |
| Acción primaria | `bg-yellow-400 text-slate-900` | CTA, progreso |
| Tutor / IA | `indigo-600` | Chat Orquestador |
| Fortaleza ≥70% | `emerald-500` | |
| Medio 50–69% | `amber-400` | |
| Brecha <50% | `rose-500` | |

Tipografía sans del sistema; `font-semibold` títulos, `font-medium` subtítulos. Tamaños: `text-sm` default, `text-2xl` secciones, `text-3xl` sólo dashboards. `rounded-xl`, `shadow-sm`. Nada de `shadow-2xl` ni `rounded-3xl`.

## Navegación post-pago (fijo)
Inicio · Mi Diagnóstico · Módulos de Estudio · Tutor Virtual · Mi Perfil. Desktop: sidebar `w-64`. Móvil: bottom bar `h-16`.

## Componentes de preguntas (4 distintos, ver CLAUDE.md §5)
- `TipoUno.tsx` — 4 opciones A–D, selección única. Botón activo `border-yellow-400 bg-yellow-50`.
- `TipoDos.tsx` — 4 afirmaciones numeradas arriba, 4 combinaciones fijas abajo.
- `TipoTres.tsx` — Afirmación y Razón separadas por "PORQUE" centrado; 5 opciones A–E.
- `LikertComportamental.tsx` — 5 botones horizontales con etiquetas según `escala`.

## Diagnóstico Premium V4 (Evaluación de Nivelación)
- **Pantalla Pre-Test obligatoria:** "Simulacro Oficial de Nivelación" con metadatos (45 min, 40 preg, dificultad adaptativa, Índice de Preparación). Compromiso institucional: "Evaluación alineada al Manual Específico de Funciones PGN".
- **Header evaluación:** progreso segmentado 40 bloques · reloj `font-mono tabular-nums` (amber <5min, rose pulse último min) · etiqueta "Nivel 1/2/3" adaptativo en tiempo real.
- **Marcar para revisión** en cada pregunta (bookmark icon).
- **Sumario pre-envío** listando marcadas + no respondidas antes del cálculo.
- **Tipografía serif** para citas legales dentro de explicaciones (`font-serif italic border-l-4 border-indigo-600 pl-4`). Fuente: Source Serif Pro / Georgia / ui-serif.
- **Lenguaje prohibido (§5.2 V4):** "quiz", "juego", "¡felicidades!", "puntos", "medallas", "ganar", emojis de premio 🎉🏆🔥🎯. Reemplazar por "evaluación", "simulacro", "competencia demostrada", "nivel de dominio", "acertar/fallar", sin emojis.

## Patrones críticos
- **Modal bloqueante de fallo:** no cierra con Esc ni clic-afuera. Bloque normativo con `bg-indigo-50 border-l-4 border-indigo-600`. Un solo botón "Entendido, continuar".
- **Barra "Probabilidad de Aprobar":** `h-3 rounded-full bg-slate-100` con fill `bg-yellow-400` y `transition-all duration-700`.
- **UI Tinder del Bucle Diario:** tarjeta `max-w-2xl mx-auto`, botones "No la sé" (`bg-slate-100`) y "La sé" (`bg-yellow-400`). Teclado ← / →.
- **Estados:** skeleton `bg-slate-100 animate-pulse` (no spinners), empty minimalista + CTA, error `text-rose-600` + "Reintentar".

## Qué NO hacer
- MUI/Chakra. Sólo Tailwind + shadcn/ui puntual.
- Emojis en UI.
- Animaciones > 700ms, glow, gradient bg.
- Inventar copy — marcar `// TODO: copy`.

## Entrega
Ruta del archivo · props tipadas · estados que soporta · pendientes (copy, assets).
