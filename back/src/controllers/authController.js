const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op, QueryTypes } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const sequelize = require('../config/database');
const { Negocio, Usuario, Empleado, Sesion, Configuracion } = require('../models');
const mailer = require('../services/mailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const DIAS_SESION = 7;
const HORAS_TOKEN_RECUPERACION = 1;

const googleClient = new OAuth2Client();
// En Expo cada plataforma (web, android, ios) tiene su propio client id: van separados por coma
const googleAudience = () =>
  (process.env.GOOGLE_CLIENT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

// Configuración que necesita cada negocio nuevo (mismos valores que el negocio original)
const CONFIG_INICIAL = [
  ['margen_ganancia_default', '20', 'Margen de ganancia por defecto (%)', 'NUMBER'],
  ['descuento_mayorista_default', '10', 'Descuento por defecto para mayoristas (%)', 'NUMBER'],
  ['descuento_minorista_default', '5', 'Descuento por defecto para minoristas (%)', 'NUMBER'],
  ['stock_minimo_alerta', '10', 'Cantidad mínima de stock para alerta', 'NUMBER'],
  ['iva_general', '21', 'IVA general (%)', 'NUMBER'],
  ['iva_reducido', '10.5', 'IVA reducido (%)', 'NUMBER'],
  ['punto_venta', '00001', 'Punto de venta para facturación', 'STRING'],
  ['backup_frecuencia_dias', '7', 'Frecuencia de backups en días', 'NUMBER']
];

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const normalizarEmail = (e) => String(e || '').trim().toLowerCase();

// username es VARCHAR(50) y único: si el email no entra, se recorta y se le suma un sufijo
const usernameDesdeEmail = (email) =>
  email.length <= 50 ? email : `${email.slice(0, 43)}-${crypto.randomBytes(3).toString('hex')}`;

async function crearSesion(usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + DIAS_SESION);
  await Sesion.create({
    usuario_id: usuarioId,
    token,
    fecha_expiracion: fechaExpiracion,
    activo: true
  });
  return token;
}

// Misma forma de respuesta que /usuarios/login: { success, data, token }
async function responderConSesion(res, status, usuarioId, extra = {}) {
  const token = await crearSesion(usuarioId);
  const usuario = await Usuario.findByPk(usuarioId, {
    sinTenant: true,
    attributes: { exclude: ['password_hash'] },
    include: [{
      model: Empleado,
      as: 'empleado',
      attributes: ['id', 'nombre', 'apellido', 'dni', 'cargo']
    }]
  });
  return res.status(status).json({ success: true, data: usuario, token, ...extra });
}

// Nombre y apellido para la ficha: lo que mande el formulario o Google; si falta, se deduce del email
function nombrePersona({ nombre, apellido, email }) {
  const limpiar = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  let n = limpiar(nombre);
  const a = limpiar(apellido);
  if (!n) {
    const local = String(email || '').split('@')[0].replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g, ' ').trim();
    n = limpiar(local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Propietario');
  }
  return { nombre: n, apellido: a };
}

// Negocio + ficha del propietario + super administrador + configuración inicial, todo o nada
async function crearNegocioConSuperAdmin({ nombreNegocio, email, passwordHash, proveedor, aceptaPromociones, nombre, apellido }) {
  const t = await sequelize.transaction();
  try {
    const negocio = await Negocio.create({ nombre: nombreNegocio }, { transaction: t });

    // Ficha de empleado del propietario: sin ella "Mi cuenta" no deja guardar datos personales.
    // El DNI es provisional; un administrador puede cargar el real desde Administrar usuarios.
    const persona = nombrePersona({ nombre, apellido, email });
    const ficha = await Empleado.create({
      negocio_id: negocio.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      dni: '00000000',
      email,
      cargo: 'Propietario',
      fecha_ingreso: new Date()
    }, { transaction: t });

    const usuario = await Usuario.create({
      negocio_id: negocio.id,
      empleado_id: ficha.id,
      username: usernameDesdeEmail(email),
      email,
      password_hash: passwordHash,
      rol: 'SUPERADMIN',
      proveedor_auth: proveedor,
      email_verificado: proveedor === 'GOOGLE',
      acepta_promociones: Boolean(aceptaPromociones),
      activo: true
    }, { transaction: t });

    await Configuracion.bulkCreate(
      CONFIG_INICIAL.map(([clave, valor, descripcion, tipo_dato]) => ({
        negocio_id: negocio.id, clave, valor, descripcion, tipo_dato
      })),
      { transaction: t }
    );

    await t.commit();
    return usuario;
  } catch (error) {
    if (!t.finished) await t.rollback();
    throw error;
  }
}

const esDuplicado = (error) => error.name === 'SequelizeUniqueConstraintError';

// ============================================
// POST /api/auth/register
// Body: { nombre_negocio, email, password, nombre?, apellido?, acepta_promociones? }
// Crea el negocio y su super administrador.
// ============================================
exports.register = async (req, res) => {
  try {
    const email = normalizarEmail(req.body.email);
    const password = String(req.body.password || '');
    const nombreNegocio = String(req.body.nombre_negocio || '').trim().slice(0, 150);

    if (!EMAIL_REGEX.test(email) || email.length > 100) return fail(res, 400, 'El email no es válido');
    if (password.length < PASSWORD_MIN) {
      return fail(res, 400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }
    if (!nombreNegocio) return fail(res, 400, 'El nombre del negocio es requerido');

    const existe = await Usuario.findOne({
      where: { [Op.or]: [{ email }, { username: usernameDesdeEmail(email) }] },
      sinTenant: true
    });
    if (existe) return fail(res, 409, 'Ya existe una cuenta con ese email');

    const usuario = await crearNegocioConSuperAdmin({
      nombreNegocio,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      proveedor: 'LOCAL',
      aceptaPromociones: req.body.acepta_promociones,
      nombre: req.body.nombre,
      apellido: req.body.apellido
    });

    // Sin await: un problema con el mail no debe frenar el registro
    mailer.enviarBienvenida({ to: email, negocio: nombreNegocio })
      .catch((e) => console.error('No se pudo enviar el mail de bienvenida:', e.message));

    return await responderConSesion(res, 201, usuario.id, { esNuevo: true });
  } catch (error) {
    if (esDuplicado(error)) return fail(res, 409, 'Ya existe una cuenta con ese email');
    console.error('Error en register:', error);
    return res.status(500).json({ success: false, message: 'Error creando la cuenta' });
  }
};

// ============================================
// POST /api/auth/google
// Body: { idToken, modo?: 'login' | 'registro', nombre_negocio?, acepta_promociones? }
// Entra con Google. Si el email no existe, solo crea negocio + super administrador cuando
// modo === 'registro' (pantalla de crear cuenta); desde "Ingresar" responde 404.
// ============================================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') return fail(res, 400, 'Falta el token de Google');

    const audience = googleAudience();
    if (audience.length === 0) {
      console.error('Falta GOOGLE_CLIENT_IDS en el entorno');
      return fail(res, 500, 'El ingreso con Google no está configurado');
    }

    // El email y el id salen del token verificado por Google, nunca del body
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch (e) {
      return fail(res, 401, 'Token de Google inválido');
    }
    if (!payload || !payload.email || !payload.email_verified) {
      return fail(res, 401, 'Tu email de Google no está verificado');
    }

    const email = normalizarEmail(payload.email);
    const googleId = payload.sub;

    let usuario =
      (await Usuario.findOne({ where: { google_id: googleId }, sinTenant: true })) ||
      (await Usuario.findOne({ where: { email }, sinTenant: true }));

    if (usuario) {
      if (!usuario.activo) return fail(res, 403, 'Esta cuenta está desactivada');

      const cambios = { ultimo_acceso: new Date(), email_verificado: true };
      if (!usuario.google_id) {
        cambios.google_id = googleId;
        // Cuenta creada con clave y email sin verificar: quien la creó pudo no ser el dueño
        // del mail. Se borra esa clave para que no quede una puerta abierta.
        if (!usuario.email_verificado) cambios.password_hash = null;
      }
      await usuario.update(cambios);
      return await responderConSesion(res, 200, usuario.id, { esNuevo: false });
    }

    // Desde "Ingresar con Google" no se crea nada: así un empleado que toca el botón por error
    // no termina con un negocio propio. Crear cuenta es desde la pantalla de registro.
    if (req.body.modo !== 'registro') {
      return res.status(404).json({
        success: false,
        message: 'No hay una cuenta con ese email. Creá una cuenta primero.',
        codigo: 'CUENTA_NO_ENCONTRADA'
      });
    }

    const nombreNegocio = String(
      req.body.nombre_negocio || `Negocio de ${payload.name || email}`
    ).trim().slice(0, 150);

    usuario = await crearNegocioConSuperAdmin({
      nombreNegocio,
      email,
      passwordHash: null,
      proveedor: 'GOOGLE',
      aceptaPromociones: req.body.acepta_promociones,
      nombre: payload.given_name || String(payload.name || '').split(' ')[0],
      apellido: payload.family_name || String(payload.name || '').split(' ').slice(1).join(' ')
    });
    await usuario.update({ google_id: googleId });

    mailer.enviarBienvenida({ to: email, negocio: nombreNegocio })
      .catch((e) => console.error('No se pudo enviar el mail de bienvenida:', e.message));

    return await responderConSesion(res, 201, usuario.id, { esNuevo: true });
  } catch (error) {
    if (esDuplicado(error)) return fail(res, 409, 'Ya existe una cuenta con ese email');
    console.error('Error en googleLogin:', error);
    return res.status(500).json({ success: false, message: 'Error ingresando con Google' });
  }
};

