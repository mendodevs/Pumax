const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Usuario, Empleado, Sesion } = require('../models');
const bcrypt = require('bcryptjs');

// ============================================
// ADMINISTRACIÓN DE USUARIOS (solo ADMIN, ver usuarioRoutes)
// ============================================

const ROLES_VALIDOS = ['ADMIN', 'VENDEDOR', 'DEPOSITO', 'FACTURACION', 'VIAJANTE']; // SUPERADMIN no se asigna desde acá: se crea al registrarse
const ROLES_ADMIN = ['SUPERADMIN', 'ADMIN'];
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const EMPLEADO_LISTA = ['id', 'nombre', 'apellido', 'dni', 'cargo', 'telefono', 'email'];

// Sin caracteres que se confunden (0/O, 1/l/I) para que sea fácil de dictar
const CLAVE_ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const generarClave = (largo = 10) =>
  Array.from({ length: largo }, () => CLAVE_ALFABETO[crypto.randomInt(CLAVE_ALFABETO.length)]).join('');

const hoyLocal = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const incluirEmpleado = [{ model: Empleado, as: 'empleado', attributes: EMPLEADO_LISTA }];

const buscarUsuario = (id) =>
  Usuario.findByPk(id, { include: incluirEmpleado, attributes: { exclude: ['password_hash'] } });

/** Admins activos, sin contar a `exceptoId` (para no dejar el sistema sin administrador) */
const otrosAdminsActivos = (exceptoId) =>
  Usuario.count({ where: { rol: { [Op.in]: ROLES_ADMIN }, activo: true, id: { [Op.ne]: exceptoId } } });

/** Cierra todas las sesiones abiertas de una persona */
const cerrarSesiones = (usuarioId, transaction) =>
  Sesion.update({ activo: false }, { where: { usuario_id: usuarioId, activo: true }, transaction });

const normalizarRol = (rol) => {
  const r = String(rol || '').toUpperCase();
  return r === 'EMPLEADO' ? 'VENDEDOR' : r;
};

/**
 * Valida y limpia los datos de la ficha de empleado.
 * Devuelve { datos } o { error }. Con `parcial` solo valida lo que viene informado.
 */
function validarEmpleado(e = {}, { parcial = false } = {}) {
  const datos = {};
  const texto = (v, max) => String(v).trim().slice(0, max);

  for (const [campo, etiqueta] of [['nombre', 'El nombre'], ['apellido', 'El apellido']]) {
    if (e[campo] !== undefined) {
      if (!String(e[campo]).trim()) return { error: `${etiqueta} no puede quedar vacío` };
      datos[campo] = texto(e[campo], 100);
    } else if (!parcial) {
      return { error: `${etiqueta} es requerido` };
    }
  }

  if (e.dni !== undefined) {
    const dni = String(e.dni).replace(/[.\s-]/g, '');
    if (!/^\d{6,12}$/.test(dni)) return { error: 'El DNI debe tener entre 6 y 12 números' };
    datos.dni = dni;
  } else if (!parcial) {
    return { error: 'El DNI es requerido' };
  }

  if (e.email !== undefined) {
    const v = String(e.email).trim();
    if (v && !EMAIL_REGEX.test(v)) return { error: 'El email no es válido' };
    datos.email = v ? v.slice(0, 100) : null;
  }
  if (e.telefono !== undefined) datos.telefono = String(e.telefono).trim().slice(0, 20) || null;
  if (e.cargo !== undefined) datos.cargo = String(e.cargo).trim().slice(0, 100) || null;

  return { datos };
}

// Listado completo (activos e inactivos: el front filtra y permite reactivar)
exports.getAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: incluirEmpleado,
      attributes: { exclude: ['password_hash'] },
      order: [['activo', 'DESC'], ['username', 'ASC']]
    });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo usuarios', error: error.message });
  }
};

// Obtener usuario por ID
exports.getById = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: [{ model: Empleado, as: 'empleado' }],
      attributes: { exclude: ['password_hash'] }
    });
    if (!usuario) return fail(res, 404, 'Usuario no encontrado');
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo usuario', error: error.message });
  }
};

