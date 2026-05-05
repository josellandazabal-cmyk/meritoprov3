'use server';

// ============================================================
// Server Action — Reportar resultado del concurso PGN.
//
// Cuando el aspirante recibe noticia oficial del concurso, puede
// reportar su estado (pasa pruebas / lista de elegibles / posesionado /
// no pasa / no se inscribió). Esto alimenta la métrica north-star
// de tasa de éxito de MéritoPro.
//
// Auth: usuario logueado. RLS bloquea cualquier escritura cruzada.
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ResultadoSchema = z.object({
  resultado: z.enum([
    'pasa_pruebas',
    'no_pasa_pruebas',
    'en_lista_elegibles',
    'posesionado',
    'no_se_inscribio',
    'pendiente',
  ]),
  notas: z.string().max(500).optional(),
});

export type ResultadoInput = z.infer<typeof ResultadoSchema>;

export interface ResultadoOk {
  ok: boolean;
  error?: string;
}

export async function reportarResultadoConcurso(
  input: ResultadoInput
): Promise<ResultadoOk> {
  const parsed = ResultadoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Estado inválido.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'No autenticado' };

    const { error } = await supabase
      .from('usuarios')
      .update({
        resultado_concurso: parsed.data.resultado,
        resultado_concurso_fecha: new Date().toISOString(),
        resultado_concurso_notas: parsed.data.notas?.trim() || null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('[ReportarResultado] DB error:', error.message);
      return { ok: false, error: 'No se pudo guardar tu reporte.' };
    }

    revalidatePath('/dashboard', 'layout');
    return { ok: true };
  } catch (err) {
    console.error('[ReportarResultado] error:', err);
    return { ok: false, error: 'Error inesperado.' };
  }
}

export interface EstadoReporte {
  reportado: boolean;
  resultado: string | null;
  fecha: string | null;
}

export async function consultarReporteResultado(): Promise<EstadoReporte> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { reportado: false, resultado: null, fecha: null };
    }

    const { data } = await supabase
      .from('usuarios')
      .select('resultado_concurso, resultado_concurso_fecha')
      .eq('id', user.id)
      .maybeSingle<{
        resultado_concurso: string | null;
        resultado_concurso_fecha: string | null;
      }>();

    return {
      reportado:
        Boolean(data?.resultado_concurso) &&
        data!.resultado_concurso !== 'pendiente',
      resultado: data?.resultado_concurso ?? null,
      fecha: data?.resultado_concurso_fecha ?? null,
    };
  } catch {
    return { reportado: false, resultado: null, fecha: null };
  }
}
