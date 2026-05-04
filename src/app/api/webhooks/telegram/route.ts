// ============================================================
// AGENTE 2 (Telegram) — Webhook Inbound + Asesor Conversacional
//
// Recibe mensajes del usuario y los rutea a:
//   1. Vinculación: /start <UUID> o un UUID suelto
//   2. Comandos rápidos: /ayuda, /stats, /diagnostico, /pregunta, /inscripcion
//   3. Respuesta Likert (un dígito 1-5) → evalúa con MOTIVADOR
//   4. Texto libre → CONSERJE con RAG + datos del proceso + stats personales
//
// Diseño: el bot NO es solo un Motivador (eso era restrictivo). Es un
// conserje que acompaña al aspirante en su día a día — consultas
// normativas, dudas del proceso, refuerzo conceptual, reporte de avance.
// ============================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { llamarAgente } from '@/lib/ia/anthropic';
import {
  SYSTEM_PROMPT_MOTIVADOR_V4,
  SYSTEM_PROMPT_ASESOR_TELEGRAM,
} from '@/lib/ia/prompts';
import {
  enviarMensajeTelegram,
  TECLADO_PRINCIPAL,
  BOTONES_TEXTO,
} from '@/lib/omnichannel/telegram';
import { buscarCorpusLegal } from '@/lib/rag/corpus';
import {
  CONCURSO_PGN_2026,
  estadoInscripciones,
} from '@/lib/concurso/datos-oficiales';

const FRASE_RECHAZO_LITERAL =
  'No se encuentra jurisprudencia o norma verificada para esta consulta. No puedo especular.';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UsuarioVinculado {
  id: string;
  cargo_aspira: string;
  nivel_cargo: string;
  profesion: string;
}

// ============================================================
// HELPERS
// ============================================================

async function obtenerUsuarioPorChat(
  supabase: ReturnType<typeof createAdminClient>,
  chatId: string
): Promise<UsuarioVinculado | null> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, lead_id, profesion, nivel_cargo')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  if (!usuario) return null;

  let cargoAspira = '';
  if (usuario.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('cargo_aspira')
      .eq('id', usuario.lead_id)
      .maybeSingle();
    cargoAspira = lead?.cargo_aspira ?? '';
  }

  return {
    id: usuario.id,
    cargo_aspira: cargoAspira || 'Por definir',
    nivel_cargo: usuario.nivel_cargo ?? 'profesional',
    profesion: usuario.profesion ?? '',
  };
}

interface StatsUsuario {
  total_respuestas: number;
  porcentaje_acierto: number;
  diagnostico_inicial: number;
  delta_progreso: number;
  modulos_debiles: string[];
  modulos_fuertes: string[];
}

