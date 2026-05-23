// ============================================================
// POST /api/crm/garantias
// Crea una solicitud de garantía (satisfacción 7 días o resultado concurso).
// Para garantía de resultado: verifica % de sesiones SM-2 completadas.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  tipo: z.enum(['satisfaccion_7dias', 'resultado_concurso']),
  motivo: z.string().max(1000).optional(),
  citatorio_url: z.string().url().optional(),
  resultado_lista_url: z.string().url().optional(),
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

  // Verificar que el lead existe y pagó
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, nombre, email, pago_completado_at')
    .eq('id', body.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  if (!lead.pago_completado_at) {
    return NextResponse.json(
      { error: 'Solo usuarios con pago completado pueden solicitar garantías' },
      { status: 403 }
    );
  }

  let porcentajeSesiones: number | null = null;
  let cumpleRequisito: boolean | null = null;

  // Para garantía de resultado: calcular % sesiones SM-2
  if (body.tipo === 'resultado_concurso') {
    // Buscar el user_id ligado a este lead a través de auth.users (por email)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('user_id')
      .eq('lead_id', body.lead_id)
      .maybeSingle();

    if (usuario?.user_id) {
      // Contar sesiones completadas vs esperadas
      const { data: sesiones } = await supabase
        .from('sm2_repetition')
        .select('id, next_review_date, repetition_count')
        .eq('user_id', usuario.user_id);

      if (sesiones) {
        const totalRegistros = sesiones.length;
        // Sesiones "completadas" = registros que han sido repasados al menos una vez
        const completadas = sesiones.filter((s) => s.repetition_count > 0).length;
        porcentajeSesiones =
          totalRegistros > 0 ? Math.round((completadas / totalRegistros) * 100) : 0;
        cumpleRequisito = porcentajeSesiones >= 70;
      }
    }
  }

  // Insertar garantía
  const { data: garantia, error: garantiaError } = await supabase
    .from('garantias')
    .insert({
      lead_id: body.lead_id,
      tipo: body.tipo,
      estado: 'pendiente',
      motivo: body.motivo ?? null,
      porcentaje_sesiones_completadas: porcentajeSesiones,
      cumple_requisito_70pct: cumpleRequisito,
      cupon_generado: null,
    })
    .select('id')
    .single();

  if (garantiaError || !garantia) {
    console.error('[Garantías] Error creando garantía:', garantiaError?.message);
    return NextResponse.json(
      { error: 'Error creando garantía', details: garantiaError?.message },
      { status: 500 }
    );
  }

  // Registrar evento CRM
  await supabase.from('crm_eventos').insert({
    lead_id: body.lead_id,
    tipo: 'garantia_solicitada',
    payload: {
      garantia_id: garantia.id,
      tipo: body.tipo,
      porcentaje_sesiones: porcentajeSesiones,
      cumple_requisito: cumpleRequisito,
    },
    agente: 'sistema',
    canal: 'web',
  });

  // Notificar al director de clientes
  await supabase.from('agent_mensajes').insert({
    de_agente: 'sistema',
    para_agente: 'director-cliente',
    tipo: 'alerta',
    asunto: `Garantía solicitada: ${body.tipo} — ${lead.nombre}`,
    contenido: JSON.stringify({
      garantia_id: garantia.id,
      lead_id: body.lead_id,
      lead_nombre: lead.nombre,
      lead_email: lead.email,
      tipo: body.tipo,
      motivo: body.motivo,
      porcentaje_sesiones: porcentajeSesiones,
      cumple_requisito: cumpleRequisito,
      citatorio_url: body.citatorio_url,
      resultado_lista_url: body.resultado_lista_url,
    }),
    prioridad: 'alta',
    requiere_aprobacion: true,
    leido: false,
  });

  return NextResponse.json({
    garantia_id: garantia.id,
    tipo: body.tipo,
    porcentaje_sesiones_completadas: porcentajeSesiones,
    cumple_requisito_70pct: cumpleRequisito,
    estado: 'pendiente',
  });
}