// ============================================
// POST /api/auth/forgot-password
// Body: { email }
// Responde siempre lo mismo, exista o no el email (no se puede averiguar quién está registrado).
// ============================================
exports.forgotPassword = async (req, res) => {
  const respuesta = {
    success: true,
    message: 'Si el email está registrado, te enviamos un correo con instrucciones.'
  };
  try {
    const email = normalizarEmail(req.body.email);
    if (!EMAIL_REGEX.test(email)) return res.json(respuesta);

    const usuario = await Usuario.findOne({ where: { email, activo: true }, sinTenant: true });
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex'); // en la base va el hash

      // Un solo enlace vigente por persona
      await sequelize.query(
        'UPDATE tokens_recuperacion SET usado = 1 WHERE usuario_id = :id AND usado = 0',
        { replacements: { id: usuario.id } }
      );
      await sequelize.query(
        `INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en)
         VALUES (:id, :hash, DATE_ADD(NOW(), INTERVAL :horas HOUR))`,
        { replacements: { id: usuario.id, hash: tokenHash, horas: HORAS_TOKEN_RECUPERACION } }
      );

      const base = process.env.APP_URL || 'http://localhost:8081';
      const link = `${base}/restablecer-clave?token=${token}`;
      mailer.enviarRecuperacion({ to: email, link })
        .catch((e) => console.error('No se pudo enviar el mail de recuperación:', e.message));
    }
    return res.json(respuesta);
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.json(respuesta);
  }
};

