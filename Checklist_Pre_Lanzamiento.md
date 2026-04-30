# Checklist pre-lanzamiento — MéritoPro Beta v0.1

**Fecha de la revisión:** Abril 2026
**Objetivo:** identificar todos los pendientes para publicar la beta sin sorpresas.

Convención de prioridad:

| Nivel | Definición |
|---|---|
| **P0** | Bloquea el lanzamiento. No salimos sin esto. |
| **P1** | Necesario en la primera semana (afecta KPIs, no funcionamiento básico). |
| **P2** | Mejora la operación pero no detiene la beta. |

---

## 1. Configuración técnica (P0 — bloquean)

| # | Item | Estado | Acción |
|---|---|---|---|
| 1.1 | `TAVILY_API_KEY` real en `.env.local` y producción | ❌ placeholder | Obtener key en tavily.com (plan free 1.000 req/mes alcanza para beta). |
| 1.2 | `TELEGRAM_BOT_TOKEN` real | ❌ pendiente | Crear bot con `@BotFather` en Telegram, copiar token al `.env.local`. |
| 1.3 | Supabase Auth → URL Configuration | ⚠️ revisar | Site URL + Redirect URLs (`/login/restablecer`, `/dashboard`) configurados en el dashboard de Supabase. |
| 1.4 | Migraciones SQL aplicadas en producción | ✅ confirmado | `0000_foundation_v3.sql`, `0001_corpus_legal_voyage.sql`, `0002_leads_anon_read.sql`. |
| 1.5 | Corpus ingestado (≥ 3.000 chunks) | ✅ confirmado | 3.338 chunks. |
| 1.6 | Pasarela de pago (Wompi o Bold) | ❌ no wired | Crear cuenta merchant, obtener public key + integration key, configurar webhook. |
| 1.7 | Endpoint `/api/checkout/iniciar` | ❌ falta | Server action que crea la transacción Wompi/Bold y devuelve URL de pago. |
| 1.8 | Webhook `/api/checkout/webhook` para confirmar pagos | ❌ falta | Recibir notificación de Wompi, validar firma HMAC, marcar `usuarios.convertido = true` y activar plan. |
| 1.9 | Página post-pago (`/dashboard/bienvenida`) | ❌ falta | Confirmación + onboarding (configurar Telegram, elegir horario, primer pregunta de hoy). |
| 1.10 | Dominio registrado y SSL | ⚠️ confirmar | meritopro.co o similar; Vercel maneja SSL. |
| 1.11 | Email corporativo (soporte@dominio.co) | ⚠️ confirmar | Configurar en Google Workspace o Zoho. |

---

## 2. Producto core operativo (P0)

| # | Item | Estado | Acción |
|---|---|---|---|
| 2.1 | Diagnóstico de 40 preguntas funcional | ✅ | — |
| 2.2 | Bucle Diario funcional | ✅ | — |
| 2.3 | Auth (login, registro, recuperación) | ✅ | — |
| 2.4 | Dashboard con probabilidad_aprobar | ⚠️ MVP | Actualizar la métrica con cada respuesta real (hoy es estática inicial). |
| 2.5 | Persistencia de respuestas en `respuestas_preguntas` | ❌ verificar | Confirmar que las respuestas del simulacro y bucle se guardan. |
| 2.6 | Cronjob de Vercel para Telegram daily push | ❌ falta | `app/api/cron/bucle-diario` con `vercel.json` schedule (07:00 hora Colombia). |
| 2.7 | Templates de email en Resend (welcome + 7 secuencia) | ❌ falta | Diseñar 8 templates (welcome + days 0-7). |

---

## 3. Cumplimiento legal Colombia (P0)