/**
 * Crear usuario.
 * Body: { username, rol, password?, empleado: { nombre, apellido, dni, cargo?, email?, telefono? } }
 *   - También acepta `empleado_id` para vincular una ficha que ya existe.
 *   - Sin `password` se genera una clave temporal y se devuelve UNA sola vez en `password_temporal`.
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, password, password_hash, rol, empleado_id, empleado } = req.body;

    const user = String(username || '').trim();
    if (!USERNAME_REGEX.test(user)) {
      await t.rollback();
      return fail(res, 400, 'El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo');
    }

    const rolNormalizado = normalizarRol(rol || 'VENDEDOR');
    if (!ROLES_VALIDOS.includes(rolNormalizado)) {
      await t.rollback();
      return fail(res, 400, 'El rol no es válido');
    }

    let clave = password || password_hash;
    let generada = false;
    if (clave === undefined || clave === null || clave === '') {
      clave = generarClave();
      generada = true;
    } else if (String(clave).length < PASSWORD_MIN) {
      await t.rollback();
      return fail(res, 400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }

    if (await Usuario.findOne({ where: { username: user }, transaction: t, sinTenant: true })) { // único global, no solo en este negocio
      await t.rollback();
      return fail(res, 400, 'Ese nombre de usuario ya está en uso');
    }

    // Ficha de empleado: una existente o una nueva
    let empleadoVinculado = null;
    if (empleado_id) {
      empleadoVinculado = await Empleado.findByPk(empleado_id, { transaction: t });
      if (!empleadoVinculado) {
        await t.rollback();
        return fail(res, 400, 'El empleado indicado no existe');
      }
      if (await Usuario.findOne({ where: { empleado_id }, transaction: t })) {
        await t.rollback();
        return fail(res, 400, 'Ese empleado ya tiene un usuario');
      }
    } else if (empleado) {
      const { datos, error } = validarEmpleado(empleado);
      if (error) {
        await t.rollback();
        return fail(res, 400, error);
      }
      if (await Empleado.findOne({ where: { dni: datos.dni }, transaction: t })) {
        await t.rollback();
        return fail(res, 400, 'Ya existe un empleado con ese DNI');
      }
      empleadoVinculado = await Empleado.create(
        { ...datos, fecha_ingreso: hoyLocal(), activo: true },
        { transaction: t }
      );
    }

    const creado = await Usuario.create(
      {
        username: user,
        password_hash: await bcrypt.hash(String(clave), 10),
        rol: rolNormalizado,
        empleado_id: empleadoVinculado ? empleadoVinculado.id : null,
        activo: true
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: await buscarUsuario(creado.id),
      ...(generada ? { password_temporal: clave } : {})
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(400).json({ success: false, message: 'Error creando usuario', error: error.message });
  }
};

/**
 * Actualizar usuario. Solo cambia lo permitido (nunca la clave ni el usuario):
 *   { rol?, activo?, empleado?: { nombre, apellido, dni, cargo, email, telefono } }
 * Si el usuario no tiene ficha y se envían nombre, apellido y DNI, se crea y se vincula.
 */
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const usuario = await Usuario.findByPk(id, { transaction: t });
    if (!usuario) {
      await t.rollback();
      return fail(res, 404, 'Usuario no encontrado');
    }

    if (usuario.rol === 'SUPERADMIN' && req.user.rol !== 'SUPERADMIN') {
      await t.rollback();
      return fail(res, 403, 'Solo un superadministrador puede modificar esa cuenta');
    }

    const esMismo = id === Number(req.user.id);
    const cambios = {};

    if (req.body.rol !== undefined) {
      const rol = normalizarRol(req.body.rol);
      if (!ROLES_VALIDOS.includes(rol)) {
        await t.rollback();
        return fail(res, 400, 'El rol no es válido');
      }
      cambios.rol = rol;
    }
    if (req.body.activo !== undefined) cambios.activo = Boolean(req.body.activo);

    const cambiaRol = cambios.rol !== undefined && cambios.rol !== usuario.rol;
    const desactiva = cambios.activo === false && usuario.activo;

    if (esMismo && (cambiaRol || desactiva)) {
      await t.rollback();
      return fail(res, 400, 'No podés cambiar tu propio rol ni desactivar tu propia cuenta');
    }
    if (ROLES_ADMIN.includes(usuario.rol) && usuario.activo && (cambiaRol || desactiva)) {
      if ((await otrosAdminsActivos(id)) === 0) {
        await t.rollback();
        return fail(res, 400, 'Tiene que quedar al menos un administrador activo');
      }
    }

    // Ficha de empleado (campos planos como respaldo del formato anterior)
    const { nombre, apellido, email } = req.body;
    const datosEmpleado = { ...(nombre !== undefined && { nombre }), ...(apellido !== undefined && { apellido }), ...(email !== undefined && { email }), ...(req.body.empleado || {}) };

    if (Object.keys(datosEmpleado).length > 0) {
      if (usuario.empleado_id) {
        const { datos, error } = validarEmpleado(datosEmpleado, { parcial: true });
        if (error) {
          await t.rollback();
          return fail(res, 400, error);
        }
        if (datos.dni) {
          const repetido = await Empleado.findOne({
            where: { dni: datos.dni, id: { [Op.ne]: usuario.empleado_id } },
            transaction: t
          });
          if (repetido) {
            await t.rollback();
            return fail(res, 400, 'Ya existe un empleado con ese DNI');
          }
        }
        if (Object.keys(datos).length > 0) {
          await Empleado.update(datos, { where: { id: usuario.empleado_id }, transaction: t });
        }
      } else if (datosEmpleado.nombre || datosEmpleado.apellido || datosEmpleado.dni) {
        // Completar la ficha: pide los tres datos obligatorios
        const { datos, error } = validarEmpleado(datosEmpleado);
        if (error) {
          await t.rollback();
          return fail(res, 400, error);
        }
        if (await Empleado.findOne({ where: { dni: datos.dni }, transaction: t })) {
          await t.rollback();
          return fail(res, 400, 'Ya existe un empleado con ese DNI');
        }
        const ficha = await Empleado.create(
          { ...datos, fecha_ingreso: hoyLocal(), activo: true },
          { transaction: t }
        );
        cambios.empleado_id = ficha.id;
      }
    }

    if (Object.keys(cambios).length > 0) await usuario.update(cambios, { transaction: t });
    if (desactiva) await cerrarSesiones(id, t);

    await t.commit();
    res.json({ success: true, message: 'Usuario actualizado', data: await buscarUsuario(id) });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(400).json({ success: false, message: 'Error actualizando usuario', error: error.message });
  }
};