// ============================================
// POST /api/auth/reset-password
// Body: { token, password_nueva }
// ============================================
exports.resetPassword = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const token = String(req.body.token || '');
    const nueva = String(req.body.password_nueva || '');

    if (!token) {
      await t.rollback();
      return fail(res, 400, 'Falta el enlace de recuperación');
    }
    if (nueva.length < PASSWORD_MIN) {
      await t.rollback();
      return fail(res, 400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [fila] = await sequelize.query(
      `SELECT id, usuario_id FROM tokens_recuperacion
       WHERE token_hash = :hash AND usado = 0 AND expira_en > NOW() FOR UPDATE`,
      { replacements: { hash: tokenHash }, type: QueryTypes.SELECT, transaction: t }
    );
    if (!fila) {
      await t.rollback();
      return fail(res, 400, 'El enlace no es válido o ya venció. Pedí uno nuevo.');
    }

    const usuario = await Usuario.findByPk(fila.usuario_id, { sinTenant: true, transaction: t });
    if (!usuario || !usuario.activo) {
      await t.rollback();
      return fail(res, 400, 'El enlace no es válido o ya venció. Pedí uno nuevo.');
    }

    // Poder abrir el enlace del mail prueba que el email es suyo
    await usuario.update(
      { password_hash: await bcrypt.hash(nueva, 10), email_verificado: true },
      { transaction: t }
    );
    await sequelize.query('UPDATE tokens_recuperacion SET usado = 1 WHERE id = :id', {
      replacements: { id: fila.id }, transaction: t
    });
    await Sesion.update(
      { activo: false },
      { where: { usuario_id: usuario.id, activo: true }, transaction: t }
    );

    await t.commit();
    return res.json({ success: true, message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ success: false, message: 'Error restableciendo la contraseña' });
  }
};