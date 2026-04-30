# Modelo de Pricing — MéritoPro · PGN 2026

**Modelo de negocio:** pago único por concurso (NO suscripción). Acceso desde compra hasta **30 días después del examen**. Después del examen, el perfil del usuario activa el **Marketplace de Concursos** con sugerencias personalizadas según currículum + perfil + historial SM-2 — con descuento para retornantes. Ese es nuestro mecanismo de LTV multi-concurso.

> **Pregunta a responder:** ¿cuál es el precio único que cubre infraestructura + escalado + marketing y deja margen para reinversión, sin matar la conversión?

---

## 1. Costos variables por usuario (durante todo el ciclo de un concurso)

Base: usuario activo durante **6 meses** en promedio (compra a 5-7 meses del examen + 1 mes post-examen). Tasa USD/COP: **4.000**.

### 1.1. APIs y servicios externos

| Servicio | Uso por usuario | Costo unitario | Total USD | Total COP |
|---|---|---|---|---|
| **Anthropic Claude (Haiku 4.5 + Sonnet 4.6 escalado)** | 40 dx + 10/día × 180 días = **1.840 preguntas** generadas (95 % desde caché LRU). Promedio efectivo: ~600 generaciones reales. | $0.005/Q (con prompt caching activo) | $3.00 | 12.000 |
| **Anthropic Claude (Agente Motivador Telegram + Persuasor email)** | ~250 evaluaciones de respuestas + ~30 emails generados | $0.003/llamada | $0.84 | 3.360 |
| **Voyage `voyage-3-large`** (embeddings) | ~1.000 queries × 50 tokens promedio = 50K tokens (mucho cacheable) | $0.18/M tokens | $0.02 | 80 |
| **Supabase Pro** (DB + Auth + Storage) | $25/mes ÷ 500 usuarios concurrentes × 6 meses | — | $0.30 | 1.200 |
| **Vercel Pro** (hosting + serverless + edge) | $20/mes ÷ 500 usuarios × 6 meses | — | $0.24 | 960 |
| **Tavily** (fallback web *.gov.co) | ~30 búsquedas (sólo cuando corpus falla) | $0.005/búsqueda | $0.15 | 600 |
| **Resend** (transaccional + secuencias email) | ~30 emails × $0.0007 | — | $0.02 | 80 |
| **Telegram Bot API** | Gratis | — | $0.00 | 0 |
| **Pasarela de pago** (Wompi/Bold Colombia) | 2.99 % + IVA + COP 700 fijo sobre el ticket | — | — | 10.500 |
| **Subtotal infra + APIs por usuario** | | | **$4.57** | **~28.780 COP** |

### 1.2. Costos variables operativos

| Concepto | Costo por usuario | COP |
|---|---|---|
| Soporte vía Telegram (1 hora/semana × 4 sem mes 1 / 0.5h/sem mes 2-6 + ticket promedio 5 min × 8 tickets × $4 USD/h) | | 8.000 |
| Procesamiento de reembolsos (esperado 5 % × COP 5.000 admin) | | 250 |
| **Subtotal operativo** | | **8.250** |

### 1.3. Total costo variable por usuario

**~COP 37.030** (≈ $9.30 USD)

Redondeo conservador: **COP 38.000** por usuario activo.

---

## 2. Costos fijos amortizables (mensuales)

| Concepto | Costo mensual COP |
|---|---|
| Vercel Pro Team | 80.000 |
| Supabase Pro | 100.000 |
| Anthropic min spend / Voyage | — (variable) |
| Dominio + email corporativo | 30.000 |
| Sentry / monitoreo (Free tier) | 0 |
| Notion/Linear (gestión) | 50.000 |
| Resend Pro | 80.000 |
| **Sub-total tooling** | **340.000** |
| **Personal beta** (1 dev part-time + 1 customer success part-time) | **5.000.000** |
| **Total fijo mensual** | **~5.340.000** |