| # | Item | Estado | Acción |
|---|---|---|---|
| 3.1 | Términos y Condiciones publicados (`/terminos`) | ❌ falta | Redactar (idealmente con abogado), publicar URL pública. |
| 3.2 | Política de Privacidad (Habeas Data Ley 1581/2012) | ❌ falta | Cláusula obligatoria por LOPD Colombia. |
| 3.3 | Política de cookies | ❌ falta | Banner de cookies si usamos Pixel + Google Analytics. |
| 3.4 | Aviso de tratamiento de datos en el formulario de captura | ❌ falta | Checkbox obligatorio "Acepto el tratamiento de mis datos". |
| 3.5 | Email de cancelación / derecho ARCO | ❌ falta | Mecanismo para que el usuario pida borrado de datos. |
| 3.6 | Cláusula de la Garantía 2 publicada | ⚠️ borrador | Convertir el §11.3 del Modelo de Pricing en página `/garantia`. |
| 3.7 | RUT + facturación electrónica (DIAN) | ⚠️ confirmar | Si se factura desde una S.A.S., verificar habilitación con la DIAN para factura electrónica. |
| 3.8 | Registro de tratamiento de datos en SIC | ⚠️ verificar | Obligatorio si la base de datos supera 100 mil registros (no aplica en beta, pendiente para escalado). |

---

## 4. Métricas y telemetría (P0/P1)

| # | Item | Prioridad | Estado | Acción |
|---|---|---|---|---|
| 4.1 | Pixel de Meta instalado | P0 | ❌ | Instalar pixel + CAPI server-side en `/api/lead` y `/api/checkout/webhook`. |
| 4.2 | Google Analytics 4 + Tag Manager | P0 | ❌ | Configurar GA4 con eventos del funnel (page_view, generate_lead, purchase). |
| 4.3 | UTMs en todos los anuncios | P0 | ❌ | Convención: `utm_source=meta&utm_campaign=beta&utm_content=carolina_aida_a`. |
| 4.4 | Dashboard de KPIs (visible para el equipo) | P1 | ❌ | Notion / Google Sheet / Vercel + Supabase materialized view. |
| 4.5 | Sentry para error tracking | P1 | ❌ | Integrar Sentry (free tier alcanza). |
| 4.6 | Vercel Analytics (Web Vitals) | P1 | ⚠️ | Activar en el dashboard de Vercel. |
| 4.7 | Log de top-1 sim del orquestador | P1 | ❌ | Loggear en cada `obtenerContextoRAG` para alertas de regresión RAG. |

---

## 5. Marketing — assets de lanzamiento (P0)

| # | Item | Estado | Acción |
|---|---|---|---|
| 5.1 | 3 UGC filmados (uno por persona) | ❌ falta | Filmar esta semana con guion del §16 del Plan de Marketing. |
| 5.2 | 3 landings dedicadas en Vercel | ❌ falta | Una por persona: `/lp/abogada`, `/lp/egresado`, `/lp/funcionaria`. Wireframe en §17. |
| 5.3 | 9 ads para Meta (3 personas × 3 fórmulas) | ⚠️ copy listo | Producir creativos visuales (Canva o similar). Copy ya está en §15 del Plan de Marketing. |
| 5.4 | Campaña Google Search configurada | ❌ falta | 4 keywords exact + landing dedicada. |
| 5.5 | LinkedIn Sponsored Content (Carolina) | ❌ falta | Diseñar pieza + InMail copy. |
| 5.6 | Cuenta TikTok activa con 3 videos | ❌ falta | Producir y subir antes del día 7. |
| 5.7 | Secuencia de 7 emails montada en Resend | ❌ falta | Templates HTML + lógica de disparo en cron. |
| 5.8 | Página `/garantia` pública | ❌ falta | Texto del §11.3 del Modelo de Pricing. |
| 5.9 | FAQ en la landing principal | ❌ falta | 8 preguntas (lista en §17 del Plan de Marketing). |
| 5.10 | Testimonios reales (idealmente cohorte 2024) | ⚠️ confirmar | Si no hay, producir con UGC primero. NO inventarlos. |

---

## 6. Operación y soporte (P1)

