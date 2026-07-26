import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/env.js';
import { logger } from '../../http/logger.js';
import { GRABBER_LOGO_PNG_B64, GRABBER_HEADER_PNG_B64 } from './assets.js';

/**
 * Correo de Grabber. En producción sale por Resend (acmsy inyecta
 * RESEND_API_KEY y MAIL_FROM); en local, sin clave, se escribe a disco bajo
 * DOWNLOAD_ROOT/.mail para poder inspeccionarlo.
 *
 * OJO: se lee de process.env en cada envío (no se cachea al importar) porque
 * en el contenedor las variables se aplican al ARRANCAR, no al construir.
 */
export interface Mail {
  to: string;
  subject: string;
  /** versión en texto plano (siempre) */
  body: string;
  /** versión HTML con la identidad de la app (opcional) */
  html?: string;
  attachments?: Array<{ filename: string; content: string; content_id?: string; content_type?: string }>;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function sender(): string {
  const address = process.env.MAIL_FROM || 'noreply@acmsy.com';
  const name = process.env.MAIL_FROM_NAME || 'Grabber';
  return address.includes('<') ? address : `${name} <${address}>`;
}

export async function sendMail(mail: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const payload: Record<string, unknown> = {
        from: sender(),
        to: [mail.to],
        subject: mail.subject,
        text: mail.body,
      };
      if (mail.html) payload.html = mail.html;
      if (mail.attachments?.length) payload.attachments = mail.attachments;
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Resend respondió ${res.status}`);
      logger.info({ to: mail.to, subject: mail.subject, id: data.id }, 'correo enviado (Resend)');
      return;
    } catch (err) {
      logger.error({ err, to: mail.to }, 'fallo al enviar por Resend');
      throw err;
    }
  }

  // Sin clave (local): se escribe a disco para poder leerlo.
  const dir = path.join(config.downloadRoot, '.mail');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${stamp}-${mail.to.replace(/[^a-z0-9@.]/gi, '_')}.txt`);
  const content = `Para: ${mail.to}\nAsunto: ${mail.subject}\nFecha: ${new Date().toISOString()}\n\n${mail.body}\n`;
  await writeFile(file, content, 'utf8');
  logger.info({ to: mail.to, subject: mail.subject, file }, 'correo escrito a disco (sin RESEND_API_KEY)');
}

/* ————————————————— identidad visual de los correos —————————————————
   Solo tablas + estilos EN LÍNEA (lo único que respetan Gmail/Outlook).
   Paleta de la app: lienzo #0A0A0A, superficie #141414, acento rosa #FA05A0.
   El logo viaja incrustado (cid) para que se vea sin servidor público. */

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const ACCENT = '#FA05A0';
const CANVAS = '#0A0A0A';
const SURFACE = '#141414';
const RAISED = '#1C1C1C';
const TEXT = '#F2F0ED';
const MUTED = '#8A8A8A';

const logoAttachment = () => [
  {
    filename: 'grabber.png',
    content: GRABBER_LOGO_PNG_B64,
    content_id: 'grabberlogo',
    content_type: 'image/png',
  },
  {
    filename: 'grabber-deco.png',
    content: GRABBER_HEADER_PNG_B64,
    content_id: 'grabberdeco',
    content_type: 'image/png',
  },
];

/**
 * Envoltorio de marca: fondo oscuro, tarjeta con franja de acento arriba,
 * la G del logo SIN fondo ni recuadro (PNG transparente) junto al wordmark, y
 * pie con las plataformas. Todo con tablas + estilos en línea (email-safe).
 */
