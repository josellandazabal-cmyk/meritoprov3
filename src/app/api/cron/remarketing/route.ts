// ============================================================
// FASE 7: AGENTE 3 — Cron de Remarketing (Leads no convertidos)
// Vercel Cron: lee leads donde convertido=false, genera email
// persuasivo con Claude, envía vía Resend.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { llamarAgente, parsearRespuestaJSON } from '@/lib/ia/anthropic';
import { SYSTEM_PROMPT_PERSUASOR_V4 } from '@/lib/ia/prompts';
import { enviarEmail, generarEmailRemarketing } from '@/lib/omnichannel/resend';

interface RemarketingEmailContent {
  asunto: string;
  body: string;
}

export async function GET(request: Request) {
  // Proteger con CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch leads no convertidos que no recibieron remarketing hoy
    const { data: leads, error: dbError } = await supabase
      .from('leads')
      .select('id, nombre, email, cargo_aspira')
      .eq('convertido', false)
      .eq('remarketing_enviado_hoy', false)
      .limit(50);

    if (dbError) {
      console.error('[Cron Remarketing] DB Error:', dbError.message);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    const leadsProcesados = (leads || []).map(l => ({
      ...l,
      debilidad: 'Por diagnosticar — accede para un análisis completo',
    }));

    let enviados = 0;
    const errores: string[] = [];

    for (const lead of leadsProcesados) {
      try {
        // Generate persuasive email with Claude (Agent 3)
        const userMessage = `
Genera un email de remarketing para este lead:
- Nombre: ${lead.nombre}
- Cargo al que aspira: ${lead.cargo_aspira}
- Su mayor debilidad en el diagnóstico: ${lead.debilidad}

Recuerda: JSON con {asunto, body}. Máximo 100 palabras en body. Usa aversión a la pérdida y personaliza con su debilidad.`;

        const respuesta = await llamarAgente({
          systemPrompt: SYSTEM_PROMPT_PERSUASOR_V4,
          userMessage,
          maxTokens: 512,
        });

        const emailContent = parsearRespuestaJSON<RemarketingEmailContent>(respuesta);

        if (!emailContent) {
          errores.push(`JSON inválido para lead ${lead.id}`);
          continue;
        }

        // Generate branded HTML and send
        const html = generarEmailRemarketing(
          lead.nombre,
          emailContent.asunto,
          emailContent.body
        );

        const ok = await enviarEmail({
          to: lead.email,
          subject: emailContent.asunto,
          html,
        });

        if (ok) {
          enviados++;

          // Marcar como enviado para evitar duplicados en próximas ejecuciones
          const { error: updateError } = await supabase
            .from('leads')
            .update({ remarketing_enviado_hoy: true })
            .eq('id', lead.id);

          if (updateError) {
            console.warn(
              `[Remarketing] No se pudo marcar lead ${lead.id} como enviado:`,
              updateError.message
            );
          }
        } else {
          errores.push(`Email falló para lead ${lead.id}`);
        }
      } catch (error) {
        console.error(`[Remarketing] Error para lead ${lead.id}:`, error);
        errores.push(`Error para lead ${lead.id}: ${(error as Error).message}`);
      }
    }

    console.log(
      `[Cron Remarketing] ${leadsProcesados.length} leads procesados. Enviados: ${enviados}, Errores: ${errores.length}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      leads_procesados: leadsProcesados.length,
      enviados,
      errores: errores.length,
      detalle_errores: errores,
    });
  } catch (error) {
    console.error('[Cron Remarketing] Error:', error);
    return NextResponse.json(
      { error: 'Error ejecutando cron de remarketing' },
      { status: 500 }
    );
  }
}
