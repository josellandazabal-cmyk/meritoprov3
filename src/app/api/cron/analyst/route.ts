// ============================================================
// GET /api/cron/analyst
// Vercel Cron: diario a las 07:30 UTC (antes del briefing CEO).
// Calcula KPIs, detecta umbrales críticos y reporta a la CEO.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type SemaforoColor = 'VERDE' | 'AMARILLO' | 'ROJO';

interface KpiMetrica {
  nombre: string;
  valor: number;
  color: SemaforoColor;
  umbral_rojo: number;
  umbral_amarillo: number;
}

function semaforo(
  valor: number,
  umbralRojo: number,
  umbralAmarillo: number,
  mayor_es_mejor = true
): SemaforoColor {
  if (mayor_es_mejor) {
    if (valor <= umbralRojo) return 'ROJO';
    if (valor <= umbralAmarillo) return 'AMARILLO';
    return 'VERDE';
  } else {
    // menor es mejor (errores)
    if (valor >= umbralRojo) return 'ROJO';
    if (valor >= umbralAmarillo) return 'AMARILLO';
    return 'VERDE';
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const hace7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const fechaStr = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // 1. Leads captados hoy
  const { count: leadsHoy } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', hace24h);

  // 2. Diagnósticos completados hoy (via crm_eventos)
  const { count: diagnosticosHoy } = await supabase
    .from('crm_eventos')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'diagnostico_completado')
    .gte('created_at', hace24h);

  // 3. Pagos hoy
  const { count: pagosHoy } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('pago_completado_at', hace24h);

  // 4. Errores de agentes hoy
  const { count: erroresHoy } = await supabase
    .from('crm_eventos')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'error')
    .gte('created_at', hace24h);

  // 5. Leads activos últimos 7 días
  const { count: leadsActivos7d } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('updated_at', hace7d)
    .neq('etapa_crm', 'CHURNED');

  const leads = leadsHoy ?? 0;
  const diagnosticos = diagnosticosHoy ?? 0;
  const pagos = pagosHoy ?? 0;
  const errores = erroresHoy ?? 0;
  const activos7d = leadsActivos7d ?? 0;

  const cvr = diagnosticos > 0 ? Math.round((pagos / diagnosticos) * 100) : 0;

  // 6. Evaluar semáforos
  const metricas: KpiMetrica[] = [
    {
      nombre: 'leads_hoy',
      valor: leads,
      color: semaforo(leads, 5, 10),
      umbral_rojo: 5,
      umbral_amarillo: 10,
    },
    {
      nombre: 'cvr_pct',
      valor: cvr,
      color: semaforo(cvr, 3, 5),
      umbral_rojo: 3,
      umbral_amarillo: 5,
    },
    {
      nombre: 'errores_agentes_hoy',
      valor: errores,
      color: semaforo(errores, 5, 2, false),
      umbral_rojo: 5,
      umbral_amarillo: 2,
    },
  ];

  // 7. Alertas críticas a la CEO
  for (const m of metricas) {
    if (m.color === 'ROJO') {
      await supabase.from('agent_mensajes').insert({
        de_agente: 'director-analyst',
        para_agente: 'ceo',
        tipo: 'alerta',
        asunto: `CRITICO: ${m.nombre} = ${m.valor} (umbral rojo: ${m.umbral_rojo})`,
        contenido: `La métrica "${m.nombre}" está en nivel ROJO.\nValor actual: ${m.valor}\nUmbral crítico: ${m.umbral_rojo}\nFecha: ${fechaStr}`,
        prioridad: 'critica',
        requiere_aprobacion: false,
        leido: false,
      });
    }
  }

  // 8. Reporte KPI diario
  const reporteTexto = `## KPI Flash — ${fechaStr}

| Métrica | Valor | Estado |
|---------|-------|--------|
| Leads captados (24h) | ${leads} | ${metricas[0].color} |
| Diagnósticos (24h) | ${diagnosticos} | — |
| Pagos (24h) | ${pagos} | — |
| CVR Diagnóstico→Pago | ${cvr}% | ${metricas[1].color} |
| Errores agentes (24h) | ${errores} | ${metricas[2].color} |
| Leads activos (7d) | ${activos7d} | — |

Generado automáticamente por Director Analyst.`;

  await supabase.from('agent_mensajes').insert({
    de_agente: 'director-analyst',
    para_agente: 'ceo',
    tipo: 'reporte_diario',
    asunto: `KPI Flash ${fechaStr}`,
    contenido: reporteTexto,
    prioridad: 'normal',
    requiere_aprobacion: false,
    leido: false,
  });

  console.log(
    `[Analyst] KPI Flash enviado — Leads: ${leads}, CVR: ${cvr}%, Pagos: ${pagos}, Errores: ${errores}`
  );

  return NextResponse.json({
    ok: true,
    metricas: {
      leads_hoy: leads,
      diagnosticos_hoy: diagnosticos,
      pagos_hoy: pagos,
      cvr_pct: cvr,
      errores_hoy: errores,
      leads_activos_7d: activos7d,
    },
    alertas_criticas: metricas.filter((m) => m.color === 'ROJO').map((m) => m.nombre),
  });
}
