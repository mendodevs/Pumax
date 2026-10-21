const nodemailer = require('nodemailer');

/**
 * Envío de correos por SMTP (sirve para Gmail con contraseña de aplicación,
 * Brevo, Resend, SendGrid, Mailgun, etc.). Variables de entorno:
 *   SMTP_HOST, SMTP_PORT (587 por defecto), SMTP_USER, SMTP_PASS, MAIL_FROM, APP_URL
 *
 * Las funciones devuelven una promesa que NUNCA se rechaza: si el mail falla se
 * loguea y se resuelve en false, para que un problema de correo no rompa un
 * registro o un pedido de recuperación.
 */

const COLOR_MARCA = '#0b6623';

const configurado = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
};

// Escapa texto del usuario antes de meterlo en HTML
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

async function enviarMail({ to, subject, html, text }) {
  if (!to) return false;
  if (!configurado()) {
    console.warn(`[MAIL] SMTP no configurado: no se envió "${subject}" a ${to}`);
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text
    });
    return true;
  } catch (error) {
    console.error(`[MAIL] Error enviando "${subject}" a ${to}:`, error.message);
    return false;
  }
}

const plantilla = (titulo, cuerpo) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222">
  <h2 style="color:${COLOR_MARCA};margin:0 0 16px">Pumax</h2>
  <h3 style="margin:0 0 12px">${titulo}</h3>
  ${cuerpo}
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px">
  <p style="font-size:12px;color:#888">Este es un correo automático de Pumax.</p>
</div>`;

const boton = (href, texto) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:${COLOR_MARCA};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${esc(texto)}</a></p>`;

// enviarBienvenida({ to, negocio })
async function enviarBienvenida({ to, negocio }) {
  const appUrl = process.env.APP_URL || '';
  const html = plantilla(
    '¡Te damos la bienvenida!',
    `<p>Tu cuenta de <strong>${esc(negocio)}</strong> ya está lista. Desde Pumax podés gestionar productos, stock, clientes, pedidos y facturación.</p>
     ${appUrl ? boton(appUrl, 'Ingresar a Pumax') : ''}
     <p>Si no creaste esta cuenta, ignorá este correo.</p>`
  );
  return enviarMail({
    to,
    subject: '¡Bienvenido a Pumax!',
    html,
    text: `Tu cuenta de ${negocio} ya está lista en Pumax.`
  });
}

// enviarRecuperacion({ to, link })
async function enviarRecuperacion({ to, link }) {
  if (!configurado() && process.env.NODE_ENV === 'development') {
    console.log(`[MAIL][DEV] Link de recuperación para ${to}: ${link}`);
  }
  const html = plantilla(
    'Restablecer tu contraseña',
    `<p>Recibimos un pedido para restablecer la contraseña de tu cuenta. El enlace vence en 1 hora y sirve una sola vez.</p>
     ${boton(link, 'Elegir una contraseña nueva')}
     <p>Si no fuiste vos, ignorá este correo: tu contraseña actual no cambia.</p>`
  );
  return enviarMail({
    to,
    subject: 'Restablecer tu contraseña de Pumax',
    html,
    text: `Para elegir una contraseña nueva entrá a: ${link} (vence en 1 hora).`
  });
}

module.exports = { enviarMail, enviarBienvenida, enviarRecuperacion, esc, plantilla, boton, configurado };
