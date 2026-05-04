'use server';

import { createClient } from '@/lib/supabase/server';
import { obtenerBotUsername } from '@/lib/omnichannel/telegram';

// ============================================================
// Server action — Datos completos del perfil del aspirante.
//
// Reemplaza el "Carlos García López / Procurador Judicial I" hardcodeado.
// Lee:
//   · auth.users (email, nombre desde user_metadata)
//   · public.usuarios (profesion, nivel_cargo, fecha_examen, lead_id)
//   · public.leads (cargo_aspira via lead_id)
//   · public.respuestas_preguntas (estadísticas de estudio)
//
// Defaults seguros para usuarios recién creados sin perfil completo.
// ============================================================

export interface PerfilUsuario {
  nombre: string;
  iniciales: string;
  email: string;
  cargo_aspira: string;
  nivel_cargo: string;
  profesion: string;
  fecha_examen_humana: string;
  telegram_conectado: boolean;
  estadisticas: {
    dias_activos: number;
    preguntas_resueltas: number;
    racha_dias: number;
    tiempo_total_horas: number;
  };
}

const PERFIL_DEFAULT: PerfilUsuario = {
  nombre: 'Aspirante',
  iniciales: 'A',
  email: '',
  cargo_aspira: 'Por definir',
  nivel_cargo: 'Por definir',
  profesion: 'Por definir',
  fecha_examen_humana: 'Por definir',
  telegram_conectado: false,
  estadisticas: {
    dias_activos: 0,
    preguntas_resueltas: 0,
    racha_dias: 0,
    tiempo_total_horas: 0,
  },
};

const NIVEL_CARGO_LABEL: Record<string, string> = {
  directivo: 'Directivo',
  asesor: 'Asesor',
  ejecutivo: 'Ejecutivo',
  profesional: 'Profesional',
  tecnico: 'Técnico',
  administrativo: 'Administrativo',
  operativo: 'Operativo',
};

function generarIniciales(nombre: string): string {
  if (!nombre) return 'A';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function humanizarFechaExamen(isoDate: string | null): string {
  if (!isoDate) return 'Por definir';
  const fecha = new Date(isoDate);
  if (Number.isNaN(fecha.getTime())) return 'Por definir';
  return fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
  });
}

function calcularRachaDias(fechasRespuestas: string[]): number {
  if (fechasRespuestas.length === 0) return 0;
  const dias = [
    ...new Set(
      fechasRespuestas
        .map((f) => new Date(f).toISOString().slice(0, 10))
        .filter((d) => d.length === 10)
    ),
  ].sort((a, b) => b.localeCompare(a));
  if (dias.length === 0) return 0;
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dias[0] !== hoy && dias[0] !== ayer) return 0;
  let racha = 1;
  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]);
    const curr = new Date(dias[i]);
    const diffDias = (prev.getTime() - curr.getTime()) / 86_400_000;
    if (diffDias === 1) racha += 1;
    else break;
  }
  return racha;
}

interface FilaRespuesta {
  created_at: string;
  tiempo_respuesta_ms: number | null;
}

export async function obtenerPerfilUsuario(): Promise<PerfilUsuario> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return PERFIL_DEFAULT;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return PERFIL_DEFAULT;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nombreMeta = typeof meta.nombre === 'string' ? meta.nombre : null;
    const nombrePorEmail = user.email
      ? user.email.split('@')[0].split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      : 'Aspirante';
    const nombre = nombreMeta?.trim() || nombrePorEmail;

    const [{ data: perfil }, { data: respuestas }] = await Promise.all([
      supabase
        .from('usuarios')
        .select('lead_id, profesion, nivel_cargo, fecha_examen, telegram_chat_id')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('respuestas_preguntas')
        .select('created_at, tiempo_respuesta_ms')
        .eq('user_id', user.id),
    ]);

    let cargoAspira = PERFIL_DEFAULT.cargo_aspira;
    if (perfil?.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('cargo_aspira')
        .eq('id', perfil.lead_id)
        .maybeSingle();
      if (lead?.cargo_aspira) cargoAspira = lead.cargo_aspira;
    }

    const filas = (respuestas ?? []) as FilaRespuesta[];
    const fechas = filas.map((f) => f.created_at);
    const diasActivos = new Set(
      fechas.map((f) => new Date(f).toISOString().slice(0, 10))
    ).size;
    const preguntas_resueltas = filas.length;
    const racha_dias = calcularRachaDias(fechas);
    const tiempo_ms = filas.reduce((acc, f) => acc + (f.tiempo_respuesta_ms ?? 0), 0);
    const tiempo_total_horas = Math.round((tiempo_ms / (1000 * 60 * 60)) * 10) / 10;

    return {
      nombre,
      iniciales: generarIniciales(nombre),
      email: user.email ?? '',
      cargo_aspira: cargoAspira,
      nivel_cargo:
        NIVEL_CARGO_LABEL[perfil?.nivel_cargo ?? ''] ?? PERFIL_DEFAULT.nivel_cargo,
      profesion: perfil?.profesion?.trim() || PERFIL_DEFAULT.profesion,
      fecha_examen_humana: humanizarFechaExamen(perfil?.fecha_examen ?? null),
      telegram_conectado: Boolean(perfil?.telegram_chat_id),
      estadisticas: {
        dias_activos: diasActivos,
        preguntas_resueltas,
        racha_dias,
        tiempo_total_horas,
      },
    };
  } catch (error) {
    console.warn('[Perfil] obtenerPerfilUsuario falló:', error);
    return PERFIL_DEFAULT;
  }
}

// ============================================================
// Vinculación con Telegram (deep-link)
//
// Genera la URL https://t.me/<bot_username>?start=<user_id> que abre
// el bot con el comando /start <user_id> precargado. El webhook valida
// el user_id contra la tabla `usuarios` y guarda el chat_id de Telegram
// en `usuarios.telegram_chat_id`.
//
// Si el bot username no está configurado o no se puede obtener vía
// getMe(), devuelve { ok: false } y la UI muestra mensaje de fallback.
// ============================================================

export interface LinkVinculacion {
  ok: boolean;
  url?: string;
  yaConectado?: boolean;
  motivo?: string;
}

export async function obtenerLinkVinculacionTelegram(): Promise<LinkVinculacion> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, motivo: 'No autenticado' };
    }

    // ¿Ya está vinculado?
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('telegram_chat_id')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil?.telegram_chat_id) {
      return { ok: true, yaConectado: true };
    }

    const username = await obtenerBotUsername();
    if (!username) {
      return {
        ok: false,
        motivo: 'El bot de Telegram no está configurado. Contacta soporte.',
      };
    }

    // El user.id (UUID v4) sirve como token de vinculación. No es
    // secreto pero tampoco enumerable trivialmente. Lo importante es
    // que el webhook valide que existe en `usuarios` antes de vincular.
    return {
      ok: true,
      yaConectado: false,
      url: `https://t.me/${username}?start=${user.id}`,
    };
  } catch (error) {
    console.warn('[Telegram] obtenerLinkVinculacionTelegram error:', error);
    return { ok: false, motivo: 'Error generando link de vinculación' };
  }
}