// Desactivar usuario (no se borra: conserva el historial y se puede reactivar)
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const usuario = await Usuario.findByPk(id, { transaction: t });
    if (!usuario) {
      await t.rollback();
      return fail(res, 404, 'Usuario no encontrado');
    }
    if (id === Number(req.user.id)) {
      await t.rollback();
      return fail(res, 400, 'No podés desactivar tu propia cuenta');
    }
    if (usuario.rol === 'SUPERADMIN' && req.user.rol !== 'SUPERADMIN') {
      await t.rollback();
      return fail(res, 403, 'Solo un superadministrador puede desactivar esa cuenta');
    }
    if (ROLES_ADMIN.includes(usuario.rol) && usuario.activo && (await otrosAdminsActivos(id)) === 0) {
      await t.rollback();
      return fail(res, 400, 'Tiene que quedar al menos un administrador activo');
    }

    await usuario.update({ activo: false }, { transaction: t });
    await cerrarSesiones(id, t);
    await t.commit();
    res.json({ success: true, message: 'Usuario desactivado' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(500).json({ success: false, message: 'Error desactivando usuario', error: error.message });
  }
};

/**
 * Reiniciar la contraseña de otra persona.
 * Body: { password_nueva? } — sin clave se genera una temporal y se devuelve una sola vez.
 * Cierra sus sesiones abiertas. La propia clave se cambia desde Mi cuenta (exige la actual).
 */