Amortización por usuario según escala:
| Usuarios pagos / mes | Fijo amortizado / usuario |
|---|---|
| 50 | COP 106.800 |
| 100 | COP 53.400 |
| 250 | COP 21.360 |
| 500 | COP 10.680 |
| 1.000 | COP 5.340 |

Para los cálculos de pricing usamos el escenario realista de **mes 3-4 de operación**: 250 usuarios pagos/mes → **fijo amortizado COP 21.000/usuario**.

---

## 3. Costo de adquisición (CAC) — marketing real

Del Plan de Marketing (§3.5 del BETA_v0.1):

| Etapa del funnel | Conversión esperada |
|---|---|
| Inversión en pauta (Meta + Google + LinkedIn + TikTok orgánico) | COP 12-18 M / 4 sem |
| CPL (costo por lead que entra al diagnóstico) | COP 8.000 |
| % leads que completan el diagnóstico | 35-50 % |
| % completers que pasan al checkout | 30 % |
| % checkout → pago | 40 % |
| **Conversión global lead → pago** | **~4 %** |

CAC = CPL ÷ tasa de conversión = **COP 8.000 ÷ 0.04 = COP 200.000** (peor escenario primer mes).

Con optimización a la semana 3-4 (ya hay datos para entrenar Pixel + creativos ganadores identificados): CAC ≈ **COP 80.000** (objetivo del Plan).

**Para el modelo de pricing usamos CAC = COP 100.000** (promedio ponderado de 4 semanas de beta).

---

## 4. Costo total por usuario (todo incluido)

| Concepto | COP por usuario |
|---|---|
| Infraestructura variable (APIs + ops) | 38.000 |
| Fijos amortizados (a 250 us/mes) | 21.000 |
| Marketing (CAC) | 100.000 |
| **TOTAL costo por usuario adquirido** | **159.000** |

---

## 5. Proyección de escalado (3 escenarios)

| Escala | Usuarios pagos / mes | Costo total / usuario | Margen necesario para reinvertir |
|---|---|---|---|
| **Beta (mes 1-2)** | 50-100 | 220-260 K | ≥ 30 % |
| **Crecimiento (mes 3-6)** | 250-500 | 145-160 K | ≥ 50 % |
| **Escalado (mes 7-12)** | 500-1.500 | 110-130 K | ≥ 60 % |

Si en el **mes 3** estamos en COP 145 K de costo total por usuario y queremos margen del 50 % → precio mínimo viable: **COP 290.000**.
Si en el **mes 9** estamos en COP 110 K y queremos margen del 60 % → ese mismo precio deja margen 62 %.

Esto significa que el precio se sostiene desde beta hasta escalado: **lo que era margen apretado en mes 1 se convierte en margen sano en mes 6**.

---

## 6. Modelo de LTV con Marketplace de Concursos

El diferenciador clave: una vez el usuario termina el primer concurso, el perfil le sugiere el siguiente según su currículum y datos. Esto extiende el LTV sin nuevo CAC.

### 6.1. Mapeo cargo → siguiente concurso recomendado

| Perfil del usuario | Concursos sugeridos en el marketplace | Lógica |
|---|---|---|
| Abogado, hizo PGN | Fiscalía, Contraloría, Registraduría, Rama Judicial (jueces), ICBF jurídico | Mismo corpus disciplinario + adicional por entidad |
| Economista, hizo PGN | DIAN, Banco República, Superfinanciera, Min. Hacienda, DNP | Corpus financiero + económico |
| Ingeniero/sistemas, hizo PGN | MinTIC, FONTIC, ITER, Ecopetrol, ETB | Corpus técnico |
| Profesional administrativo | Función Pública, Distritales (Bogotá, Medellín, Cali), DAFP | Carrera administrativa generalista |

### 6.2. Tasas de retorno proyectadas

Datos de benchmark EdTech LATAM con cohortes "exam prep" (ConcursosBR, Aprueba!, Crehana Plus):

