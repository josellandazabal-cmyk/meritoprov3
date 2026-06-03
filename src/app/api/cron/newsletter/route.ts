// ============================================================
// GET /api/cron/newsletter
// Vercel Cron: martes a las 10:00 UTC (05:00 COL).
// Envía el artículo de blog de la semana a leads no-churned que
// no han recibido newsletter en los últimos 7 días.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNewsletterArticulo } from '@/lib/omnichannel/email-templates';

// Rotación semanal de artículos del blog
const ARTICULOS_NEWSLETTER = [
  {
    slug: 'guia-completa-concurso-pgn-2026',
    titulo: 'Concurso PGN 2026: Guía Completa de Vacantes, Fechas y Cómo Clasificar',
    excerpt:
      '2.824 vacantes, inscripciones del 1 al 12 de junio. Cronograma oficial, estructura del examen, puntajes y estrategia de preparación paso a paso.',
    tiempoLectura: 8,
    categoria: 'Guías oficiales',
  },
  {
    slug: 'ley-1952-codigo-general-disciplinario-guia-examen-pgn',
    titulo: 'Ley 1952 de 2019: Código General Disciplinario explicado para el Examen PGN',
    excerpt:
      'La norma más preguntada en el concurso PGN. Estructura, principios rectores, tipos de faltas, sanciones y procedimiento disciplinario — con enfoque en lo que realmente cae.',
    tiempoLectura: 10,
    categoria: 'Derecho disciplinario',
  },
  {
    slug: 'tipos-preguntas-examen-pgn-2026-como-resolverlas',
    titulo: 'Tipo I, II, III y Comportamentales: Cómo Resolver Cada Pregunta del Examen PGN',
    excerpt:
      'El examen PGN evalúa 4 tipos de preguntas con lógicas completamente distintas. Estrategias de resolución, ejemplos reales y tiempos recomendados para cada tipo.',
    tiempoLectura: 9,
    categoria: 'Estrategia y metodología',
  },
] as const;

function articuloDeEstaSemana() {
  const semanaISO = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  return ARTICULOS_NEWSLETTER[semanaISO % ARTICULOS_NEWSLETTER.length];
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const articulo = articuloDeEstaSemana();
  const hace7dias = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  // Lead_ids que ya recibieron newsletter esta semana
  const { data: recientes } = await supabase
    .from('crm_eventos')
    .select('lead_id')
    .eq('tipo', 'newsletter_enviado')
    .gte('created_at', hace7dias);

  const excluir = new Set((recientes ?? []).map((r: { lead_id: string }) => r.lead_id));

  // Leads no-churned con email
  const { data: leads, error: dbError } = await supabase
    .from('leads')
    .select('id, nombre, email, etapa_crm')
    .neq('etapa_crm', 'CHURNED')
    .not('email', 'is', null)
    .limit(500);

  if (dbError) {
    console.error('[Newsletter] DB error:', dbError.message);
    return NextResponse.json({ error: 'DB error', details: dbError.message }, { status: 500 });
  }

  const pendientes = (leads ?? []).filter(
    (l: { id: string }) => !excluir.has(l.id)
  );

  let enviados = 0;
  const errores: string[] = [];

  for (const lead of pendientes as { id: string; nombre: string; email: string }[]) {
    try {
      await enviarNewsletterArticulo({
        to: lead.email,
        nombre: lead.nombre ?? 'Aspirante',
        articulo,
      });

      enviados++;

      await supabase.from('crm_eventos').insert({
        lead_id: lead.id,
        tipo: 'newsletter_enviado',
        payload: { slug: articulo.slug, titulo: articulo.titulo },
        agente: 'newsletter',
        canal: 'email',
      });

      // Pequeña pausa para no saturar la API de Resend (100 req/s limit)
      if (enviados % 50 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      const msg = `Error lead ${lead.id}: ${String(err)}`;
      console.error('[Newsletter]', msg);
      errores.push(msg);
    }
  }

  console.log(
    `[Newsletter] Artículo: "${articulo.slug}" · Enviados: ${enviados}/${pendientes.length} · Errores: ${errores.length}`
  );

  return NextResponse.json({
    ok: true,
    articulo: articulo.slug,
    pendientes: pendientes.length,
    enviados,
    errores: errores.length,
  });
}
