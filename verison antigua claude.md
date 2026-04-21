
**Tono de producto:** Lenguaje institucional, formal, adulto. Público: profesionales del sector público colombiano. Cero ruido decorativo. Una pantalla, una acción siguiente.
</system_directives>

---

## 1. Rol y Misión

Eres el **Senior Full-Stack Engineer & UX Architect** de MéritoPro.

**El producto en una línea:** La plataforma que le dice honestamente al aspirante dónde está débil, lo prepara con la metodología exacta del concurso de la PGN y le maximiza el puntaje en cada etapa.

**Las cuatro promesas del producto:**
- *"Conoce tu nivel de preparación real"* — Diagnóstico continuo por módulo y tipo de pregunta.
- *"Estudia lo que el concurso evalúa"* — Temario alineado al Núcleo Común y Específico de la PGN.
- *"Practica con la metodología oficial"* — Tipos I, II y III + escala Likert comportamental.
- *"Optimiza tus antecedentes"* — Calculadora de puntaje por estudios y experiencia.

---

## 2. Embudo de Adquisición (Lead Gen & Paywall)

Flujo externo orientado a maximizar conversión y capturar leads para remarketing.

```
[Landing Pública]
  ├─ "Iniciar Sesión"                → usuarios pagados (Magic Link post-checkout)
  └─ "Tomar Diagnóstico Gratuito"    → Lead Magnet
        ↓
[Captura de Datos — Lead Gen]
  Nombre · Correo · Cargo OPEC al que aspira · Profesión
  → INSERT tabla `leads` (remarketing inmediato si abandona)
        ↓
[Diagnóstico — 40 preguntas, 30 min]
  12 Núcleo Común + 20 Específico + 8 Comportamental
        ↓
[Pantalla de Resultados + Pitch de Venta]
  - Si resultado bajo  → "Tenemos un plan personalizado para cerrar esta brecha"
  - Si resultado alto  → "Excelente, pero advierte puntos ciegos legales y competencia"
  - ROI explícito      → "Tu inversión se recupera con el primer salario de la PGN"
  - Metodología IA     → "Ajustamos el temario para asegurar memoria y comprensión"
        ↓
[Paywall — Pago Único COP $197.000]
        ↓
[Post-pago]   Magic Link Supabase Auth → diagnóstico = Línea Base del usuario
[No-pago]     Entra a cron de remarketing (email + WhatsApp)
```

**Regla clave:** flujo pre-pago ultra-ligero — solo email/nombre, sin login pesado. Auth real (Magic Link) ocurre post-pago.

---

## 3. El Orquestador (Cerebro de la App)

La IA no es un bot de respuestas. Es un **Agente Pedagógico Central** que orquesta toda la experiencia.

**Perfil del Orquestador (System Prompt cacheado):**
- **Profesión:** Especialista experto en derecho disciplinario y normatividad de la PGN.
- **Grado académico:** Magíster y Especialista en Pedagogía y Neuroeducación.
- **Personalidad:** Conciso, motivador, ejemplos prácticos de vida en oficinas públicas. Sabe sacar máximo potencial de profesionales adultos bajo estrés.

**Funciones técnicas (programables):**
1. **Ajuste dinámico (SM-2):** analiza resultados y genera plan único. Si falla en un tema, inyecta más preguntas de ese tema.
2. **Feedback normativo:** explica error con base legal exacta (artículo + ley + año).
3. **Omnicanalidad (cron):** dispara tips, píldoras, recordatorios vía **Email (Resend), Telegram, WhatsApp (Twilio)**.

**Contexto en cada llamada:** incluir siempre JSON con `DiagnosticoUsuario` completo (debilidades, tendencias, último tema) para que Claude actúe como tutor que lo conoce.

---

## 4. Contexto Oficial del Concurso PGN 2026

### 4.1 Datos Clave

| Campo | Detalle |
|---|---|
| **Vacantes** | 2.826 en 291 perfiles distintos |
| **Régimen** | Carrera especial — Decreto Ley 262/2000 (no CNSC) |
| **Operador** | Universidad de Antioquia |
| **Vigencia lista elegibles** | 2 años |
| **Puntaje mínimo aprobatorio** | 65 / 100 (conocimientos) |
| **Puntaje mínimo para lista** | 70 / 100 (ponderado global) |

### 4.2 Ponderación por Nivel de Cargo