| Comportamiento | % de usuarios |
|---|---|
| Compra 1 sólo concurso | 60 % |
| Compra 2 concursos (uno seguido del otro) | 28 % |
| Compra 3+ concursos (carrera de oposiciones) | 12 % |

### 6.3. Estructura de descuentos en el marketplace

| Compra | Descuento aplicado | Precio efectivo (sobre COP 297 K) |
|---|---|---|
| 1ra | 0 % | 297.000 |
| 2da (mismo año, después del 1er examen) | 30 % | 207.900 ≈ **207.900** |
| 3ra | 30 % (capeado, no compuesto) | 207.900 |
| Referido por usuario activo (1ra compra) | 15 % al referido + 1 mes gratis al referidor | 252.450 |

### 6.4. LTV proyectado por usuario

| Cohorte | % usuarios | Compras totales | Ingreso COP |
|---|---|---|---|
| 60 % | 1 compra | 297.000 | 297.000 × 0.60 = 178.200 |
| 28 % | 2 compras | 297K + 207.9K = 504.900 | 504.900 × 0.28 = 141.372 |
| 12 % | 3 compras | 297K + 2 × 207.9K = 712.800 | 712.800 × 0.12 = 85.536 |
| **LTV ponderado** | | | **COP 405.108** |

### 6.5. LTV / CAC

LTV / CAC = **405.108 / 100.000 = 4.05×**

> **Saludable.** Benchmark SaaS-EdTech: LTV/CAC ≥ 3× para escalar. Estamos arriba del umbral.
> Payback period: **~6 meses** (CAC se recupera en la 1ra compra).

---

## 7. Validación del precio frente al mercado colombiano

| Tipo de competencia | Rango precio COP | Posicionamiento MéritoPro |
|---|---|---|
| Academias presenciales (Esap, Cidesco, etc.) | 1.500.000 - 3.000.000 | 5-10× más barato |
| Cursos online concursos (sin método) | 400.000 - 800.000 | 30-60 % más económico |
| **MéritoPro** | **297.000** | sweet spot |
| Cursos en Hotmart / Udemy | 80.000 - 200.000 | 1.5× nuestro precio (pero sin método ni IA) |
| PDFs en grupos de WhatsApp | 30.000 - 100.000 | 3-10× nuestro precio (pero estos no funcionan, 73 % repite) |

Posicionamiento: "premium accesible". Está por encima del nivel "PDF + grupos" para señalar valor, y muy por debajo de las academias para evitar fricción de precio.

---

## 8. Recomendación de precio único

### Precio definitivo de lanzamiento beta

> ## **COP 297.000** · pago único · acceso hasta 30 días post-examen

**Justificación cuantitativa:**

| Métrica | Valor | OK? |
|---|---|---|
| Costo total por usuario (mes 3) | COP 145.000 | — |
| Margen bruto a este precio | 51 % | ✅ ≥ 50 % objetivo |
| Margen bruto en escalado (mes 9) | 63 % | ✅ ≥ 60 % objetivo |
| LTV / CAC con marketplace | 4.05× | ✅ ≥ 3× saludable |
| Payback CAC | 1ra compra | ✅ inmediato |
| Posición en mercado | Premium accesible | ✅ |
| Fricción psicológica (umbral COP 300K) | Justo debajo | ✅ |
| Pago en cuotas (3 × 109K) | Soporta financiamiento | ✅ |

### Estructura de descuentos del marketplace

| Compra | Precio | Justificación |
|---|---|---|
| **1ra (cualquier concurso)** | COP 297.000 | Cubre CAC + margen sano. |
| **2da con descuento 30 %** | COP 207.900 | CAC = 0 (es retornante) → margen 71 %. |
| **Bundle 3 concursos en 18 meses** | COP 697.000 (vs 891 K sin desc) | Compromiso multi-concurso = predictibilidad de revenue. |
| **Referido (lo trae un activo)** | COP 252.450 (15 % off) | Premia adquisición orgánica. |