| # | Item | Estado | Acción |
|---|---|---|---|
| 6.1 | Email `soporte@meritopro.co` activo y monitoreado | ❌ | Configurar buzón + responsable. |
| 6.2 | Plan de soporte: 1 persona × 2 horas/día | ❌ | Asignar responsable interno. |
| 6.3 | Grupo privado de Telegram para paid users | ❌ | Crear grupo + reglas + bienvenida automática. |
| 6.4 | CRM básico (HubSpot Free / Notion) para leads | ❌ | Sincronizar leads automáticamente desde Supabase. |
| 6.5 | Bandeja de tickets (CSAT post-sesión) | ⚠️ | Tally / Typeform al finalizar sesión del bucle. |
| 6.6 | Onboarding interno del equipo (manual operativo) | ⚠️ | Notion con SOPs por rol. |

---

## 7. Producto / Backlog para sprint+1 (P2 — no bloquea beta)

| # | Item | Cuándo |
|---|---|---|
| 7.1 | Endpoint `POST /api/garantia/reclamo` con upload de citatorio | Post-examen primera cohorte |
| 7.2 | Tabla `codigos_garantia` + generador `MERITO50-XXXX` | Post-examen |
| 7.3 | Trigger SQL `sesiones_completadas` | Antes de fin de beta |
| 7.4 | Pantalla del Marketplace post-examen | Post-examen |
| 7.5 | Curación + ingesta del 2do concurso (Fiscalía 2026) | Mes 6 |
| 7.6 | Sistema de referidos con código personal | Semana 4 de beta |
| 7.7 | Dashboard interno de customer success | Mes 2 |
| 7.8 | A/B test de precio (COP 297K vs 347K) | Después de 50 conversiones |
| 7.9 | Hard test del RAG cableado en CI (GitHub Actions) | Cuando haya 1ra regresión |

---

## 8. Decisiones operativas pendientes (necesitas tomarlas tú)

1. **Presupuesto de pauta beta 4 semanas:** rango sugerido COP 12-18 M.
2. **Cohorte beta cerrada a X cupos:** recomendación 100 paid users para frame de escasez.
3. **Quién filma los UGC:** ¿con un creador colombiano o casting interno?
4. **Pasarela:** ¿Wompi (más popular) o Bold (mejor UX en móvil)?
5. **Dominio definitivo:** confirmar `meritopro.co` (o el que se vaya a usar).
6. **Logo + identidad visual final:** confirmar colores, tipografía, isotipo. La beta usa los placeholders actuales (slate-900 + amarillo facc15).

---

## 9. Camino crítico — orden recomendado para no atascar el lanzamiento

**Esta semana (semana -2 antes del lanzamiento):**

1. Conseguir `TAVILY_API_KEY` y `TELEGRAM_BOT_TOKEN`. Item 1.1, 1.2.
2. Decidir y crear cuenta de pasarela. Item 1.6.
3. Redactar y publicar Términos + Política de Privacidad. Items 3.1, 3.2.
4. Filmar los 3 UGC. Item 5.1.

**Próxima semana (semana -1):**

5. Implementar `/api/checkout/iniciar` + webhook + página post-pago. Items 1.7, 1.8, 1.9.
6. Cronjob de Telegram + templates de email. Items 2.6, 2.7.
7. 3 landings dedicadas. Item 5.2.
8. Pixel Meta + GA4 + UTMs. Items 4.1, 4.2, 4.3.

**Día -2 antes del lanzamiento:**

9. Configurar 9 ads en Meta + Search Google. Items 5.3, 5.4.
10. Smoke test full E2E (lead → diagnóstico → email → checkout → bucle diario).
11. Página `/garantia` + FAQ. Items 5.8, 5.9.

**Día 0 — go live:**

12. Activar pauta. Monitorear primer 24h en stand-up.

---

## 10. Resumen ejecutivo

**Bloqueos hoy mismo (P0 críticos):** 11 items técnicos + 8 legales + 10 de marketing = **29 acciones para llegar al lanzamiento**.

**Las 5 más urgentes (esta semana):**

1. ✋ Conseguir Tavily + Telegram tokens.
2. ✋ Wirear pasarela de pago + webhook.
3. ✋ Publicar Términos y Política de Privacidad (legal).
4. ✋ Filmar los 3 UGC.
5. ✋ Configurar Pixel Meta + GA4.

Si esas 5 están listas para la semana -1, todo lo demás se monta en paralelo. Sin esas 5, no hay lanzamiento.