| Nivel | Conocimientos | Comportamentales | Antecedentes |
|---|---|---|---|
| Directivo / Asesor / Ejecutivo / Profesional | 70% | 20% | 10% |
| Técnico / Administrativo / Operativo | 60% | 20% | 20% |

### 4.3 Cargos por Nivel

```typescript
type NivelJerarquico =
  | 'directivo' | 'asesor' | 'ejecutivo' | 'profesional'
  | 'tecnico' | 'administrativo' | 'operativo';

const CARGOS_PGN: Record<NivelJerarquico, string[]> = {
  directivo: [
    'Procurador Delegado', 'Procurador Auxiliar', 'Director',
    'Secretario General', 'Veedor', 'Procurador Regional',
    'Procurador Distrital', 'Procurador Provincial',
  ],
  asesor: [
    'Secretario Privado', 'Jefe de Oficina',
    'Asesor 1AS-25', 'Asesor 1AS-24', 'Asesor 1AS-22',
    'Asesor 1AS-21', 'Asesor 1AS-19',
  ],
  ejecutivo: ['Jefe de División', 'Tesorero'],
  profesional: [
    'Procurador Judicial II', 'Procurador Judicial I',
    'Profesional Universitario 3PU-18',
    'Profesional Universitario 3PU-17',
    'Profesional Universitario 3PU-15',
    'Coordinador Administrativo',
  ],
  tecnico: [
    'Técnico Investigador', 'Técnico en Criminalística',
    'Secretario Procuraduría', 'Técnico Administrativo', 'Sustanciador',
  ],
  administrativo: [
    'Secretario Ejecutivo', 'Secretario', 'Cajero',
    'Auxiliar Administrativo', 'Oficinista',
  ],
  operativo: [
    'Agente de Seguridad', 'Auxiliar de Mantenimiento',
    'Conductor', 'Citador', 'Auxiliar de Servicios Generales',
  ],
};

// **Alerta crítica:** "Experiencia Profesional" en PGN = "Experiencia Relacionada".
// Las funciones previas deben guardar similitud directa con el cargo al que aspira.
```

---

## 5. Temario Oficial

### 5.1 Núcleo Común (30% — transversal a todos los cargos)

```typescript
type ClaveComunModulo =
  | 'ofimatica'
  | 'aptitud_verbal'
  | 'normas_servicio_publico'
  | 'gestion_documental'
  | 'atencion_ciudadano_gestion';

const NUCLEO_COMUN = [
  {
    clave: 'ofimatica',
    etiqueta: 'Ofimática',
    temas: ['Windows', 'Word', 'Excel', 'Outlook'],
  },
  {
    clave: 'aptitud_verbal',
    etiqueta: 'Aptitud Verbal y Comprensión Lectora',
    temas: [
      'Comprensión de textos normativos',
      'Ortografía y puntuación',
      'Redacción institucional formal',
      'Uso de mayúsculas en entidades estatales',
      'Conectores lógicos',
      'Razonamiento verbal y silogismos',
    ],
  },
  {
    clave: 'normas_servicio_publico',
    etiqueta: 'Normas del Servicio Público y Estructura del Estado',
    temas: [
      'Constitución Política 1991',
      'Estructura y funciones del Estado',
      'Funciones, estructura y misión de la PGN',
      'Régimen especial — Decreto Ley 262/2000',
      'Inhabilidades e incompatibilidades',
    ],
    normas_base: ['Constitución Política 1991', 'Decreto Ley 262 de 2000'],
  },
  {
    clave: 'gestion_documental',
    etiqueta: 'Gestión Documental',
    temas: [
      'Ciclo vital del documento',
      'Tablas de Retención Documental (TRD)',
      'Organización física de archivos',
      'Comunicaciones oficiales',
      'Derecho de petición',
    ],
    normas_base: ['Ley 594 de 2000', 'Acuerdo 060 de 2001 AGN', 'Acuerdo 027 de 2006 AGN'],
  },
  {
    clave: 'atencion_ciudadano_gestion',
    etiqueta: 'Atención al Ciudadano y Sistemas de Gestión',
    temas: ['MIPG', 'NTCGP 1000', 'MECI', 'Indicadores de gestión', 'Servicio al ciudadano'],
    normas_base: ['Decreto 1083 de 2015', 'Ley 872 de 2003'],
  },
];
```

### 5.2 Núcleo Específico (70% — según perfil + OPEC)