### Anclas de comunicación en la landing

| Lo que muestras | Lo que cobras |
|---|---|
| Valor declarado del paquete completo + bonus | COP 1.240.000 |
| "Precio regular post-beta" | COP 397.000 (anclar arriba) |
| **Precio beta de lanzamiento** | **COP 297.000** |
| Plan en cuotas (sin tarjeta de crédito → PSE/efectivo) | 3 × COP 109.000 |
| **Garantía** | Doble Garantía MéritoPro (ver §11 nuevo). |

### Prueba A/B opcional para semana 3 de beta

Una vez tengamos ≥ 50 conversiones a COP 297 K, probar:
- **Variante A:** COP 297.000 (control)
- **Variante B:** COP 347.000 con un bono adicional (Mapa OPEC del cargo)

Si CR de B ≥ 80 % de A → quedarse con B (precio sube COP 50 K, margen sube ~17 puntos).

---

## 9. Estructura del Marketplace (post-examen)

### 9.1. Pantalla "Tu siguiente concurso recomendado"

Aparece automáticamente en el dashboard 30 días después de la fecha del examen. Diseño tipo "Netflix de concursos" basado en datos del usuario.

```
┌─────────────────────────────────────────────────────┐
│  Hiciste la PGN 2026 y la diste todo. Ahora:        │
│                                                     │
│  Tu currículum dice: Abogado · 7 años exp           │
│  Tu mejor desempeño: Derecho Disciplinario (84 %)   │
│  Tu meta: Estabilidad permanente                    │
│                                                     │
│  [Recomendado para ti]                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🏛️ Concurso Fiscalía 2026                     │  │
│  │    Tu corpus disciplinario te da 60 %        │  │
│  │    de ventaja. 4-6 meses de preparación.     │  │
│  │    [-30 % por ser nuestro] COP 207.900        │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Otros que te encajan]                             │
│  • Contraloría 2026 · COP 207.900                   │
│  • Rama Judicial - Jueces · COP 207.900             │
│  • Registraduría 2026 · COP 207.900                 │
└─────────────────────────────────────────────────────┘
```

### 9.2. Datos que usamos para personalizar la sugerencia

- `cargo_aspira` original
- `profesion` y `nivel_educativo`
- Buckets SM-2 (`dominio_alto`, `dominio_medio`, `brechas`)
- `probabilidad_aprobar_actual` final
- Tiempo activo en la plataforma
- Resultado real del examen (autoreportado opcional)

### 9.3. Costo marginal de añadir un concurso al marketplace

| Concepto | Costo único | COP |
|---|---|---|
| Curación + chunking del corpus normativo (11 PDFs promedio) | 80 horas-asesor jurídico × COP 80 K | 6.400.000 |
| Ingesta + verificación con `hard-test-rag.mjs` | 16 horas dev × COP 100 K | 1.600.000 |
| Entrenamiento del prompt-engineer (system prompt específico) | 8 horas × COP 100 K | 800.000 |
| Tokens Voyage para ingestar (3.000 chunks × $0.18/M) | | 60.000 |
| **Total por concurso nuevo en el marketplace** | | **~8.860.000** |

Punto de breakeven por concurso nuevo: **8.860.000 / 207.900 = ~43 ventas** del concurso nuevo (2da compra de retornantes).

> Conclusión: con 250 usuarios pagos del PGN inicial y 28 % retornantes, ya tenemos ~70 ventas del 2do concurso → cualquier nuevo concurso pagado por sí mismo en mes 1 de su lanzamiento.

---

## 10. Sensibilidad — qué pasa si algo se mueve

