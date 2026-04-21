# **Prompts de Desarrollo Estructurado \- MéritoPro V3**

**INSTRUCCIÓN DE USO PARA EL HUMANO:** Copia y pega cada bloque **uno por uno** en tu IA de desarrollo (Cursor/Claude). NO le des la Fase 2 sin haber terminado y probado la Fase 1\. Inicia cada chat subiendo primero el archivo CLAUDE.md.

## **PROMPT FASE 1: Setup DB y Auth**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 1\.

OBJETIVO: Setup Supabase, Auth y Tablas Base.

REGLAS: Cero Magic Links. Solo Google OAuth y Email/Pass.

ACCIONES:

1. Crea script SQL para tabla leads: id (uuid), nombre (text), email (text), celular (text), cargo\_aspira (text), convertido (bool, default false).  
2. Crea script SQL para tabla users (extiende auth.users): id (uuid, FK), lead\_id (uuid, FK), probabilidad\_aprobar\_actual (float, default 0).  
3. Configura RLS (Row Level Security): leads \= inserción anónima permitida. users \= solo usuario autenticado lee/edita su propio ID.  
4. Crea lib/supabase/client.ts y lib/supabase/server.ts usando @supabase/ssr para Next.js 14 App Router.  
   Muestra el código SQL y los archivos de conexión TS. Cero explicaciones largas, solo código."

## **PROMPT FASE 2: Diagnóstico Gratuito (Lead Gen)**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 2\.

OBJETIVO: Landing, Captura y Test UI.

ACCIONES:

1. Crea app/(marketing)/page.tsx. UI Tailwind limpia, institucional. Hero \+ Formulario.  
2. Formulario: Nombre, Email, Celular, Cargo. Validar con Zod.  
3. Al hacer submit: Server Action crearLead \-\> INSERT a tabla leads en Supabase \-\> Redirect a /diagnostico/\[lead\_id\].  
4. Crea app/diagnostico/\[lead\_id\]/page.tsx. UI del Test (Cuestionario vacío por ahora). Barra de progreso superior 0/40.  
5. Crea endpoint dummy app/api/orquestador/route.ts que devuelva 1 pregunta estática para probar UI.  
   DISEÑO: Usa colores Tailwind: bg-slate-50, texto slate-900, CTA yellow-400. Cero animaciones pesadas. Escribe el código."

## **PROMPT FASE 3: Motor UI de Preguntas (Oficial PGN)**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 3\.

OBJETIVO: Componentes React estrictos para Tipos I, II, III y Likert.

REGLAS: Usa exactamente las interfaces TypeScript de CLAUDE.md Sección 5\. Prohibido usar any.

ACCIONES:

1. Crea components/features/preguntas/TipoUno.tsx. Props: PreguntaTipoI. Renderiza enunciado y 4 botones (A,B,C,D).  
2. Crea components/features/preguntas/TipoDos.tsx. Props: PreguntaTipoII. Renderiza enunciado, 4 afirmaciones numeradas (1,2,3,4) en recuadro gris, y 4 botones de combinación.  
3. Crea components/features/preguntas/TipoTres.tsx. Props: PreguntaTipoIII. Renderiza \[Afirmación\] PORQUE \[Razón\]. Renderiza 5 opciones de la A a la E con el texto oficial.  
4. Crea components/features/preguntas/LikertComportamental.tsx. Props: PreguntaComportamental. Renderiza botones del 1 al 5\.  
   ESTADO: Componentes puros, reciben onAnswer(id) prop. Muestra código completo."

## **PROMPT FASE 4: Lógica SM-2 (Base de Datos \+ Algoritmo)**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 4\.

OBJETIVO: Motor matemático Repetición Espaciada.

ACCIONES:

1. Crea SQL para tabla sm2\_repetition: id, user\_id (FK), pregunta\_id (texto/FK), repetition\_count (int), interval\_days (int), e\_factor (float), next\_review\_date (timestamp). RLS estricto.  
2. Crea lib/sm2/calcular.ts. Exporta función calculateSM2(calidad: number, eFactorPrevio: number, repeticionesPrevias: number, intervaloPrevio: number).  
3. REGLA SM2: Si calidad \>= 3, eFactor \= max(1.3, eFactorPrevio \+ 0.1 \- (5-calidad)\*(0.08 \+ (5-calidad)\*0.02)).  
4. Calcula nuevo intervalo según repeticiones. Devuelve nuevo objeto. Tipado estricto TS.  
   Muestra script SQL y la función TS de cálculo."

## **PROMPT FASE 5: Dashboard y Bucle Diario**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 5\.

OBJETIVO: UI Dashboard y Runner de Sesión.

ACCIONES:

1. Crea app/dashboard/layout.tsx. Sidebar con perfil, Nav bottom en móvil.  
2. Crea app/dashboard/page.tsx. UI central: Muestra probabilidad\_aprobar\_actual del usuario. UN SOLO BOTÓN GIGANTE: 'Entrenar Hoy'.  
3. Crea Server Action iniciarSesionDiaria: Fetch Supabase sm2\_repetition donde next\_review\_date \<= NOW() AND user\_id \= auth.uid(). LIMIT 15\.  
4. Crea app/dashboard/entrenar/page.tsx. UI "Tinder swipe" (botones rápidos). Al responder, llama Server Action registrarRespuestaSM2 que actualice la BD.  
5. Al fallar pregunta: Muestra modal bloqueante con explicacion y norma\_relacionada. Cero avance hasta cerrar modal.  
   Escribe Server Actions y UI."

## **PROMPT FASE 6: Webhook Telegram (Agente 2\)**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 6\.

OBJETIVO: Agente Motivador Telegram.

REGLAS: Usa librería telegraf.

ACCIONES:

1. Crea app/api/webhooks/telegram/route.ts. Configura export POST.  
2. Lógica: Recibe mensaje Telegram \-\> Extrae telegram\_chat\_id \-\> Fetch user\_id en Supabase.  
3. Si usuario existe, manda el texto del usuario a Claude 3.5 Sonnet (@anthropic-ai/sdk) junto con su última pregunta SM-2 fallada.  
4. System prompt Claude: 'Evalúa la respuesta del usuario a la pregunta X. Sé estricto. Responde corto'.  
5. Envía respuesta de vuelta por Telegram. Muestra código del Webhook completo."

## **PROMPT FASE 7: Cron Jobs Vercel (Agente 3 Remarketing)**

**Input a la IA:**

"Lee CLAUDE.md. Ejecuta Fase 7\.

OBJETIVO: Remarketing autónomo por Email.

REGLAS: Protege endpoint con process.env.CRON\_SECRET. Usa resend.

ACCIONES:

1. Crea app/api/cron/remarketing/route.ts. GET request.  
2. Verifica cabecera Bearer igual a CRON\_SECRET. Si falla, 401\.  
3. Fetch tabla leads donde convertido \= false. LIMIT 50\.  
4. Por cada lead: Pasa sus datos (nombre, debilidad del diagnóstico) a Claude.  
5. System prompt Claude: 'Redacta un email de remarketing persuasivo, aversión pérdida. Máximo 100 palabras. JSON {asunto, body}'.  
6. Envía con Resend API. Actualiza leads agregando 'remarketing\_enviado\_hoy \= true'.  
   Escribe el código del cron y la integración Resend/Claude."