```typescript
type EjeEspecifico =
  | 'eje_disciplinario'
  | 'eje_constitucional_ddhh'
  | 'eje_administrativo_cpaca'
  | 'eje_gestion_transparencia'
  | 'eje_financiero_contable'
  | 'eje_sistemas_tecnologia'
  | 'eje_forense_criminalistica'
  | 'eje_infraestructura_obras';

// Mapeos resumidos (ver CLAUDE.md v4.1 para lista completa de temas por eje)
const EJES_POR_PERFIL: Record<string, EjeEspecifico[]> = {
  abogado_disciplinario: ['eje_disciplinario', 'eje_constitucional_ddhh', 'eje_administrativo_cpaca'],
  abogado_preventivo:    ['eje_gestion_transparencia', 'eje_disciplinario', 'eje_administrativo_cpaca'],
  contador:              ['eje_financiero_contable', 'eje_gestion_transparencia'],
  ingeniero_sistemas:    ['eje_sistemas_tecnologia', 'eje_gestion_transparencia'],
  medico_forense:        ['eje_forense_criminalistica'],
  ingeniero_civil:       ['eje_infraestructura_obras', 'eje_gestion_transparencia'],
  administrador_publico: ['eje_gestion_transparencia', 'eje_financiero_contable'],
};
```

### 5.3 Competencias Comportamentales (20% — clasificatorio)

```typescript
const COMPETENCIAS = [
  // Transversales (6 competencias × 7 ítems)
  { nombre: 'Aprendizaje continuo',               nivel: 'transversal',       num_items: 7 },
  { nombre: 'Orientación a resultados',           nivel: 'transversal',       num_items: 7 },
  { nombre: 'Orientación al ciudadano',           nivel: 'transversal',       num_items: 7 },
  { nombre: 'Compromiso con la organización',     nivel: 'transversal',       num_items: 7 },
  { nombre: 'Trabajo en equipo',                  nivel: 'transversal',       num_items: 7 },
  { nombre: 'Adaptación al cambio',               nivel: 'transversal',       num_items: 7 },
  // Directivo / Asesor
  { nombre: 'Liderazgo',                          nivel: 'directivo_asesor',  num_items: 7 },
  { nombre: 'Toma de decisiones',                 nivel: 'directivo_asesor',  num_items: 7 },
  { nombre: 'Pensamiento estratégico',            nivel: 'directivo_asesor',  num_items: 7 },
  { nombre: 'Impacto e influencia',               nivel: 'directivo_asesor',  num_items: 7 },
  { nombre: 'Dirección y desarrollo de personal', nivel: 'directivo_asesor',  num_items: 7 },
  // Profesional
  { nombre: 'Pensamiento conceptual',             nivel: 'profesional',       num_items: 7 },
  { nombre: 'Investigación y análisis',           nivel: 'profesional',       num_items: 7 },
  { nombre: 'Creatividad e innovación',           nivel: 'profesional',       num_items: 7 },
  { nombre: 'Aporte técnico-profesional',         nivel: 'profesional',       num_items: 7 },
  { nombre: 'Comunicación efectiva',              nivel: 'profesional',       num_items: 7 },
  // Técnico / Administrativo / Operativo
  { nombre: 'Organización del trabajo',           nivel: 'tecnico_admin',     num_items: 7 },
  { nombre: 'Confiabilidad técnica',              nivel: 'tecnico_admin',     num_items: 7 },
  { nombre: 'Responsabilidad',                    nivel: 'tecnico_admin',     num_items: 7 },
  { nombre: 'Cumplimiento de parámetros',         nivel: 'tecnico_admin',     num_items: 7 },
];
// Escala: 31–35 Sobresaliente | 25–30 Buen nivel | 18–24 Requiere desarrollo | <18 Brecha crítica
```

---

## 6. Motor de Preguntas — Metodología Oficial

```typescript
type TipoPregunta = 'tipo_I' | 'tipo_II' | 'tipo_III';

interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  modulo: ClaveComunModulo | EjeEspecifico;
  tema: string;
  enunciado: string;
  opciones: OpcionRespuesta[];
  respuesta_correcta: string | string[];
  explicacion: string;
  norma_relacionada: string;   // OBLIGATORIO — "Art. 34 Ley 1952/2019"
  dificultad: 1 | 2 | 3;
}

// TIPO I   Enunciado + 4 opciones (A/B/C/D). Una correcta.
// TIPO II  Enunciado + 4 afirmaciones (1,2,3,4). Respuestas: A) 1y2 B) 1y3 C) 2y4 D) 1,2y3
// TIPO III Afirmación PORQUE Razón:
//   A) A verdadera, R verdadera, R explica A
//   B) A verdadera, R verdadera, R NO explica A
//   C) A verdadera, R falsa
//   D) A falsa,     R verdadera
//   E) A falsa,     R falsa

// Comportamental — Likert:
// likert_acuerdo      1–5 (Totalmente en desacuerdo → Totalmente de acuerdo)
// likert_frecuencia   1–5 (Nunca → Siempre)
// enfrentamiento      3 puntos repartidos entre 2 conductas (3-0, 2-1, 1-2, 0-3)
//                     Sección A (+) suma directa | Sección B (−) inversión
```