| Cambio | Impacto en margen / decisión |
|---|---|
| **CAC sube a COP 150 K** (semana 1 sin optimizar) | Margen baja a 31 %; sostenible sólo si retornantes ≥ 40 %. |
| **Conversión global cae a 2.5 %** (creativos malos) | CAC sube a COP 320 K → pricing actual rompe. Acción: pausar pauta. |
| **Anthropic / Voyage sube precios 50 %** | Costo variable +COP 7 K → margen baja 2 puntos (irrelevante). |
| **Tasa retornantes baja a 20 %** (LTV cae) | LTV/CAC = 3.4× → sigue saludable. |
| **Subir precio a COP 397 K** | Margen sube a 63 % en escalado, pero CR cae 25-35 % → revenue NETO probablemente cae. |

---

## 11. Doble Garantía MéritoPro (reemplaza la garantía abierta)

> **Por qué cambiamos:** la garantía "si no presentas el examen, devolvemos el 100 %" es gameable — alguien compra, estudia con nuestro material durante 5 meses, dice que no presentará y reclama el reembolso. Sangra cash sin pruebas reales del lado del cliente.
>
> La nueva garantía protege a ambas partes: el usuario tiene seguridad real, nosotros tenemos pruebas verificables, y todo reclamo válido se resuelve **con producto** (no con cash), lo que protege la liquidez.

### 11.1. Garantía 1 — Satisfacción Inicial (cash, ventana corta)

> **"Si en los primeros 7 días no es lo que esperabas, te devolvemos el 100 %."**

| Condición | Valor |
|---|---|
| Ventana | 7 días corridos desde la compra. |
| Requisito de uso | Sólo el diagnóstico inicial (40 preguntas). Suficiente. |
| Reclamo | Email a `soporte@meritopro.co` con el motivo. Sin formularios. |
| Resultado | Reembolso 100 % en 5 días hábiles. |
| Exposición máxima | 7 días × ticket promedio × tasa esperada de reclamos (3 %) ≈ irrelevante en P&L. |

**Por qué funciona:** el usuario que iba a "abusar" no aguanta la fricción de pasar 30 minutos en el diagnóstico real. Y el que sí lo hace y ve el dictamen detallado de su nivel rara vez pide reembolso (CR de retención de cohortes con esta garantía: 96-98 %).

### 11.2. Garantía 2 — Resultado MéritoPro (crédito 50 %, uso único)

> **"Si entrenas con disciplina, te presentas al examen y no clasificas en la lista de elegibles, te damos 50 % de descuento canjeable una sola vez en cualquier curso del Marketplace, válido por 12 meses."**

#### Reglas operativas (no negociables)

| Regla | Detalle |
|---|---|
| **Descuento** | 50 % sobre el precio público del curso elegido del Marketplace. |
| **Uso** | **Una sola vez.** Se aplica a UN solo curso, en una sola compra. No es divisible. |
| **Vigencia** | **12 meses** desde la aprobación del reclamo. Pasado ese tiempo, expira. |
| **No acumulativo** | No se combina con otros descuentos del Marketplace (ej. el 30 % de retornante). El usuario obtiene **el mejor descuento aplicable**, que en este caso es el 50 %. |
| **Forma** | Código personal de un solo uso (`MERITO50-XXXX`) emitido al aprobar el reclamo. |
| **Producto del crédito** | Cualquier curso del Marketplace activo al momento del canje (PGN siguiente convocatoria, Fiscalía, Contraloría, Rama Judicial, etc.). |

#### Condiciones de elegibilidad (todas deben cumplirse)

| Condición | Cómo se verifica | Por qué la pedimos |
|---|---|---|
| **a)** Completar el diagnóstico inicial dentro de los primeros 14 días | Telemetría interna: `diagnostico_completed = true` | Punto de partida medible. |
| **b)** Completar ≥ **70 % de las sesiones diarias** del Bucle Diario disponibles entre la compra y el examen | Telemetría: `sesiones_completadas / sesiones_disponibles ≥ 0.70` | El método sólo funciona con uso real; si no entrenó, no podemos garantizar nada. |
| **c)** Mantener `probabilidad_aprobar_actual` registrada los últimos 30 días antes del examen | Métrica calculada automáticamente | Evidencia de uso continuo, no spike final. |
| **d)** Presentar el examen | Foto del **citatorio oficial** del examen (Universidad de Antioquia) **+** acta de presentación o sello del día | Documentos oficiales, no falsificables sin riesgo legal. |
| **e)** No clasificar en la lista de elegibles publicada oficialmente por la PGN | Captura/PDF del listado oficial donde el nombre del usuario NO aparece | Documento público, verificable por nosotros. |
| **f)** Reclamar dentro de los **30 días** siguientes a la publicación de resultados | Email + envío de evidencias | Ventana de cierre para no arrastrar reclamos eternos. |

