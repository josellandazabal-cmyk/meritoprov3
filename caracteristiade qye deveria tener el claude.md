# **MéritoPro — Developer Agent Brain (CLAUDE.md)**

**Versión:** 6.1 | **Última iteración:** \[Fecha Actual\] — Arquitectura Cognitiva V3 & Metodología Oficial Obligatoria

**Concurso objetivo:** Procuraduría General de la Nación — Convocatoria 2026 (Res. 76/2026)

**Operador oficial:** Universidad de Antioquia

\<system\_directives\>

Lee este documento al iniciar cada sesión. Eres el Arquitecto Principal y Lead Developer de MéritoPro.

Tu objetivo es programar una plataforma EdTech **Event-Driven** de alto rendimiento, diseñada para sprints de estudio de 1-2 meses bajo presión.

**Stack Técnico:** Next.js 14 (App Router) \+ TypeScript \+ Tailwind \+ Supabase (Auth/DB/pgvector) \+ Claude 3.5 Sonnet API \+ Resend (Email) \+ Telegraf (Telegram).

**REGLA CRÍTICA DE PRODUCTO:** No programes "cursos" o "módulos de lectura". Todo el aprendizaje se da a través de **Recuperación Activa (Active Recall)** y **Repetición Espaciada (Spaced Repetition)**. El estudio pasivo está prohibido en esta arquitectura.

**REGLA DE DISEÑO:** Antes de crear cualquier UI, revisa mockups locales. Adapta tu código Tailwind a un tono institucional, formal y adulto. Cero ruido decorativo. Gamificación enfocada en maestría, no en insignias infantiles.

\</system\_directives\>

## **1\. Misión y Metodología Core**

Eres el **Senior Full-Stack Engineer & UX Architect**. Tu misión es transformar la investigación en neurociencia cognitiva en funcionalidades de software (UX/UI).

**Pilares del Producto (Programables):**

1. **Recuperación Activa:** El usuario no lee PDFs. Resuelve problemas generados dinámicamente. La teoría solo aparece si falla.  
2. **Repetición Espaciada (SM-2):** El sistema (Backend) decide qué estudia el usuario basado en su curva del olvido.  
3. **Práctica Intercalada (Interleaving):** Mezclamos preguntas de diferentes temas en la misma sesión para forzar la agilidad mental.  
4. **Gamificación de Maestría:** La métrica principal no son puntos, es el **"Porcentaje de Probabilidad de Aprobar"**.

## **2\. Ecosistema Multi-Agente (El Cerebro IA)**

El backend inteligente se divide en **3 Agentes Autónomos** orquestados vía Claude 3.5 Sonnet.

### **Agente 1: El Tutor (Orquestador Cognitivo)**

* **Ubicación:** app/api/orquestador/route.ts (Responde a las interacciones in-app).  
* **Rol:** Genera las preguntas del diagnóstico inicial (40 preguntas), califica y actúa como tutor normativo.  
* **Técnica:** RAG con pgvector. Si el usuario falla, este agente consulta el corpus legal y explica el error citando la norma exacta (Ej. "Ley 1952/2019, Art 34").

### **Agente 2: El Motivador (Repaso Espaciado Extramuros)**

* **Ubicación:** app/api/cron/repaso/route.ts (Llamado por Vercel Cron).  
* **Canales:** Telegram \+ Resend (Email).  
* **Rol:** Enviar píldoras de Recuperación Activa basadas en el SM-2 del usuario directamente a su celular.

### **Agente 3: El Persuasor (Remarketing y Ventas)**

* **Ubicación:** app/api/cron/remarketing/route.ts (Llamado por Vercel Cron).  
* **Canales:** Resend (Email).  
* **Rol:** Lee leads no convertidos y redacta copys persuasivos usando los datos de su debilidad específica para generar aversión a la pérdida.

## **3\. Embudo de Adquisición y Auth (Optimizado)**

Flujo de extrema fricción reducida pre-pago, y Auth robusto post-pago. **Prohibido usar Magic Links.**

\[Landing Pública\]  
  ├─ "Iniciar Sesión"                → (OAuth Google / Email+Pass)  
  └─ "Diagnóstico Gratuito"          → Lead Magnet  
        ↓  
\[Captura de Datos \- Lead Gen\]  
  Campos: Nombre · Correo · Celular · Cargo al que aspira  
        ↓  
\[Diagnóstico \- 40 Preguntas, 30 min\]  
  12 Común \+ 20 Específico \+ 8 Comportamental. Generadas por Agente 1\.  
        ↓  
\[Resultados \+ Pitch\]  
  Muestra "Probabilidad de Aprobar". Pitch ROI del salario PGN.  
        ↓  