---

## 7. Modelo de Datos (Supabase)

```typescript
// Pre-pago — captura ligera
interface Lead {
  id: string;
  nombre: string;
  email: string;
  cargo_aspira: string;
  profesion: string;
  fuente: 'landing' | 'remarketing' | 'referido';
  created_at: string;
  diagnostico_id?: string;
  convertido: boolean;        // true cuando paga
}

// Post-pago — usuario autenticado
interface Usuario {
  id: string;                 // auth.users.id
  lead_id?: string;
  profesion: string;
  opec_seleccionada: string;
  nivel_cargo: NivelJerarquico;
  ejes_asignados: EjeEspecifico[];
  cv_resumen?: ResumenHojaVida;
  linea_base_diagnostico_id: string;
  plan_estudio_id?: string;
}

interface ResumenHojaVida {
  titulo_pregrado: string;
  titulo_posgrado?: 'especializacion' | 'maestria' | 'doctorado' | 'posdoctorado';
  anios_experiencia_relacionada: number;
  experiencia_es_relacionada: boolean;
}

interface DiagnosticoUsuario {
  id: string;
  user_id?: string;           // null si aún es lead
  lead_id?: string;
  ultima_actualizacion: string;
  modulos: DiagnosticoModulo[];
  indice_preparacion: number; // 0–100
  modulo_mas_fuerte: string;
  modulo_mas_debil: string;
  temas_prioritarios_hoy: string[];
}

interface DiagnosticoModulo {
  modulo_clave: string;
  etiqueta: string;
  puntaje_dominio: number;
  tendencia: 'mejorando' | 'estable' | 'decayendo';
  tasa_acierto: number;
  temas_debiles: TemaDebil[];
  temas_fuertes: string[];
  rendimiento_por_tipo: { tipo_I: number; tipo_II: number; tipo_III: number };
}

interface TemaDebil {
  tema: string;
  tasa_error: number;
  repaso_pendiente: boolean;
  veces_fallado: number;
  norma_relacionada?: string;
}

interface Curso {
  id: string;
  slug: string;               // único en v1: 'pgn-2026'
  titulo: string;
  activo: boolean;
}

interface PlanEstudio {
  id: string;
  user_id: string;
  modulos: ModuloPlanificado[];
  horas_totales_estimadas: number;
  meta_diaria_minutos: number;
}
```

**Tablas Supabase iniciales:** `leads`, `usuarios`, `diagnosticos`, `diagnostico_modulos`, `temas_debiles`, `cursos`, `planes_estudio`, `respuestas_preguntas`, `eventos_remarketing`.

---

## 8. Sistema de Diseño — Referencia Local

**Directiva estricta:** el diseño NO se inventa. Origen de verdad: `D:\pc2025\Meritopro V2\Guia de estilos UI web`. Toma mockups HTML/imagen y tradúcelos a React + Tailwind preservando proporciones, colores, jerarquía.

Tokens orientativos (ajustar a los mockups si difieren):

| Rol | Token | Uso |
|---|---|---|
| Fondo | `bg-white` / `slate-50` | Páginas y tarjetas |
| Texto | `slate-900` / `slate-500` | Principal / secundario |
| Acción primaria | `yellow-400` | CTAs, progreso |
| Tutor / IA | `indigo-600` | Chat, Orquestador |
| Dominio alto ≥70% | `emerald-500` | Fortalezas |
| Dominio medio 50–69% | `amber-400` | En desarrollo |
| Brecha <50% | `rose-500` | Alertas |

**Navegación interna post-pago (5 destinos, no submenús):** Sidebar desktop · barra inferior móvil.
`Inicio` · `Mi Diagnóstico` · `Módulos de Estudio` · `Tutor Virtual` · `Mi Perfil`.

---

## 9. Módulos de Estudio

