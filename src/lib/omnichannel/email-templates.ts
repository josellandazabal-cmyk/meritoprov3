// ============================================================
// Templates de email transaccional + secuencia post-diagnóstico
//
// Usa Resend ya wired en src/lib/omnichannel/resend.ts. Cada función
// formatea HTML + texto plano + asunto y delega el envío al cliente Resend.
//
// La secuencia de 7 días (post-diagnóstico) la dispara el cron
// /api/cron/remarketing — aquí están sólo las plantillas.
// ============================================================

import { Resend } from 'resend';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const FROM = process.env.RESEND_FROM_EMAIL ?? 'MéritoPro <hola@meritopro.co>';

function client() {
  const k = process.env.RESEND_API_KEY;
  if (!k || k.startsWith('re-tu-')) {
    throw new Error('[Resend] RESEND_API_KEY no configurada.');
  }
  return new Resend(k);
}

// HTML wrapper consistente para todos los emails
function envolver(titulo: string, contenidoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;max-width:600px">
        <tr><td style="padding:24px 28px 0">
          <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em">
            Mérito<span style="color:#ca8a04">Pro</span>
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 32px;line-height:1.6;font-size:15px;color:#0f172a">
          ${contenidoHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
          MéritoPro · Plataforma de preparación para concursos públicos en Colombia.
          <br>Si no quieres recibir más emails, <a href="${SITE}/configuracion/email" style="color:#ca8a04">desuscríbete aquí</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function boton(texto: string, url: string): string {
  return `<p style="margin:24px 0">
    <a href="${url}" style="display:inline-block;background:#facc15;color:#0f172a;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none">${texto}</a>
  </p>`;
}

// ============================================================
// 1. Email de bienvenida (post-pago)
// ============================================================

export async function enviarEmailBienvenida(params: {
  to: string;
  reference: string;
  cursoSlug: string;
}): Promise<void> {
  const html = envolver(
    'Tu plan está activo · MéritoPro',
    `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700">¡Bienvenido a MéritoPro!</h2>
    <p>Tu compra <strong>${params.reference}</strong> quedó confirmada y tu plan ya está activo.</p>
    <p>Lo que pasa ahora:</p>
    <ol style="padding-left:20px;line-height:1.8">
      <li><strong>Configura Telegram</strong> para recibir tu pregunta diaria al horario que elijas.</li>
      <li><strong>Programa el horario</strong> en que estudiarás cada día (recomendado 7:00 a.m.).</li>
      <li><strong>Empieza tu primera sesión</strong> hoy mismo — son 30 minutos y de una vez te ubica.</li>
    </ol>
    ${boton('Ir al panel y empezar', `${SITE}/dashboard/bienvenida?ref=${encodeURIComponent(params.reference)}`)}
    <p style="margin-top:24px;font-size:13px;color:#64748b">¿Dudas? Responde a este correo y te contesta una persona real (no un bot).</p>
    `
  );

  await client().emails.send({
    from: FROM,
    to: params.to,
    subject: 'Tu plan MéritoPro está activo',
    html,
    text: `¡Bienvenido a MéritoPro! Tu compra ${params.reference} está confirmada. Entra a ${SITE}/dashboard/bienvenida para empezar tu primera sesión.`,
  });
}

// ============================================================
// 2. Secuencia post-diagnóstico (7 días)
// ============================================================

export interface ParametrosSecuencia {
  to: string;
  nombre: string;
  cargoAspira: string;
  porcentajeProbabilidad: number;
  leadId: string;
}

const URLS = (leadId: string) => ({
  diagnostico: `${SITE}/diagnostico/${leadId}`,
  checkout: `${SITE}/checkout?lead_id=${leadId}`,
});

export async function enviarSecuenciaDia(
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
  p: ParametrosSecuencia
): Promise<void> {
  const u = URLS(p.leadId);

  const config: Record<number, { subject: string; html: string; text: string }> = {
    0: {
      subject: `${p.nombre}, aquí está tu resultado del diagnóstico`,
      html: envolver(
        'Tu resultado del diagnóstico',
        `<h2 style="margin:0 0 12px">Tu nivel inicial: ${p.porcentajeProbabilidad}%</h2>
         <p>Hola ${p.nombre}, completaste el diagnóstico de 40 preguntas. Tu probabilidad real de aprobar el concurso PGN 2026 hoy es <strong>${p.porcentajeProbabilidad}%</strong>. No es estimación — es tu tasa de aciertos sobre el corpus normativo verificado.</p>
         <p>El plan personalizado de MéritoPro te entrega un avance medible día a día con 30 minutos diarios — calibrado a tu cargo y a tus brechas reales. Detalles del plan:</p>
         ${boton('Ver mi plan personalizado', u.checkout)}`
      ),
      text: `Tu probabilidad de aprobar la PGN 2026 hoy: ${p.porcentajeProbabilidad}%. Activa tu plan: ${u.checkout}`,
    },
    1: {
      subject: 'El día que casi me rindo (caso real)',
      html: envolver(
        'El día que casi me rindo',
        `<h2 style="margin:0 0 12px">Carolina dio el examen 3 veces antes de pasar</h2>
         <p>Hola ${p.nombre},</p>
         <p>Carolina, abogada en Bogotá, intentó la PGN en 2018, 2020 y 2022. Estudió con PDFs, academias y grupos de WhatsApp. Las tres veces quedó "en lista pero no clasificó".</p>
         <p>En 2024 cambió el método: 30 min al día con Active Recall, citando la norma exacta en cada respuesta. Pasó.</p>
         <p>Lo que la diferenció no fue estudiar más. Fue estudiar distinto.</p>
         ${boton('Ver el caso completo', u.checkout)}`
      ),
      text: `Carolina pasó la PGN en su 4to intento cambiando el método. ${u.checkout}`,
    },
    2: {
      subject: 'El error #1 que cometen los aspirantes a la PGN',
      html: envolver(
        'El error #1',
        `<h2 style="margin:0 0 12px">"Estudio mucho pero no me siento listo"</h2>
         <p>El error es leer pasivamente. El cerebro humano no aprende leyendo — aprende recuperando.</p>
         <p>Esto se llama Active Recall, y junto con repetición espaciada (algoritmo SM-2) reduce 60% el tiempo necesario para retener información, según evidencia académica documentada.</p>
         <p>MéritoPro implementa exactamente eso: 10 preguntas al día que el sistema escoge para ti según tus brechas reales.</p>
         ${boton('Empezar a entrenar con método', u.checkout)}`
      ),
      text: `El error #1: leer pasivamente. La solución: Active Recall + SM-2. ${u.checkout}`,
    },
    3: {
      subject: '¿Cuántas horas perdiste en grupos de WhatsApp?',
      html: envolver(
        'La Trampa del Estudio Eterno',
        `<h2 style="margin:0 0 12px">73% de aspirantes a la PGN repite el concurso</h2>
         <p>No es porque no estudien suficiente. Es porque les vendieron el cuento de que dedicar 8 horas con un PDF era suficiente.</p>
         <p>Lo llamamos La Trampa del Estudio Eterno: información dispersa, sin método, sin medir tu nivel real.</p>
         <p>${p.nombre}, ¿cuántas horas perdiste el último mes en grupos de WhatsApp con "tips PGN" que nunca usaste?</p>
         ${boton('Salir de la trampa', u.checkout)}`
      ),
      text: `73% repite el concurso porque les vendieron método malo. ${u.checkout}`,
    },
    4: {
      subject: 'Por qué tu primer salario PGN paga 30 veces el programa',
      html: envolver(
        'ROI de MéritoPro',
        `<h2 style="margin:0 0 12px">Salario PGN para ${p.cargoAspira}: COP 5-7 M/mes</h2>
         <p>Inversión en MéritoPro: COP 297.000 (pago único, sin renovaciones).</p>
         <p>Tu primer mes en la PGN paga 17-23 veces el programa. Si te quedas en el cargo 1 año, son 200+ veces.</p>
         <p>La pregunta no es si MéritoPro es caro. Es si puedes permitirte NO presentarte preparada.</p>
         ${boton('Activar mi plan ahora', u.checkout)}`
      ),
      text: `Primer salario PGN para ${p.cargoAspira}: COP 5-7M. Programa: COP 297K. ROI: 17-23×.`,
    },
    5: {
      subject: '¿Tienes esta objeción? (las 5 más comunes respondidas)',
      html: envolver(
        '5 objeciones',
        `<h2 style="margin:0 0 12px">Las 5 dudas que nos hacen siempre</h2>
         <ol style="padding-left:20px;line-height:1.8">
           <li><strong>"No tengo tiempo."</strong> 30 min/día. Por Telegram al horario que elijas.</li>
           <li><strong>"¿La IA inventa cosas?"</strong> Cero. Cada respuesta cita Ley + Artículo. Si no hay base, el sistema se detiene.</li>
           <li><strong>"Es caro."</strong> Pago único de COP 297.000 con doble garantía.</li>
           <li><strong>"No sé tecnología."</strong> Si usas WhatsApp, usas MéritoPro.</li>
           <li><strong>"Y si no clasifico?"</strong> 50% de descuento en cualquier curso del Marketplace por 12 meses.</li>
         </ol>
         ${boton('Resolver mis dudas con un humano', u.checkout)}`
      ),
      text: 'Las 5 objeciones más comunes respondidas. Activa tu plan o responde este email.',
    },
    6: {
      subject: 'La oferta beta cierra mañana',
      html: envolver(
        'Cierra mañana',
        `<h2 style="margin:0 0 12px;color:#b91c1c">Quedan menos de 24 horas</h2>
         <p>${p.nombre}, después de mañana la cohorte beta se cierra y el precio sube de <s style="color:#94a3b8">COP 297.000</s> a <strong>COP 397.000</strong>.</p>
         <p>No es marketing — es mantener la cohorte beta pequeña para dar soporte real a los primeros usuarios.</p>
         ${boton('Asegurar mi cupo beta', u.checkout)}
         <p style="margin-top:24px;font-size:13px;color:#64748b">Si decides no entrar, igualmente puedes seguir usando el diagnóstico gratuito y los recursos públicos. Nada se cierra para ti.</p>`
      ),
      text: 'La cohorte beta cierra mañana. Después el precio sube a COP 397.000.',
    },
    7: {
      subject: `Última llamada: tu lugar en la PGN 2026, ${p.nombre}`,
      html: envolver(
        'Última llamada',
        `<h2 style="margin:0 0 12px">Es tu decisión</h2>
         <p>Hola ${p.nombre}, este es el último email de esta serie.</p>
         <p>Hicimos el diagnóstico. Te mostramos el método. Te dimos los datos. Aquí no hay más argumentos por dar — sólo una decisión.</p>
         <p>Si activas hoy: el plan personalizado arranca esta misma noche, con la primera píldora SM-2 mañana a primera hora.</p>
         <p>Si no: mucha suerte de todas formas. La PGN 2026 va a ser competida y mereces presentarte sintiéndote lista.</p>
         ${boton('Activar mi plan ahora', u.checkout)}`
      ),
      text: 'Es tu decisión. La cohorte beta sigue abierta sólo unas horas más.',
    },
  };

  const c = config[dia];
  if (!c) return;
  await client().emails.send({
    from: FROM,
    to: p.to,
    subject: c.subject,
    html: c.html,
    text: c.text,
  });
}