\[Paywall \- $197.000 COP\]  
        ↓  
\[Auth \+ Checkout\]   
  Modal de Login Clásico (Supabase Auth). Se vincula \`lead\_id\` con \`user\_id\`.  
        ↓  
\[Dashboard: El Bucle Diario\]

## **4\. El Bucle Diario (Core App Experience)**

**La Misión Diaria ("Entrenar Hoy"):**

1. Un botón principal gigante que dispara la sesión del día (30-45 min).  
2. **Lógica SM-2:** Consulta en la DB las preguntas con next\_review\_date \<= hoy.  
3. **Interleaving:** El Agente 1 inyecta 5 preguntas nuevas de temas mixtos.  
4. **Validación Inmediata:** UX tipo "Tinder" (Swipe o Botones rápidos).  
5. **Recompensa:** La barra de "Probabilidad de Aprobar" sube en tiempo real.

## **5\. Motor de Preguntas (Metodología Oficial Obligatoria)**

**ESTA ES LA REGLA DE ORO DEL PRODUCTO:** El usuario DEBE enfrentarse a la misma estructura lógica que verá el día del examen. El Agente 1 (Tutor) SOLO puede generar preguntas bajo estas 4 interfaces estrictas de TypeScript:

type TipoPregunta \= 'tipo\_I' | 'tipo\_II' | 'tipo\_III' | 'comportamental';

// REGLAS ESTRUCTURALES ESTRICTAS PARA LA IA Y LA UI:

// 1\. TIPO I (Selección múltiple con única respuesta)  
// Formato: Enunciado directo o caso práctico \+ 4 opciones (A, B, C, D).  
interface PreguntaTipoI {  
  tipo: 'tipo\_I';  
  enunciado: string;  
  opciones: { id: 'A'|'B'|'C'|'D', texto: string }\[\];  
  correcta\_id: 'A'|'B'|'C'|'D';  
}

// 2\. TIPO II (Preguntas de selección múltiple con múltiple respuesta)  
// Formato: Enunciado \+ 4 afirmaciones numeradas (1, 2, 3, 4).  
// Las opciones de respuesta SIEMPRE deben ser combinaciones estáticas.  
interface PreguntaTipoII {  
  tipo: 'tipo\_II';  
  enunciado: string;  
  afirmaciones: { id: 1|2|3|4, texto: string }\[\];  
  opciones: \[  
    { id: 'A', texto: 'Si 1 y 2 son correctas' },  
    { id: 'B', texto: 'Si 1 y 3 son correctas' },  
    { id: 'C', texto: 'Si 2 y 4 son correctas' },  
    { id: 'D', texto: 'Si 1, 2 y 3 son correctas' }  
  \];  
  correcta\_id: 'A'|'B'|'C'|'D';  
}

// 3\. TIPO III (Análisis de Relación \- Afirmación PORQUE Razón)  
// Formato: Consta de dos proposiciones: una Afirmación y una Razón, unidas por la palabra PORQUE.  
interface PreguntaTipoIII {  
  tipo: 'tipo\_III';  
  afirmacion: string;  
  razon: string;  
  opciones: \[  
    { id: 'A', texto: 'Afirmación es VERDADERA, Razón es VERDADERA y Razón EXPLICA la Afirmación.' },  
    { id: 'B', texto: 'Afirmación es VERDADERA, Razón es VERDADERA pero Razón NO explica la Afirmación.' },  
    { id: 'C', texto: 'Afirmación es VERDADERA, Razón es FALSA.' },  
    { id: 'D', texto: 'Afirmación es FALSA, Razón es VERDADERA.' },  
    { id: 'E', texto: 'Afirmación es FALSA, Razón es FALSA.' }  
  \];  
  correcta\_id: 'A'|'B'|'C'|'D'|'E';  
}

// 4\. COMPORTAMENTAL (Escala Likert o Juicio Situacional)  
// Evalúa rasgos de personalidad laboral, no conocimientos técnicos. No hay respuestas "malas", hay respuestas con diferente puntaje de ajuste al perfil.  
interface PreguntaComportamental {  
  tipo: 'comportamental';  
  enunciado\_situacional: string;  
  competencia\_evaluada: 'Liderazgo' | 'Trabajo en equipo' | 'Toma de decisiones' | 'Orientación al ciudadano';  
  escala: 'frecuencia' | 'acuerdo'; // Frecuencia (Nunca a Siempre) o Acuerdo (Totalmente en desacuerdo a Totalmente de acuerdo)  
  // La UI debe renderizar botones del 1 al 5\.  
}

// Interfaz global que debe devolver el Agente 1:  
interface PreguntaGenerada {  
  id: string;  
  modulo: string; // ej: 'eje\_disciplinario'  
  tema: string;  
  estructura: PreguntaTipoI | PreguntaTipoII | PreguntaTipoIII | PreguntaComportamental;  
  explicacion: string;  
  norma\_relacionada: string; // OBLIGATORIO: Ej "Ley 1952 de 2019, Art. 38"  
}

## **6\. Modelo de Datos (Supabase PostgreSQL)**

Estructuras clave para soportar la metodología cognitiva y los agentes:

// Pre-pago — captura ligera  
interface Lead {  
  id: string;  
  nombre: string;  
  email: string;  
  celular: string; // Fundamental para remarketing/matching  
  cargo\_aspira: string;  
  fuente: string;  
  diagnostico\_id?: string;  
  convertido: boolean;  
}

// Post-pago — usuario autenticado (Auth via Google/Pass)  
interface Usuario {  
  id: string; // auth.users.id  
  lead\_id: string;  
  telegram\_chat\_id?: string; // Para el Agente 2  
  fecha\_examen: string;  
  probabilidad\_aprobar\_actual: number; // Gamificación  
}

// EL MOTOR COGNITIVO (Spaced Repetition)  
interface SM2Repetition {  
  id: string;  
  user\_id: string;  
  pregunta\_id: string;  
  repetition\_count: number;  
  interval\_days: number;  
  e\_factor: number;      // Dificultad (1.3 a 2.5)  
  next\_review\_date: string; // Clave para el Bucle Diario  
  tema\_relacionado: string;  
}

## **7\. Contexto Oficial del Concurso PGN 2026 (Para Inyectar a Claude)**

* **Vacantes:** 2.826. **Operador:** UdeA. **Puntaje mínimo:** 65/100.  
* **Núcleo Común (30%):** Ofimática, Aptitud Verbal, Estructura del Estado, Gestión Documental, Atención al Ciudadano (MIPG, Ley 594, Const. Política).  
* **Núcleo Específico (70%):** Disciplinario, Constitucional, Administrativo, Financiero, Sistemas, Forense (varía por cargo).  
* **Comportamentales (20%):** Evaluado vía escala Likert. Liderazgo, toma de decisiones, trabajo en equipo, etc.

## **8\. Arquitectura de Archivos y Routing**

/meritopro  
├── /app  
│   ├── /(marketing)/page.tsx          → Landing pública  
│   ├── /diagnostico/                  → Flujo pre-pago (lead \+ test \+ resultados)  
│   ├── /checkout/                     → Paywall y Auth (Google/Pass)  
│   ├── /dashboard/                    → Post-pago autenticado  
│   │   ├── page.tsx                   → EL BUCLE DIARIO ("Entrenar Hoy")  
│   │   ├── /simulacro/page.tsx        → Modo fin de semana  
│   │   └── /perfil/page.tsx  
│   └── /api  
│       ├── /orquestador/route.ts      → Agente 1 (Tutor In-App)  
│       ├── /cron/repaso/route.ts      → Agente 2 (Motivador Telegram/Email)  
│       ├── /cron/remarketing/route.ts → Agente 3 (Persuasor Email)  
│       └── /webhooks/telegram/route.ts→ Inbound para respuestas del Agente 2  
├── /lib  
│   ├── /supabase  
│   ├── /ia                            → Prompts de los 3 agentes, tools, RAG pgvector  
│   ├── /sm2                           → Algoritmo Spaced Repetition matemático  
│   └── /omnichannel                   → Configuración de Resend y Telegraf

## **9\. Roadmap de Desarrollo (Orden Estricto)**

* \[ \] **Fase 1:** Setup Supabase (Auth Google/Pass) \+ Tablas Base (leads, users).  
* \[ \] **Fase 2:** Flujo de Diagnóstico Gratuito (Formulario Lead \-\> Test UI \-\> API Agente 1).  
* \[ \] **Fase 3:** Implementación de UI para preguntas Tipo I, II, III y Likert.  
* \[ \] **Fase 4:** Motor SM-2 (Base de datos sm2\_repetition \+ Funciones de cálculo).  
* \[ \] **Fase 5:** Bucle Diario Dashboard (UI de "Entrenar Hoy" \+ mezcla de preguntas).  
* \[ \] **Fase 6:** Configurar Webhook de Telegram (telegraf) y conectarlo al Agente 2\.  
* \[ \] **Fase 7:** Cron Jobs de Vercel para Remarketing (Agente 3\) y Repaso Diario.

**Fin del Documento Maestro V3**