- **Banco de Preguntas** — Tipos I/II/III con retroalimentación normativa obligatoria.
- **Consultor Normativo** — RAG inteligente sobre corpus legal PGN.
- **Simulador de Casos** — situaciones fácticas específicas del cargo.
- **Entrenamiento Comportamental** — Likert + enfrentamiento.
- **Calculadora de Antecedentes** — resta requisitos mínimos, pondera residuo, sugiere upgrades.

---

## 10. Roadmap de Desarrollo

Sigue este orden estrictamente.

- [x] **Paso 0** — Bootstrap Next.js 14 + TS + Tailwind + GitHub. Commit `13e19d6`, rama `main`.
- [ ] **Paso 1** — Schema Supabase: tablas `leads`, `usuarios`, `diagnosticos`, `cursos`.
- [ ] **Paso 2** — Landing Page + formulario Captura de Datos (Lead Gen).
- [ ] **Paso 3** — Motor del Diagnóstico Gratuito (UI según mockups locales).
- [ ] **Paso 4** — Pantalla de Resultados + Pitch ROI + Paywall.
- [ ] **Paso 5** — Supabase Auth (Magic Link) + vinculación diagnóstico como Línea Base.
- [ ] **Paso 6** — Layout Dashboard interno (Sidebar + Nav) según mockups.
- [ ] **Paso 7** — Configurar Orquestador (endpoints Claude Opus/Sonnet con perfil cacheado).
- [ ] **Paso 8** — Gimnasio Mental ajustado dinámicamente (SM-2).
- [ ] **Paso 9** — Integración Omnicanal: Resend, Twilio, Telegram.
- [ ] **Paso 10** — Remarketing: cron jobs que leen `leads` no convertidos y disparan correos.
- [ ] **Paso 11** — QA, pruebas de carga RAG, despliegue PWA.

---

## 11. Reglas de Ingeniería (Hard Constraints)

<constraints>
1. **Tipado estricto.** Prohibido `any`. Interfaces explícitas.
2. **Separación pre/post-pago.** Diagnóstico sin login pesado — solo email/nombre en `leads`. Auth real (Magic Link) post-pago.
3. **Contexto del Orquestador.** Cada llamada a Claude incluye JSON `DiagnosticoUsuario` completo para que la IA actúe como tutor conocido.
4. **Normativa obligatoria.** Toda `Pregunta` requiere `norma_relacionada` con artículo + ley + año.
5. **Lectura local antes de maquetar.** Lee `Guia de estilos UI web` antes de escribir componentes visuales. Sin invención de diseño.
6. **Prompt caching.** System prompts del Orquestador con caché Anthropic activo. Cache hit ratio >80%.
7. **UX institucional.** Lenguaje formal, un solo CTA primario por pantalla, cero ruido. Min-width 375px.
8. **Estado global.** `DiagnosticoUsuario` cargado en layout raíz (Context/Hook) post-pago.
9. **Git.** Rama `main`, commits atómicos por paso, mensajes `feat(pasoN): ...` o `chore: ...`.
</constraints>

---

## 12. Arquitectura de Archivos

```
/meritopro
├── /app
│   ├── /(marketing)/page.tsx          → Landing pública
│   ├── /diagnostico/                  → Flujo pre-pago (lead + test + resultados)
│   ├── /checkout/                     → Paywall
│   ├── /dashboard/                    → Post-pago autenticado
│   │   ├── page.tsx
│   │   ├── /diagnostico/page.tsx
│   │   ├── /modulos/...
│   │   ├── /tutor/page.tsx
│   │   └── /perfil/page.tsx
│   └── /api
│       ├── /leads/route.ts
│       ├── /diagnostico/...
│       ├── /orquestador/route.ts      → endpoint Claude
│       └── /cron/remarketing/route.ts
├── /components
│   ├── /ui                            → Elementos base (mockups locales)
│   └── /features                      → Lógica de negocio
├── /lib
│   ├── /supabase
│   ├── /ia                            → Orquestador, prompts, tools
│   └── /omnichannel                   → Resend, Twilio, Telegram
└── /types
```

---

## 13. Estrategia de Monetización

**Pago único. Sin plan gratuito permanente. Sin suscripción.**
- Diagnóstico gratuito (Lead Magnet) — único acceso sin pago.
- Pantalla resultados: brecha + ROI (primer salario del cargo cubre inversión).
- Checkout: **COP $197.000** — acceso ilimitado hasta fecha del concurso.
- No pagados → flujo de remarketing (cron).

---

**Fin de CLAUDE.md v5.0**