exports.resetPassword = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === Number(req.user.id)) {
      return fail(res, 400, 'Tu propia contraseña se cambia desde Mi cuenta');
    }
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return fail(res, 404, 'Usuario no encontrado');
    if (usuario.rol === 'SUPERADMIN' && req.user.rol !== 'SUPERADMIN') {
      return fail(res, 403, 'Solo un superadministrador puede reiniciar esa contraseña');
    }

    let clave = req.body.password_nueva;
    let generada = false;
    if (clave === undefined || clave === null || clave === '') {
      clave = generarClave();
      generada = true;
    } else if (String(clave).length < PASSWORD_MIN) {
      return fail(res, 400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }

    await usuario.update({ password_hash: await bcrypt.hash(String(clave), 10) });
    await cerrarSesiones(id);

    res.json({
      success: true,
      message: 'Contraseña reiniciada',
      ...(generada ? { password_temporal: clave } : {})
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reiniciando la contraseña', error: error.message });
  }
};

// ============================================
// MI CUENTA (cualquier usuario autenticado, solo sobre sí mismo)
// ============================================

const EMPLEADO_ATTRS = ['id', 'nombre', 'apellido', 'dni', 'cargo', 'telefono', 'email', 'direccion', 'fecha_ingreso'];

const buscarMiCuenta = (id) =>
  Usuario.findByPk(id, {
    include: [{ model: Empleado, as: 'empleado', attributes: EMPLEADO_ATTRS }],
    attributes: { exclude: ['password_hash'] }
  });

// Datos de la cuenta del usuario logueado
exports.getMe = async (req, res) => {
  try {
    const usuario = await buscarMiCuenta(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo tu cuenta', error: error.message });
  }
};

// Editar datos personales propios (nunca rol, estado ni username)
exports.updateMe = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Cuenta sin ficha (por ejemplo, creada antes de que el registro la generara): se crea
    // acá con lo que carga la persona. Nombre y apellido son obligatorios.
    if (!usuario.empleado_id) {
      const nombre = String(req.body.nombre || '').trim();
      const apellido = String(req.body.apellido || '').trim();
      if (!nombre || !apellido) {
        return res.status(400).json({
          success: false,
          message: 'Completá tu nombre y apellido para guardar tus datos'
        });
      }
      const email = String(req.body.email || '').trim();
      if (email && !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ success: false, message: 'El email no es válido' });
      }
      const telefono = String(req.body.telefono || '').trim();
      const direccion = String(req.body.direccion || '').trim();

      // DNI provisional y único en el negocio; un administrador puede cargar el real
      let dni;
      do {
        dni = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
      } while (await Empleado.findOne({ where: { dni } }));

      const ficha = await Empleado.create({
        nombre: nombre.slice(0, 100),
        apellido: apellido.slice(0, 100),
        dni,
        email: email ? email.slice(0, 100) : null,
        telefono: telefono ? telefono.slice(0, 20) : null,
        direccion: direccion || null,
        cargo: usuario.rol === 'SUPERADMIN' ? 'Propietario' : null,
        fecha_ingreso: new Date()
      });
      await usuario.update({ empleado_id: ficha.id });

      return res.json({ success: true, message: 'Datos guardados', data: await buscarMiCuenta(req.user.id) });
    }

    const { nombre, apellido, email, telefono, direccion } = req.body;
    const cambios = {};

    if (nombre !== undefined) {
      if (!String(nombre).trim()) {
        return res.status(400).json({ success: false, message: 'El nombre no puede quedar vacío' });
      }
      cambios.nombre = String(nombre).trim().slice(0, 100);
    }
    if (apellido !== undefined) {
      if (!String(apellido).trim()) {
        return res.status(400).json({ success: false, message: 'El apellido no puede quedar vacío' });
      }
      cambios.apellido = String(apellido).trim().slice(0, 100);
    }
    if (email !== undefined) {
      const valor = String(email).trim();
      if (valor && !EMAIL_REGEX.test(valor)) {
        return res.status(400).json({ success: false, message: 'El email no es válido' });
      }
      cambios.email = valor ? valor.slice(0, 100) : null;
    }
    if (telefono !== undefined) {
      const valor = String(telefono).trim();
      cambios.telefono = valor ? valor.slice(0, 20) : null;
    }
    if (direccion !== undefined) {
      const valor = String(direccion).trim();
      cambios.direccion = valor || null;
    }

    if (Object.keys(cambios).length > 0) {
      await Empleado.update(cambios, { where: { id: usuario.empleado_id } });
    }

    const actualizado = await buscarMiCuenta(req.user.id);
    res.json({ success: true, message: 'Datos actualizados', data: actualizado });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error actualizando tus datos', error: error.message });
  }
};

