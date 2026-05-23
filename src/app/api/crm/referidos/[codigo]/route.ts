// ============================================================
// GET /api/crm/referidos/[codigo]
// Valida un código de referido y devuelve el beneficio.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  // Next.js 15+: los params en route handlers dinámicos son Promise.
  params: Promise<{ codigo: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { codigo } = await params;

  if (!codigo || codigo.length < 3) {
    return NextResponse.json({ valido: false, error: 'Código inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: codigoData, error } = await supabase
    .from('codigos_referido')
    .select('id, activo, usos_actuales, usos_maximos, lead_id, leads(concurso_id)')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('[Referidos] Error consultando código:', error.message);
    return NextResponse.json({ valido: false, error: 'Error interno' }, { status: 500 });
  }

  if (!codigoData) {
    return NextResponse.json({ valido: false, error: 'Código no existe' });
  }

  if (!codigoData.activo) {
    return NextResponse.json({ valido: false, error: 'Código inactivo' });
  }

  if (codigoData.usos_actuales >= codigoData.usos_maximos) {
    return NextResponse.json({ valido: false, error: 'Código agotado' });
  }

  const leadsData = codigoData.leads as unknown as { concurso_id: string | null } | null;
  const concursoId = leadsData?.concurso_id ?? null;

  return NextResponse.json({
    valido: true,
    beneficio_referido: '10% de descuento en tu acceso a MéritoPro PGN 2026',
    concurso_id: concursoId,
  });
}