async function obtenerStatsUsuario(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<StatsUsuario> {
  const { data: respuestas } = await supabase
    .from('respuestas_preguntas')
    .select('pregunta_id, correcta, sesion_tipo')
    .eq('user_id', userId)
    .in('sesion_tipo', ['diagnostico', 'entrenamiento']);

  const filas = (respuestas ?? []) as Array<{
    pregunta_id: string;
    correcta: boolean;
    sesion_tipo: string;
  }>;

  if (filas.length === 0) {
    return {
      total_respuestas: 0,
      porcentaje_acierto: 0,
      diagnostico_inicial: 0,
      delta_progreso: 0,
      modulos_debiles: [],
      modulos_fuertes: [],
    };
  }

  const diag = filas.filter((f) => f.sesion_tipo === 'diagnostico');
  const diagnosticoInicial =
    diag.length > 0
      ? Math.round((diag.filter((f) => f.correcta).length / diag.length) * 100)
      : 0;
  const porcentajeAcierto = Math.round(
    (filas.filter((f) => f.correcta).length / filas.length) * 100
  );

  // Agrupar por slug (extraer del pregunta_id formato slug::uuid)
  const porSlug = new Map<string, { total: number; correctas: number }>();
  for (const f of filas) {
    const slug = f.pregunta_id.includes('::')
      ? f.pregunta_id.split('::')[0]
      : 'general';
    const bucket = porSlug.get(slug) ?? { total: 0, correctas: 0 };
    bucket.total += 1;
    if (f.correcta) bucket.correctas += 1;
    porSlug.set(slug, bucket);
  }

  const moduloPct = [...porSlug.entries()].map(([slug, b]) => ({
    slug,
    pct: Math.round((b.correctas / b.total) * 100),
  }));
  moduloPct.sort((a, b) => a.pct - b.pct);

  const debiles = moduloPct
    .filter((m) => m.pct < 50)
    .slice(0, 3)
    .map((m) => `${m.slug.replace(/_/g, ' ')} (${m.pct}%)`);
  const fuertes = moduloPct
    .filter((m) => m.pct >= 70)
    .slice(0, 3)
    .map((m) => `${m.slug.replace(/_/g, ' ')} (${m.pct}%)`);

  return {
    total_respuestas: filas.length,
    porcentaje_acierto: porcentajeAcierto,
    diagnostico_inicial: diagnosticoInicial,
    delta_progreso: porcentajeAcierto - diagnosticoInicial,
    modulos_debiles: debiles,
    modulos_fuertes: fuertes,
  };
}

function formatearStatsParaTelegram(stats: StatsUsuario): string {
  if (stats.total_respuestas === 0) {
    return (
      `📊 *Tu estado actual*\n\n` +
      `Aún no has hecho el diagnóstico inicial.\n\n` +
      `Empieza en: meritopro.co/dashboard/diagnostico-inicial`
    );
  }

  const lineas = [
    `📊 *Tu estado actual*`,
    ``,
    `*Diagnóstico inicial:* ${stats.diagnostico_inicial}%`,
    `*Hoy:* ${stats.diagnostico_inicial + stats.delta_progreso}% (${stats.delta_progreso >= 0 ? '+' : ''}${stats.delta_progreso} pp)`,
    `*Preguntas respondidas:* ${stats.total_respuestas}`,
  ];

  if (stats.modulos_debiles.length > 0) {
    lineas.push(``, `⚠ *Módulos débiles:*`);
    stats.modulos_debiles.forEach((m) => lineas.push(`• ${m}`));
  }
  if (stats.modulos_fuertes.length > 0) {
    lineas.push(``, `✓ *Módulos fuertes:*`);
    stats.modulos_fuertes.forEach((m) => lineas.push(`• ${m}`));
  }

  return lineas.join('\n');
}

function formatearInscripcion(): string {
  const estado = estadoInscripciones();
  return [
    `📝 *Inscripciones — Concurso PGN 2026*`,
    ``,
    `${estado.mensajeLargo}`,
    ``,
    `*Fechas:* ${CONCURSO_PGN_2026.inscripciones.rango}`,
    `*Horario:* ${CONCURSO_PGN_2026.inscripciones.horarioInicio} a ${CONCURSO_PGN_2026.inscripciones.horarioFin}`,
    `*Total vacantes:* ${CONCURSO_PGN_2026.totalVacantes.toLocaleString('es-CO')}`,
    ``,
    `*Sitios oficiales:*`,
    `• Operador (UdeA): ${CONCURSO_PGN_2026.sitiosOficiales.operador}`,
    `• PGN: ${CONCURSO_PGN_2026.sitiosOficiales.procuraduria}`,
    ``,
    `_Pasos detallados en meritopro.co/dashboard_`,
  ].join('\n');
}

const COMANDOS_AYUDA = [
  `📚 *Cómo usarme — Asesor MéritoPro*`,
  ``,
  `Usa los *botones* abajo del teclado para acciones rápidas:`,
  ``,
  `📊 *Mi progreso* — Tu nivel inicial vs hoy y módulos débiles`,
  `📝 *Inscripciones* — Fechas, vacantes y sitios oficiales`,
  `❓ *Hacer una consulta* — Te explico cómo preguntar`,
  ``,
  `*También puedes escribirme libremente:*`,
  `• "¿Qué dice la Ley 1952 sobre faltas gravísimas?"`,
  `• "Explícame el Art. 38 del CGD"`,
  `• "¿Cuándo cierran las inscripciones?"`,
  `• "¿Cómo me preparo para la prueba comportamental?"`,
  ``,
  `_Cuando te llegue una píldora de repaso, responde con un número (1-5) o con la letra (A-E) y la evalúo._`,
].join('\n');

const TUTORIAL_CONSULTA = [
  `❓ *¿Sobre qué quieres preguntarme?*`,
  ``,
  `Solo escríbeme tu duda en el chat. Algunos ejemplos:`,
  ``,
  `📜 *Sobre normas:*`,
  `• "¿Qué dice el Art. 26 de la Ley 1952?"`,
  `• "Explícame las faltas gravísimas"`,
  `• "Diferencia entre Ley 734 y Ley 1952"`,
  ``,
  `📅 *Sobre el concurso:*`,
  `• "¿Qué documentos necesito para inscribirme?"`,
  `• "¿Cuántos cargos hay disponibles?"`,
  `• "¿Cuánto vale la inscripción?"`,
  ``,
  `🎯 *Sobre tu preparación:*`,
  `• "¿En qué estoy fallando?"`,
  `• "¿Qué tema debería repasar primero?"`,
  ``,
  `_Si no tengo base verificada para tu consulta, te lo digo en lugar de inventar._`,
].join('\n');

// ============================================================
// CLASIFICACIÓN DE INTENCIÓN (heurística rápida + RAG si aplica)
// ============================================================

function esRespuestaLikert(texto: string): boolean {
  const t = texto.trim();
  return /^[1-5]$/.test(t);
}

function esRespuestaTipoIyIII(texto: string): boolean {
  const t = texto.trim().toUpperCase();
  // Letras A-E sueltas
  return /^[A-E]$/.test(t);
}

function esConsultaNormativa(texto: string): boolean {
  const t = texto.toLowerCase();
  // Heurística simple: si menciona normas, artículos, conceptos legales
  return (
    /\b(art(í)?culo|art\.|ley\s+\d|decreto|resoluci(ó)?n|sentencia|c(ó)?digo|c\.?p\.?|c\.?g\.?d\.?)/i.test(
      texto
    ) ||
    /\b(disciplinario|tutela|disciplinaria|administrativo|constitucional|procuraduría)\b/i.test(
      t
    ) ||
    /\b(qu(é|e)\s+(dice|establece|significa|es))\b/i.test(t) ||
    /\b(expl(í|i)came|expl(í|i)quem)\b/i.test(t)
  );
}

function esConsultaProceso(texto: string): boolean {
  const t = texto.toLowerCase();
  return /\b(inscripci(ó|o)n|fecha|cuando|cronograma|proceso|requisitos|examen|prueba|concurso|udea|universidad de antioquia|operador|costo|pago)\b/i.test(
    t
  );
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const userText = (message.text as string).trim();
    const userName = message.from?.first_name || 'Aspirante';
    const supabase = createAdminClient();

    // ============================================================
    // 1) VINCULACIÓN — /start <UUID> o UUID suelto
    // ============================================================
    const esStartConToken = userText.startsWith('/start ');
    const esUuidSuelto = UUID_REGEX.test(userText);

    if (esStartConToken || esUuidSuelto) {
      const token = esStartConToken ? userText.slice(7).trim() : userText;
      if (!UUID_REGEX.test(token)) {
        await enviarMensajeTelegram(
          chatId,
          `❌ El enlace de vinculación no es válido. Vuelve a tu perfil en MéritoPro y haz click en "Conectar Telegram" de nuevo.`
        );
        return NextResponse.json({ ok: true });
      }

      const { data: usuarioObjetivo } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', token)
        .maybeSingle();

      if (!usuarioObjetivo) {
        await enviarMensajeTelegram(
          chatId,
          `❌ No encontramos tu cuenta de MéritoPro. Asegúrate de estar registrado y vuelve a intentar la vinculación desde tu perfil.`
        );
        return NextResponse.json({ ok: true });
      }

      const { error: updateError } = await supabase
        .from('usuarios')
        .upsert(
          { id: token, telegram_chat_id: chatId },
          { onConflict: 'id' }
        );

      if (updateError) {
        console.error('[Telegram /start] DB error:', updateError.message);
        await enviarMensajeTelegram(
          chatId,
          `⚠️ Hubo un error guardando la vinculación. Intenta nuevamente desde tu perfil.`
        );
        return NextResponse.json({ ok: true });
      }

      await enviarMensajeTelegram(
        chatId,
        `✅ ¡Listo, ${userName}! Tu cuenta quedó vinculada.\n\n` +
          `Soy tu *Asesor MéritoPro*. Puedo:\n` +
          `• Enviarte píldoras de repaso diarias\n` +
          `• Evaluar tus respuestas al instante\n` +
          `• Responderte consultas normativas y del proceso\n\n` +
          `*Usa los botones abajo* para empezar — o pregúntame lo que necesites.`,
        { reply_markup: TECLADO_PRINCIPAL }
      );
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // 2) /start sin token → onboarding
    // ============================================================
    if (userText === '/start') {
      await enviarMensajeTelegram(
        chatId,
        `👋 Hola ${userName}, soy tu *Asesor MéritoPro*.\n\n` +
          `*Para vincular tu cuenta:*\n` +
          `1. Ve a *meritopro.co* → *Mi Perfil*\n` +
          `2. Click en "Conectar Telegram"\n` +
          `3. *O bien*, copia el código que aparece allí y pégalo aquí.\n\n` +
          `Una vez vinculado, podrás consultar tu progreso y hacerme preguntas sobre el concurso.`
      );
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // 3) Verificar vinculación para el resto de comandos
    // ============================================================
    const usuario = await obtenerUsuarioPorChat(supabase, chatId);

    if (!usuario) {
      await enviarMensajeTelegram(
        chatId,
        `Hola ${userName}, aún no he reconocido tu cuenta. Vincula desde *meritopro.co/dashboard/perfil* (botón "Conectar Telegram") o pega aquí el código que aparece allí.`
      );
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // 4) COMANDOS RÁPIDOS — slash-commands o botones del teclado
    //
    // Aceptamos AMBAS formas para cubrir tanto al usuario power
    // (/stats) como al usuario no técnico (botón "📊 Mi progreso").
    // ============================================================
    const esAyuda =
      userText === '/ayuda' ||
      userText === '/help' ||
      userText === BOTONES_TEXTO.AYUDA;
    if (esAyuda) {
      await enviarMensajeTelegram(chatId, COMANDOS_AYUDA, {
        reply_markup: TECLADO_PRINCIPAL,
      });
      return NextResponse.json({ ok: true });
    }

    const esStats =
      userText === '/stats' ||
      userText === '/diagnostico' ||
      userText === BOTONES_TEXTO.PROGRESO;
    if (esStats) {
      const stats = await obtenerStatsUsuario(supabase, usuario.id);
      await enviarMensajeTelegram(chatId, formatearStatsParaTelegram(stats), {
        reply_markup: TECLADO_PRINCIPAL,
      });
      return NextResponse.json({ ok: true });
    }

    const esInscripcion =
      userText === '/inscripcion' ||
      userText === '/inscripciones' ||
      userText === '/proceso' ||
      userText === BOTONES_TEXTO.INSCRIPCIONES;
    if (esInscripcion) {
      await enviarMensajeTelegram(chatId, formatearInscripcion(), {
        reply_markup: TECLADO_PRINCIPAL,
      });
      return NextResponse.json({ ok: true });
    }

    // Botón "❓ Hacer una consulta" → tutorial con ejemplos
    if (userText === BOTONES_TEXTO.CONSULTA) {
      await enviarMensajeTelegram(chatId, TUTORIAL_CONSULTA, {
        reply_markup: TECLADO_PRINCIPAL,
      });
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // 5) RESPUESTA A PÍLDORA — Likert (1-5) o letra (A-E)
    // ============================================================
    if (esRespuestaLikert(userText) || esRespuestaTipoIyIII(userText)) {
      const { data: ultimaFallada } = await supabase
        .from('respuestas_preguntas')
        .select('pregunta_id')
        .eq('user_id', usuario.id)
        .eq('correcta', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimaPreguntaFallada = ultimaFallada
        ? `Pregunta sobre: ${ultimaFallada.pregunta_id}`
        : 'Pregunta general de repaso SM-2';

      const userMessage = [
        `Aspirante "${userName}" (cargo: ${usuario.cargo_aspira}, nivel: ${usuario.nivel_cargo}).`,
        ``,
        `**Última pregunta que falló:**`,
        ultimaPreguntaFallada,
        ``,
        `**Su respuesta:** ${userText}`,
        ``,
        `Evalúa si su respuesta es correcta. Sé estricto. Cita norma exacta. ≤400 chars.`,
      ].join('\n');

      try {
        const evaluacion = await llamarAgente({
          systemPrompt: SYSTEM_PROMPT_MOTIVADOR_V4,
          userMessage,
          maxTokens: 400,
        });
        await enviarMensajeTelegram(chatId, evaluacion, {
          reply_markup: TECLADO_PRINCIPAL,
        });
      } catch {
        await enviarMensajeTelegram(
          chatId,
          `📝 Recibí tu respuesta. En este momento no puedo evaluarla. Revísala en meritopro.co/dashboard/entrenar`,
          { reply_markup: TECLADO_PRINCIPAL }
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // 6) TEXTO LIBRE → CONSERJE con RAG + datos del proceso + stats
    // ============================================================
    const bloquesContexto: string[] = [];

    // Contexto del usuario (siempre)
    bloquesContexto.push(
      `## contexto_usuario\n${JSON.stringify({
        cargo_aspira: usuario.cargo_aspira,
        nivel_cargo: usuario.nivel_cargo,
        profesion: usuario.profesion,
      })}`
    );

    // RAG: si la consulta parece normativa, busca corpus
    if (esConsultaNormativa(userText)) {
      try {
        const chunks = await buscarCorpusLegal(userText, 4);
        if (chunks && chunks.length > 0) {
          bloquesContexto.push(
            `## contexto_corpus (chunks RAG)\n` +
              chunks
                .map((c, i) => {
                  const ref = [c.norma, c.articulo, c.numeral]
                    .filter(Boolean)
                    .join(', ');
                  return `[${i + 1}] ${ref || c.documento}\n${c.contenido}`;
                })
                .join('\n\n')
          );
        }
      } catch (e) {
        console.warn('[Telegram] Error buscando corpus:', e);
      }
    }

    // Datos del proceso si la consulta parece sobre inscripción/concurso
    if (esConsultaProceso(userText)) {
      const estado = estadoInscripciones();
      bloquesContexto.push(
        `## contexto_proceso\n${JSON.stringify({
          inscripciones: CONCURSO_PGN_2026.inscripciones,
          totalVacantes: CONCURSO_PGN_2026.totalVacantes,
          sitiosOficiales: CONCURSO_PGN_2026.sitiosOficiales,
          resoluciones: {
            base: CONCURSO_PGN_2026.resolucionBase,
            correctiva: CONCURSO_PGN_2026.resolucionCorrectiva,
          },
          estadoActual: estado.mensajeLargo,
        })}`
      );
    }

    // Stats del usuario si pide algo relacionado
    if (
      /\b(mis|stats|progreso|avance|nivel|c(ó|o)mo voy|dominio|brecha|d(é|e)bil)\b/i.test(
        userText
      )
    ) {
      const stats = await obtenerStatsUsuario(supabase, usuario.id);
      bloquesContexto.push(`## stats_usuario\n${JSON.stringify(stats)}`);
    }

    // Si no hay corpus ni proceso ni stats relevantes y la pregunta no
    // es trivial, devolvemos rechazo literal en lugar de inventar.
    const tieneSoloContextoUsuario = bloquesContexto.length === 1;
    if (tieneSoloContextoUsuario && esConsultaNormativa(userText)) {
      await enviarMensajeTelegram(chatId, FRASE_RECHAZO_LITERAL, {
        reply_markup: TECLADO_PRINCIPAL,
      });
      return NextResponse.json({ ok: true });
    }

    const userMessage =
      bloquesContexto.join('\n\n') +
      `\n\n## consulta_usuario\n"${userText}"\n\nResponde según las reglas del Asesor (≤600 chars, formato Telegram).`;

    try {
      const respuesta = await llamarAgente({
        systemPrompt: SYSTEM_PROMPT_ASESOR_TELEGRAM,
        userMessage,
        maxTokens: 600,
      });
      await enviarMensajeTelegram(chatId, respuesta, {
        reply_markup: TECLADO_PRINCIPAL,
      });
    } catch (e) {
      console.error('[Telegram Asesor] Error en llamarAgente:', e);
      await enviarMensajeTelegram(
        chatId,
        `Hubo un error procesando tu consulta. Intenta de nuevo o pulsa "🆘 Ayuda".`,
        { reply_markup: TECLADO_PRINCIPAL }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Webhook Telegram] Error:', error);
    return NextResponse.json({ ok: true });
  }
}
