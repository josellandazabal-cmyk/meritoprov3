// ============================================================
// FASE 7: AGENTE 3 — Cron de Remarketing (Leads no convertidos)
// Vercel Cron: lee leads donde convertido=false, genera email
// persuasivo con Claude, envía vía Resend.
// ============================================================

import { NextResponse } from 'next/server';
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
    // TODO: Uncomment when Supabase is connected
    // const supabase = await createClient();
    //
    // Fetch leads no convertidos
    // const { data: leads } = await supabase
    //   .from('leads')
    //   .select('*')
    //   .eq('convertido', false)
    //   .eq('remarketing_enviado_hoy', false)
    //   .limit(50);

    // Demo data
    const leads = [
      {
        id: 'lead-001',
        nombre: 'María López',
        email: 'maria@ejemplo.com',
        cargo_aspira: 'Procurador Judicial I',
        debilidad: 'Derecho Disciplinario (35%)',
      },
      {
        id: 'lead-002',
        nombre: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        cargo_aspira: 'Profesional Universitario',
        debilidad: 'Gestión Documental (45%)',
      },
    ];

    let enviados = 0;
    const errores: string[] = [];

    for (const lead of leads) {
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

          // TODO: Mark as sent in Supabase
          // await supabase
          //   .from('leads')
          //   .update({ remarketing_enviado_hoy: true })
          //   .eq('id', lead.id);
        } else {
          errores.push(`Email falló para lead ${lead.id}`);
        }
      } catch (error) {
        console.error(`[Remarketing] Error para lead ${lead.id}:`, error);
        errores.push(`Error para lead ${lead.id}: ${(error as Error).message}`);
      }
    }

    console.log(
      `[Cron Remarketing] ${leads.length} leads procesados. Enviados: ${enviados}, Errores: ${errores.length}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      leads_procesados: leads.length,
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