// Cambiar la contraseña propia (exige la actual)
exports.changeMyPassword = async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ success: false, message: 'Completá la contraseña actual y la nueva' });
    }
    if (String(password_nueva).length < PASSWORD_MIN) {
      return res.status(400).json({
        success: false,
        message: `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres`
      });
    }
    if (password_nueva === password_actual) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (!usuario.password_hash) {
      return res.status(400).json({ success: false, message: 'Tu cuenta usa Google y no tiene contraseña para cambiar' });
    }

    // Mismo criterio que el login (hash bcrypt o, en cuentas viejas, texto plano)
    const esHash = usuario.password_hash.startsWith('$2a$') || usuario.password_hash.startsWith('$2b$');
    const actualValida = esHash
      ? await bcrypt.compare(password_actual, usuario.password_hash)
      : usuario.password_hash === password_actual;

    // 400 y no 401: el front interpreta 401 como "sesión vencida"
    if (!actualValida) {
      return res.status(400).json({ success: false, message: 'La contraseña actual no es correcta' });
    }

    await usuario.update({ password_hash: await bcrypt.hash(password_nueva, 10) });
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cambiando la contraseña', error: error.message });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar que se enviaron los datos requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos'
      });
    }

    // Buscar usuario activo por username
    const ident = String(username).trim();
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [{ username: ident }, { email: ident.toLowerCase() }],
        activo: true
      },
      sinTenant: true, // el login busca en todos los negocios
      include: [{
        model: Empleado,
        as: 'empleado',
        attributes: ['id', 'nombre', 'apellido', 'dni', 'cargo']
      }]
    });

    // Verificar si existe el usuario
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!usuario.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta ingresa con Google. Usá el botón de Google o recuperá tu contraseña.'
      });
    }

    // Comparar password con bcrypt (con fallback para compatibilidad con contraseñas en texto plano)
    let passwordValido = false;
    if (usuario.password_hash.startsWith('$2a$') || usuario.password_hash.startsWith('$2b$')) {
      passwordValido = await bcrypt.compare(password, usuario.password_hash);
    } else {
      passwordValido = (usuario.password_hash === password);
      if (passwordValido) {
        // Auto-migrar la contraseña a hash bcrypt seguro
        const hash = await bcrypt.hash(password, 10);
        await usuario.update({ password_hash: hash });
      }
    }

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await usuario.update({
      ultimo_acceso: new Date()
    });

    // Generar token de sesión
    const token = require('crypto').randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7); // Token válido por 7 días

    // Crear sesión en la base de datos
    await Sesion.create({
      usuario_id: usuario.id,
      token: token,
      fecha_expiracion: fechaExpiracion,
      activo: true
    });

    // Preparar respuesta sin password
    const usuarioSinPassword = usuario.toJSON();
    delete usuarioSinPassword.password_hash;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: usuarioSinPassword,
      token: token // Enviar token al frontend
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    });
  }
};

// Verificar sesión activa
exports.verificarSesion = async (req, res) => {
  try {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de sesión'
      });
    }

    // Buscar sesión activa en la base de datos
    const sesion = await Sesion.findOne({
      where: {
        token: token,
        activo: true
      },
      include: [{
        model: Usuario,
        as: 'usuario',
        where: { activo: true },
        include: [{
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'cargo']
        }]
      }]
    });

    if (!sesion) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    // Verificar si el token está expirado
    if (sesion.estaExpirado()) {
      // Desactivar la sesión
      await sesion.update({ activo: false });
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada'
      });
    }

    // Preparar respuesta sin password
    const usuarioSinPassword = sesion.usuario.toJSON();
    delete usuarioSinPassword.password_hash;

    res.json({
      success: true,
      message: 'Sesión válida',
      data: usuarioSinPassword,
      token: token // Devolver el token para que el frontend lo mantenga
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando sesión',
      error: error.message
    });
  }
};