#### Por qué este formato sí funciona (a diferencia del 100 % gratis)

1. **No suena a promesa milagro.** El "100 % gratis" lee a estafa de gurú; el "50 % off, una vez" lee a respaldo serio basado en evidencia.
2. **Skin in the game compartido.** El usuario también pone algo de su parte en el 2do intento → señal de compromiso real con el método.
3. **Asimetría a favor nuestro:** las condiciones (a)-(f) requieren evidencia que sólo un usuario que **realmente entrenó y se presentó** puede aportar.
4. **No sangra cash.** Cero reembolsos en efectivo. El reclamante paga COP 148.500 cuando canjea.
5. **Catalizador de retención.** El usuario que falló una vez, regresa con descuento — ese flujo es el corazón del LTV multi-concurso.

#### Estimación financiera (corregida, no más "100 % gratis")

**Tasa de activación esperada:**

| Variable | Valor |
|---|---|
| % de usuarios que cumplen (a)-(c) y se presentan | 50 % |
| Tasa histórica de no clasificación PGN | ~70 % |
| % de los no-clasificados que reclama dentro de la ventana | 60 % |
| **Activan la garantía** (la obtienen) | **50 % × 70 % × 60 % = 21 %** |
| **De los que activan, % que canjea el código en 12 meses** | **50 %** (benchmark redención de descuentos) |
| **% total de paid users que canjea la Garantía 2** | **21 % × 50 % = 10.5 %** |

**Análisis económico por canje (vs el escenario sin garantía):**

| Tipo de canjeante | Probabilidad | Lo que pasa | Impacto financiero |
|---|---|---|---|
| Habría regresado igual (canibalización) | 30 % | Paga COP 148.500 en lugar de COP 207.900 (precio retornante normal) | **−COP 59.400** de margen perdido |
| No habría regresado nunca (incremental) | 70 % | Paga COP 148.500 que de otra forma serían COP 0 | **+COP 110.500** de contribución ganada (descontando COP 38.000 de costo variable) |
| **Promedio ponderado por canjeante** | | | **+COP 59.530** |

**Impacto neto por usuario adquirido:**

10.5 % canjea × **+COP 59.530** = **+COP 6.250** netos en contribución por usuario.

> **Conclusión:** la Garantía 2 con descuento del 50 % uso-único **NO es un costo, es revenue accretive**. Por cada usuario adquirido, agrega ~COP 6.250 de contribución gracias a usuarios incrementales que sin garantía no habrían vuelto.

**Rango de sensibilidad:**

- En el peor caso (100 % canibalización: todos los canjeantes habrían vuelto igual al precio retornante normal): impacto neto = **−COP 6.237 por usuario adquirido**.
- En el mejor caso (0 % canibalización: todos son incrementales): impacto neto = **+COP 11.600 por usuario adquirido**.
- **Esperado:** entre **−COP 6.000 y +COP 12.000**, con punto medio cercano a **+COP 6.000**.

**Impacto en margen del precio:**

| Escenario | Costo total / usuario | Margen bruto a COP 297K |
|---|---|---|
| Sin garantía | COP 159.000 | 46 % |
| Con Garantía 2, escenario neutral | COP 159.000 | 46 % |
| Con Garantía 2, escenario optimista | COP 153.000 | 49 % |
| Con Garantía 2, escenario pesimista | COP 165.000 | 44 % |

