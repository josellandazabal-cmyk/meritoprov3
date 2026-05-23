// ============================================================
// POST /api/crm/referidos/registrar
// Registra que un lead usó un código de referido.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const BodySchema = z.object({
  codigo: z.string().min(3).max(20),
  lead_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    body = BodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: 'Payload inválido', details: String(err) },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Buscar el código
  const { data: codigoData, error: codigoError } = await supabase
    .from('codigos_referido')
    .select('id, activo, usos_actuales, usos_maximos')
    .eq('codigo', body.codigo.toUpperCase())
    .maybeSingle();

  if (codigoError || !codigoData) {
    return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 });
  }

  if (!codigoData.activo || codigoData.usos_actuales >= codigoData.usos_maximos) {
    return NextResponse.json({ error: 'Código no disponible' }, { status: 409 });
  }

  // Verificar que no esté ya registrado
  const { data: existente } = await supabase
    .from('referidos_registro')
    .select('id')
    .eq('codigo_id', codigoData.id)
    .eq('lead_referido_id', body.lead_id)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ error: 'Ya registrado con este código' }, { status: 409 });
  }

  // Insertar registro
  const { error: insertError } = await supabase.from('referidos_registro').insert({
    codigo_id: codigoData.id,
    lead_referido_id: body.lead_id,
    pago_completado: false,
  });

  if (insertError) {
    console.error('[Referidos] Error insertando registro:', insertError.message);
    return NextResponse.json({ error: 'Error registrando referido' }, { status: 500 });
  }

  // Incrementar usos
  const { error: updateError } = await supabase
    .from('codigos_referido')
    .update({ usos_actuales: codigoData.usos_actuales + 1 })
    .eq('id', codigoData.id);

  if (updateError) {
    console.warn('[Referidos] No se pudo incrementar usos:', updateError.message);
  }

  return NextResponse.json({ ok: true, codigo_id: codigoData.id });
}
