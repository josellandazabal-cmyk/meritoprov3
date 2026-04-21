// ============================================================
// MéritoPro V3 — Configuración Resend (Agente 3: Remarketing)
// ============================================================

import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurado en .env.local');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía un email vía Resend.
 */
export async function enviarEmail(params: EmailParams): Promise<boolean> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: 'MéritoPro <noreply@meritopro.co>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[Resend] Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Resend] Error enviando email:', error);
    return false;
  }
}

/**
 * Genera HTML de email para remarketing.
 */
export function generarEmailRemarketing(
  nombre: string,
  asunto: string,
  body: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding:32px 32px 24px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">
          Mérito<span style="color:#facc15;">Pro</span>
        </span>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#0f172a;margin:0 0 8px;font-weight:600;">
          Hola ${nombre},
        </p>
        <p style="font-size:15px;color:#64748b;line-height:1.7;margin:0 0 24px;">
          ${body}
        </p>
        <a href="https://meritopro.co" 
           style="display:inline-block;padding:14px 28px;background-color:#facc15;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Retomar mi preparación →
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:24px 32px;background-color:#0f172a;color:#94a3b8;font-size:12px;">
        <p style="margin:0 0 4px;">MéritoPro — Concurso PGN 2026</p>
        <p style="margin:0;">© ${new Date().getFullYear()} Todos los derechos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Genera HTML de email para píldora de repaso.
 */
export function generarEmailRepaso(
  nombre: string,
  pregunta: string,
  tema: string,
  norma: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="padding:32px 32px 24px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:20px;font-weight:800;color:#0f172a;">
          Mérito<span style="color:#facc15;">Pro</span>
        </span>
        <span style="float:right;font-size:13px;color:#64748b;">🧠 Repaso Diario</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#0f172a;margin:0 0 16px;font-weight:600;">
          ${nombre}, tu cerebro necesita repasar esto:
        </p>
        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:0 0 16px;">
          <p style="font-size:12px;color:#4f46e5;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">
            📋 ${tema}
          </p>
          <p style="font-size:15px;color:#0f172a;line-height:1.7;margin:0 0 12px;">
            ${pregunta}
          </p>
          <p style="font-size:13px;color:#4f46e5;font-weight:600;margin:0;">
            📜 ${norma}
          </p>
        </div>
        <a href="https://meritopro.co/dashboard/entrenar"
           style="display:inline-block;padding:14px 28px;background-color:#facc15;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Practicar ahora →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;background-color:#0f172a;color:#94a3b8;font-size:12px;">
        <p style="margin:0;">MéritoPro — Tu curva del olvido no espera.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