> **Versus la versión anterior** (100 % gratis): el margen se mueve entre 44-49 % en lugar de bajar a 44 % fijo, con upside cuando los canjeantes son incrementales. Y en marketing es más creíble.

### 11.3. Letra fina (visible en la landing)

```
✅ Doble Garantía MéritoPro

  GARANTÍA 1: Satisfacción Inicial — 7 días
    Si en los primeros 7 días no es lo que esperabas,
    te devolvemos el 100 % de tu inversión. Sin formularios.
    Solo escríbenos.

  GARANTÍA 2: Resultado MéritoPro — Hasta el examen
    Si entrenas con disciplina (≥ 70 % de las sesiones diarias),
    te presentas al examen y NO clasificas en la lista de elegibles
    publicada por la PGN, te damos un código de
    50 % de descuento canjeable UNA SOLA VEZ
    en cualquier curso del Marketplace, válido por 12 meses.

    Reglas:
      · Aplica a un (1) solo curso, no acumulable con otros descuentos.
      · El código expira a los 12 meses. Sin renovaciones.
      · Pedimos: citatorio del examen, captura de la lista oficial,
        y reclamo dentro de los 30 días siguientes a la publicación.
```

### 11.4. Implementación (backlog técnico)

1. Endpoint `POST /api/garantia/reclamo` con upload de citatorio + lista de elegibles.
2. Dashboard interno para que customer success valide cada reclamo en < 48 h.
3. Métricas exigidas (a)-(c) ya están en `usuarios.probabilidad_aprobar_actual` y `sm2_repetition`. Faltaría agregar contador `sesiones_completadas` (trigger SQL al cerrar sesión).
4. Generador de códigos `MERITO50-XXXX` con TTL de 12 meses, marca `usado` al canjear (boolean en tabla `codigos_garantia`):
   ```sql
   CREATE TABLE public.codigos_garantia (
     codigo TEXT PRIMARY KEY,
     user_id UUID REFERENCES public.usuarios(id) NOT NULL,
     emitido_at TIMESTAMPTZ DEFAULT now(),
     expira_at TIMESTAMPTZ NOT NULL,
     usado_at TIMESTAMPTZ,
     curso_canjeado TEXT,
     CHECK (usado_at IS NULL OR usado_at <= expira_at)
   );
   ```
5. En el checkout: validar el código → marcar `usado_at = now()` atómicamente → bloquear cualquier otro descuento (no acumulable).
6. Si el reclamo se aprueba, transferir progreso SM-2 al nuevo curso del Marketplace (lógica ya prevista en el mapping cargo → concursos sugeridos) sólo cuando el código se canjea.

---

## 12. Conclusión y siguiente paso operativo

### Decisión

**Precio único de lanzamiento beta = COP 297.000** con descuento del 30 % para 2da compra en el marketplace.

### Por qué este precio gana

1. Cubre CAC + infraestructura + escalado con margen 51 % desde mes 3.
2. LTV/CAC de 4.05× (saludable, supera el umbral de 3× para escalar).
3. Está por debajo del umbral psicológico COP 300 K → conversión ≥ 4 %.
4. Permite la narrativa "valor declarado COP 1.240.000 → tú pagas COP 297.000 → garantía 100 %" que cierra ofertas frías.
5. Soporta el modelo NO-suscripción + Marketplace multi-concurso desde la primera venta.

### Siguiente paso

1. Implementar el flujo de pago Wompi/Bold con dos opciones: pago único (COP 297 K) y plan 3 cuotas (3 × COP 109 K).
2. Configurar el código de descuento `RETORNO30` en checkout.
3. Crear la pantalla del marketplace post-examen (mock-up arriba) — backlog de producto sprint 5.
4. Curar el corpus del 2do concurso (recomendación: **Fiscalía 2026**, máximo overlap con el corpus PGN ya ingestado, breakeven más rápido).
