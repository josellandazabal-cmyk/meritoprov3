// ============================================================
// /api/checkout/iniciar
//
// Recibe { lead_id | user_id, email, nombre, curso_slug, codigo_descuento? }
// y devuelve la URL del Web Checkout de Wompi.
//
// Casos:
//   1. Usuario autenticado → uses user.id como referenceId.
//   2. Lead pre-pago → uses leadId. La cuenta se crea en el webhook (post-pago)
//      cuando confirmamos el pago.
//
// El monto se calcula server-side (NO confiar en el cliente):
//   · Beta: COP 297.000.
//   · Si hay codigo_descuento válido → aplica el descuento canjeable.
//   · Para retornantes (compra ≥ 2da): aplicar 30% off automático (TODO).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  generarSesionWebCheckout,
  wompiConfigurado,
  type DatosCheckout,
} from '@/lib/payments/wompi';

export const runtime = 'nodejs';

const PRECIO_BETA_COP = 297_000;
const PRECIO_REGULAR_COP = 397_000;

const PayloadSchema = z.object({
  lead_id: z.string().uuid().optional(),
  email: z.string().email(),
  nombre: z.string().min(3).max(100),
  curso_slug: z.string().default('pgn-2026'),
  codigo_descuento: z.string().regex(/^MERITO50-[A-Z0-9]+$/i).optional(),
});

export async function POST(req: NextRequest) {
  if (!wompiConfigurado()) {
    return NextResponse.json(
      { error: 'Pasarela de pago no configurada en este entorno.' },
      { status: 503 }
    );
  }

  let payload: z.infer<typeof PayloadSchema>;
  try {
    payload = PayloadSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: 'Payload inválido', detalle: (e as Error).message },
      { status: 400 }
    );
  }

  // Resolver el referenceId: user.id si está autenticado, lead_id si no.
  let referenceId: string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    referenceId = user.id;
  } else if (payload.lead_id) {
    referenceId = payload.lead_id;
  } else {
    return NextResponse.json(
      { error: 'Se requiere lead_id si no hay sesión activa.' },
      { status: 400 }
    );
  }

  // Resolver el monto.
  let monto = PRECIO_BETA_COP;
  let codigoUsado: string | null = null;

  if (payload.codigo_descuento) {
    const codigo = payload.codigo_descuento.toUpperCase();
    const { data: codigoRow } = await supabase
      .from('codigos_garantia')
      .select('codigo, expira_at, usado_at')
      .eq('codigo', codigo)
      .maybeSingle();

    if (!codigoRow) {
      return NextResponse.json({ error: 'Código de descuento no existe.' }, { status: 400 });
    }
    if (codigoRow.usado_at) {
      return NextResponse.json({ error: 'Código ya usado.' }, { status: 400 });
    }
    if (new Date(codigoRow.expira_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Código expirado.' }, { status: 400 });
    }
    monto = Math.round(PRECIO_REGULAR_COP * 0.5); // 50% off uso único
    codigoUsado = codigo;
  }

  const datos: DatosCheckout = {
    referenceId,
    email: payload.email,
    nombre: payload.nombre,
    cursoSlug: payload.curso_slug,
    montoCop: monto,
    codigoDescuento: codigoUsado ?? undefined,
  };

  const sesion = generarSesionWebCheckout(datos);

  // Persistimos la intención de compra para reconciliar en el webhook.
  // No marcamos `usado_at` del código todavía — eso lo hace el webhook
  // sólo cuando el pago queda APPROVED.
  await supabase.from('intenciones_pago').insert({
    reference: sesion.reference,
    user_id: user?.id ?? null,
    lead_id: payload.lead_id ?? null,
    email: payload.email,
    monto_cop: monto,
    curso_slug: payload.curso_slug,
    codigo_descuento: codigoUsado,
    estado: 'iniciada',
  });

  return NextResponse.json({
    redirectUrl: sesion.redirectUrl,
    reference: sesion.reference,
    monto_cop: monto,
  });
}