function shell(preheader: string, inner: string): string {
  const chip = (t: string) =>
    `<td style="padding:0 3px;"><span style="display:inline-block;font-family:${FONT};font-size:10.5px;font-weight:500;color:${MUTED};background:${RAISED};padding:5px 10px;border-radius:999px;">${t}</span></td>`;
  return `<div style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS};">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}" style="background:${CANVAS};">
    <tr><td align="center" style="padding:40px 16px;">

      <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="width:100%;max-width:520px;background:${SURFACE};border-radius:22px;overflow:hidden;font-family:${FONT};">
        <!-- banda decorativa: las mismas formas del login (imagen, porque los
             clientes de correo no rotan formas por CSS) -->
        <tr><td style="line-height:0;font-size:0;">
          <img src="cid:grabberdeco" width="520" alt="" style="display:block;width:100%;max-width:520px;height:auto;border:0;">
        </td></tr>

        <!-- marca: la G del logo (transparente) + "rabber" -->
        <tr><td align="center" style="padding:26px 34px 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
            <td style="line-height:0;padding-right:7px;vertical-align:middle;"><img src="cid:grabberlogo" width="30" height="30" alt="" style="display:block;border:0;background:transparent;"></td>
            <td style="font-family:${FONT};font-size:26px;font-weight:600;color:${TEXT};letter-spacing:-0.02em;vertical-align:middle;">rabber</td>
          </tr></table>
        </td></tr>

        <tr><td align="center" style="padding:22px 34px 34px;">${inner}</td></tr>

        <!-- pie: plataformas + firma -->
        <tr><td align="center" bgcolor="${RAISED}" style="background:${RAISED};padding:20px 24px;border-top:1px solid #232323;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;"><tr>
            ${chip('YouTube')}${chip('Instagram')}${chip('TikTok')}${chip('X')}
          </tr></table>
          <div style="font-family:${FONT};font-size:11.5px;line-height:1.6;color:#6A6A6A;">Grabber · Descarga y archiva tu video.</div>
        </td></tr>
      </table>

      <div style="font-family:${FONT};font-size:11px;color:#4A4A4A;margin-top:14px;">Recibiste este correo porque tienes una cuenta en Grabber.</div>
    </td></tr>
  </table>
</div>`;
}

/** Botón "a prueba de balas" (color por bgcolor, funciona hasta en Outlook). */
function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
    <td align="center" bgcolor="${ACCENT}" style="background:${ACCENT};border-radius:12px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:#0F0F0F;text-decoration:none;">${label}</a>
    </td>
  </tr></table>`;
}

function title(t: string): string {
  return `<div style="font-family:${FONT};font-size:23px;font-weight:600;color:${TEXT};letter-spacing:-0.02em;margin:0 0 12px;">${t}</div>`;
}
function para(t: string): string {
  return `<p style="margin:0 auto 14px;max-width:390px;font-family:${FONT};font-size:15px;line-height:1.62;color:${MUTED};">${t}</p>`;
}
/** Separador fino con un punto de acento en medio (decoración discreta). */
function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 20px;"><tr>
    <td style="border-top:1px solid #232323;font-size:0;line-height:0;">&nbsp;</td>
    <td width="26" align="center" style="line-height:0;"><span style="display:inline-block;width:5px;height:5px;border-radius:999px;background:${ACCENT};"></span></td>
    <td style="border-top:1px solid #232323;font-size:0;line-height:0;">&nbsp;</td>
  </tr></table>`;
}

