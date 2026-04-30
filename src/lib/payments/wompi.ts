// ============================================================
// MéritoPro V4 — Cliente de Wompi (pasarela de pago)
//
// Wompi es la pasarela más usada en Colombia. Soporta PSE, tarjetas,
// Bancolombia, Nequi y efectivo en una sola integración.
//
// Docs:    https://docs.wompi.co
// API:     https://api.wompi.co/v1 (sandbox: https://sandbox.wompi.co/v1)
// Pricing: 2.65% + IVA + COP 700 fijo (sandbox: gratuito)
//
// El abstracción de este módulo está pensada para que cambiar a Bold
// (u otra pasarela) requiera tocar SÓLO este archivo. La interfaz pública
// es `crearTransaccion`, `obtenerTransaccion`, `verificarFirmaWebhook`.
// ============================================================

import { createHash, timingSafeEqual } from 'node:crypto';

// ------------------------------------------------------------
// Configuración por entorno
// ------------------------------------------------------------

const PRECIO_BETA_COP = 297_000;
const MONEDA = 'COP';

function entorno() {
  return process.env.WOMPI_ENV === 'production' ? 'production' : 'sandbox';
}

function baseURL() {
  return entorno() === 'production'
    ? 'https://api.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

function publicKey() {
  return entorno() === 'production'
    ? process.env.WOMPI_PUBLIC_KEY_PROD
    : process.env.WOMPI_PUBLIC_KEY_SANDBOX;
}

function privateKey() {
  return entorno() === 'production'
    ? process.env.WOMPI_PRIVATE_KEY_PROD
    : process.env.WOMPI_PRIVATE_KEY_SANDBOX;
}

function integrityKey() {
  // Firma de la URL del Web Checkout (no la del webhook).
  return entorno() === 'production'
    ? process.env.WOMPI_INTEGRITY_KEY_PROD
    : process.env.WOMPI_INTEGRITY_KEY_SANDBOX;
}

function eventsSecret() {
  // Secret para validar firma de webhooks (Wompi → nuestro endpoint).
  return entorno() === 'production'
    ? process.env.WOMPI_EVENTS_SECRET_PROD
    : process.env.WOMPI_EVENTS_SECRET_SANDBOX;
}

function configurado(): boolean {
  return Boolean(publicKey() && privateKey() && integrityKey() && eventsSecret());
}

// ------------------------------------------------------------
// Tipos del dominio
// ------------------------------------------------------------

export interface DatosCheckout {
  /** UUID del usuario (post-auth) o leadId (pre-auth) */
  referenceId: string;
  /** Email del comprador (pre-llenado en Wompi). */
  email: string;
  /** Nombre del comprador. */
  nombre: string;
  /** Curso del Marketplace que se compra (ej. 'pgn-2026'). */
  cursoSlug: string;
  /** Precio en pesos colombianos (entero, sin centavos). */
  montoCop?: number;
  /** Código de descuento aplicado, si existe (ej. MERITO50-ABCD). */
  codigoDescuento?: string;
}

export interface ParametrosWebCheckout {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string; // SHA256 hex
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Construye una referencia única que sobrevive al ciclo de vida de la compra.
 * Formato: `<curso>-<userId>-<timestamp>`. Es lo que llega al webhook y lo que
 * usamos para reconciliar en `respuestas_preguntas` / `usuarios.convertido`.
 */
export function construirReferencia(d: DatosCheckout): string {
  const ts = Date.now().toString(36);
  return `${d.cursoSlug}-${d.referenceId}-${ts}`;
}

/**
 * Calcula la firma de integridad para el Web Checkout (Wompi exige
 * esta firma sobre los parámetros públicos del checkout para evitar
 * que un atacante manipule el monto desde el frontend).
 *
 * Fórmula: SHA256("<reference><amountInCents><currency><integrityKey>")
 */
function firmaWebCheckout(reference: string, amountInCents: number): string {
  const ik = integrityKey();
  if (!ik) throw new Error('[Wompi] WOMPI_INTEGRITY_KEY no configurada.');
  // Wompi exige SHA-256 plano (no HMAC) sobre la concatenación textual.
  return createHash('sha256').update(`${reference}${amountInCents}${MONEDA}${ik}`).digest('hex');
}

// ------------------------------------------------------------
// API pública: crear sesión de checkout
// ------------------------------------------------------------

export interface ResultadoIniciar {
  // URL del Web Checkout de Wompi a la que redirigimos al usuario.
  redirectUrl: string;
  // La referencia que registramos para luego reconciliar.
  reference: string;
}

/**
 * Devuelve los parámetros para redirigir al usuario al Web Checkout de Wompi.
 * No hace HTTP a Wompi — el Web Checkout vive en sandbox/checkout.wompi.co
 * y se construye con query params + signature en el cliente.
 */
export function generarSesionWebCheckout(d: DatosCheckout): ResultadoIniciar {
  if (!configurado()) {
    throw new Error('[Wompi] Pasarela no configurada (faltan keys en .env.local).');
  }

  const monto = d.montoCop ?? PRECIO_BETA_COP;
  const amountInCents = monto * 100;
  const reference = construirReferencia(d);
  const signature = firmaWebCheckout(reference, amountInCents);

  const checkoutHost =
    entorno() === 'production'
      ? 'https://checkout.wompi.co/p/'
      : 'https://checkout.wompi.co/p/'; // mismo host; sandbox usa public key sandbox.

  const params = new URLSearchParams({
    'public-key': publicKey()!,
    currency: MONEDA,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': signature,
    'redirect-url': `${siteOrigin()}/dashboard/bienvenida?ref=${encodeURIComponent(reference)}`,
    'customer-data:email': d.email,
    'customer-data:full-name': d.nombre,
  });

  return {
    redirectUrl: `${checkoutHost}?${params.toString()}`,
    reference,
  };
}

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

// ------------------------------------------------------------
// API pública: leer una transacción (server-side, con private key)
// ------------------------------------------------------------

export interface TransaccionWompi {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  payment_method_type: string;
  customer_email: string;
  created_at: string;
  finalized_at: string | null;
}

export async function obtenerTransaccion(id: string): Promise<TransaccionWompi> {
  const pk = privateKey();
  if (!pk) throw new Error('[Wompi] WOMPI_PRIVATE_KEY no configurada.');
  const r = await fetch(`${baseURL()}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${pk}` },
  });
  if (!r.ok) {
    throw new Error(`[Wompi] Error obteniendo transacción ${id}: HTTP ${r.status}`);
  }
  const json = (await r.json()) as { data: TransaccionWompi };
  return json.data;
}

