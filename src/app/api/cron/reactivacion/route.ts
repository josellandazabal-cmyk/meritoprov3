// ============================================================
// GET /api/cron/reactivacion
// Vercel Cron: lunes a las 13:00 UTC.
// Reactiva leads inactivos > 30 días. Si tienen 3+ emails de
// reactivación → etapa_crm = 'CHURNED'.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { llamarAgente, parsearRespuestaJSON } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_PERSUASOR_V4 } from '@/lib/ia/prompts';
import { enviarEmail, generarEmailRemarketing } from '@/lib/omnichannel/resend';
import { emailDelDia, TipoEmail } from '@/lib/crm/email-secuencias';

interface ReactivacionEmailContent {
  asunto: string;
  body: string;
}

interface LeadInactivo {
  id: string;
  nombre: string;
  email: string;
  cargo_aspira: string;
  lead_score: number;
  persona_tipo: string | null;
  updated_at: string;
}

const SYSTEM_PROMPT_REACTIVACION = `${SYSTEM_PROMPT_PERSUASOR_V4}

CONTEXTO ADICIONAL: Este lead lleva más de 30 días inactivo. El ángulo debe ser de segunda oportunidad y urgencia real (el concurso PGN 2026 se acerca). Sin agresividad, pero con claridad: el tiempo se agota.`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hace30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // Leads inactivos > 30 días, diagnosticados, no pagados
  const { data: leads, error: dbError } = await supabase
    .from('leads')
    .select('id, nombre, email, cargo_aspira, lead_score, persona_tipo, updated_at')
    .eq('etapa_crm', 'DIAGNOSTICADO')
    .lt('updated_at', hace30d)
    .is('pago_completado_at', null)
    .limit(50);

  if (dbError) {
    console.error('[Reactivacion] DB error:', dbError.message);
    return NextResponse.json({ error: 'DB error', details: dbError.message }, { status: 500 });
  }

  let enviados = 0;
  let churneados = 0;
  const errores: string[] = [];

  for (const rawLead of leads ?? []) {
    const lead = rawLead as LeadInactivo;

    try {
      // Contar emails de reactivación previos
      const { count: reactivacionCount } = await supabase
        .from('crm_eventos')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('tipo', 'email_reactivacion_enviado');

      const numReactivaciones = reactivacionCount ?? 0;

      // Si ya recibió 3+ → churnear
      if (numReactivaciones >= 3) {
        await supabase
          .from('leads')
          .update({ etapa_crm: 'CHURNED', updated_at: new Date().toISOString() })
          .eq('id', lead.id);

        await supabase.from('crm_eventos').insert({
          lead_id: lead.id,
          tipo: 'lead_churneado',
          payload: { razon: 'Sin respuesta tras 3 emails de reactivación' },
          agente: 'sistema',
          canal: 'web',
        });

        churneados++;
        continue;
      }

      // Determinar tipo de email de reactivación
      const diasDesdeActualizacion = Math.floor(
        (Date.now() - new Date(lead.updated_at).getTime()) / (24 * 3600 * 1000)
      );

      // Mapear a tipo de reactivación
      let tipoEmail: TipoEmail = 'reactivacion_1';
      if (numReactivaciones === 1) tipoEmail = 'reactivacion_7';
      else if (numReactivaciones >= 2) tipoEmail = 'reactivacion_30';

      const userMessage = `Genera email de reactivación tipo "${tipoEmail}" para:
- Nombre: ${lead.nombre}
- Cargo aspirado: ${lead.cargo_aspira}
- Días sin actividad: ${diasDesdeActualizacion}
- Email de reactivación número: ${numReactivaciones + 1} de 3
JSON: {"asunto": "...", "body": "..."} — máximo 100 palabras en body.`;

      const respuesta = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_REACTIVACION,
        userMessage,
        maxTokens: 512,
      });

      const emailContent = parsearRespuestaJSON<ReactivacionEmailContent>(respuesta);
      if (!emailContent?.asunto || !emailContent.body) {
        errores.push(`JSON inválido para lead ${lead.id}`);
        continue;
      }

      const html = generarEmailRemarketing(lead.nombre, emailContent.asunto, emailContent.body);

      const ok = await enviarEmail({
        to: lead.email,
        subject: emailContent.asunto,
        html,
      });

      if (ok) {
        enviados++;

        await supabase
          .from('leads')
          .update({
            ultimo_email_enviado_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        await supabase.from('crm_eventos').insert({
          lead_id: lead.id,
          tipo: 'email_reactivacion_enviado',
          payload: {
            tipo_email: tipoEmail,
            numero_reactivacion: numReactivaciones + 1,
            asunto: emailContent.asunto,
          },
          agente: 'persuasor',
          canal: 'email',
        });
      } else {
        errores.push(`Email falló para lead ${lead.id}`);
      }
    } catch (err) {
      const msg = `Error lead ${lead.id}: ${String(err)}`;
      console.error('[Reactivacion]', msg);
      errores.push(msg);
    }
  }

  console.log(
    `[Reactivacion] Procesados: ${(leads ?? []).length}, Enviados: ${enviados}, Churneados: ${churneados}, Errores: ${errores.length}`
  );

  return NextResponse.json({
    ok: true,
    procesados: (leads ?? []).length,
    enviados,
    churneados,
    errores: errores.length,
  });
}