/** Código de verificación de la cuenta. */
export function verificationMail(to: string, code: string): Mail {
  const inner =
    title('Verifica tu correo') +
    para('Usa este código para confirmar tu cuenta de Grabber. Caduca en 15 minutos.') +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 6px;"><tr>
       <td align="center" bgcolor="${RAISED}" style="background:${RAISED};border-radius:14px;padding:18px 30px;font-family:${FONT};font-size:32px;font-weight:700;letter-spacing:.22em;color:${ACCENT};">${code}</td>
     </tr></table>` +
    `<p style="margin:22px auto 0;max-width:390px;font-family:${FONT};font-size:13px;line-height:1.6;color:#5A5A5A;">Si no creaste una cuenta en Grabber, ignora este correo.</p>`;
  return {
    to,
    subject: 'Tu código de verificación de Grabber',
    body: `Tu código de verificación es: ${code}\n\nCaduca en 15 minutos. Si no creaste una cuenta en Grabber, ignora este correo.`,
    html: shell('Tu código de verificación de Grabber caduca en 15 minutos.', inner),
    attachments: logoAttachment(),
  };
}

/** Restablecimiento de contraseña. */
export function passwordResetMail(to: string, token: string): Mail {
  const link = `${config.origin}/?token=${token}`;
  const inner =
    title('Restablece tu contraseña') +
    para('Recibimos una solicitud para cambiar la contraseña de tu cuenta. Pulsa el botón para crear una nueva; el enlace caduca en 30 minutos.') +
    `<div style="margin-top:28px;">${button('Crear nueva contraseña', link)}</div>` +
    `<p style="margin:18px 0 0;font-family:${FONT};font-size:12.5px;color:#6A6A6A;">El enlace caduca en 30 minutos.</p>` +
    divider() +
    `<p style="margin:0 auto 7px;max-width:390px;font-family:${FONT};font-size:12px;color:#5A5A5A;">Si el botón no abre, copia y pega este enlace:</p>` +
    `<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;word-break:break-all;"><a href="${link}" style="color:${ACCENT};text-decoration:none;">${link}</a></p>` +
    `<p style="margin:22px auto 0;max-width:390px;font-family:${FONT};font-size:13px;line-height:1.6;color:#5A5A5A;">Si no fuiste tú, ignora este correo: tu contraseña seguirá igual.</p>`;
  return {
    to,
    subject: 'Restablece tu contraseña de Grabber',
    body: `Usa este enlace para restablecer tu contraseña:\n\n${link}\n\nCaduca en 30 minutos. Si no lo pediste, ignora este correo.`,
    html: shell('Crea una nueva contraseña para tu cuenta de Grabber.', inner),
    attachments: logoAttachment(),
  };
}

/** Aviso, 3 días antes, de que la suscripción se renovará automáticamente. */
export function upcomingChargeMail(
  to: string,
  name: string,
  planLabel: string,
  amount: string,
  date: string,
): Mail {
  const hola = name ? ` ${name.split(/\s+/)[0]}` : '';
  const row = (l: string, v: string) =>
    `<tr><td style="font-family:${FONT};font-size:13.5px;color:${MUTED};padding:7px 0;">${l}</td>
         <td align="right" style="font-family:${FONT};font-size:13.5px;font-weight:600;color:${TEXT};padding:7px 0;">${v}</td></tr>`;
  const inner =
    title('Tu plan se renueva pronto') +
    para(`Hola${hola}, en <strong style="color:${TEXT};">3 días</strong> renovaremos tu plan automáticamente y cobraremos el monto a tu método de pago guardado.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${RAISED}" style="background:${RAISED};border-radius:14px;margin-top:8px;">
       <tr><td style="padding:14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
         ${row('Plan', planLabel)}${row('Monto', amount)}${row('Fecha del cobro', date)}
       </table></td></tr>
     </table>` +
    `<div style="margin-top:26px;">${button('Ver mi suscripción', `${config.origin}/#/ajustes/plan`)}</div>` +
    `<p style="margin:24px auto 0;max-width:390px;font-family:${FONT};font-size:13px;line-height:1.6;color:#5A5A5A;">¿No quieres renovar? Cancela la renovación desde Ajustes → Plan antes de esa fecha y no se hará ningún cobro.</p>`;
  return {
    to,
    subject: `Tu plan ${planLabel} se renueva en 3 días`,
    body:
      `Hola${hola}, en 3 días renovaremos tu plan de Grabber automáticamente.\n\n` +
      `Plan: ${planLabel}\nMonto: ${amount}\nFecha del cobro: ${date}\n\n` +
      `Si no quieres renovar, cancela la renovación automática desde Ajustes → Plan antes de esa fecha.`,
    html: shell(`Tu plan ${planLabel} se renovará el ${date} por ${amount}.`, inner),
    attachments: logoAttachment(),
  };
}