// ------------------------------------------------------------
// API pública: validar firma del webhook
//
// Wompi envía en el body:
//   {
//     "event": "transaction.updated",
//     "data": { "transaction": { ... } },
//     "sent_at": "2026-04-30T10:00:00Z",
//     "timestamp": 1714466400,
//     "signature": { "checksum": "<hex>", "properties": ["transaction.id", ...] }
//   }
//
// La firma se calcula como:
//   SHA256( <valor_propiedades_concat> + timestamp + events_secret )
//
// Donde valor_propiedades_concat es la concatenación de los valores
// indicados en `signature.properties` resueltos contra `data`.
// ------------------------------------------------------------

interface WebhookPayloadWompi {
  event: string;
  data: { transaction: TransaccionWompi };
  sent_at?: string;
  timestamp: number;
  signature: { checksum: string; properties: string[] };
  environment?: string;
}

function resolverPropiedad(payload: WebhookPayloadWompi, prop: string): string {
  // prop es como "transaction.id" → atravesar payload.data.<path>
  const partes = prop.split('.');
  let actual: unknown = payload.data;
  for (const p of partes) {
    if (actual && typeof actual === 'object' && p in (actual as Record<string, unknown>)) {
      actual = (actual as Record<string, unknown>)[p];
    } else {
      return '';
    }
  }
  return actual === null || actual === undefined ? '' : String(actual);
}

export function verificarFirmaWebhook(payload: WebhookPayloadWompi): boolean {
  const secret = eventsSecret();
  if (!secret) {
    console.error('[Wompi] WOMPI_EVENTS_SECRET no configurado.');
    return false;
  }
  const valoresConcat = payload.signature.properties
    .map((p) => resolverPropiedad(payload, p))
    .join('');
  const concatenated = `${valoresConcat}${payload.timestamp}${secret}`;
  // Wompi usa SHA-256 plano para firmar el webhook (mismo esquema que la
  // firma de integridad del Web Checkout — no HMAC).
  const hash = createHash('sha256').update(concatenated).digest('hex');

  // Comparación constante-en-tiempo para evitar timing attacks.
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(payload.signature.checksum, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type { WebhookPayloadWompi };
export { configurado as wompiConfigurado };
