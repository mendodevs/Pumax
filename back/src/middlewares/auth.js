const { Usuario, Sesion } = require('../models');
const { ejecutarEnNegocio } = require('../utils/tenant');

/**
 * Middleware de autenticación
 * Valida el token de sesión (x-session-token, Authorization Bearer o ?token=)
 * y deja el usuario en req.user.
 *
 * Además fija el negocio de la request: a partir de acá, todas las consultas a los
 * modelos multi-negocio quedan filtradas por req.user.negocio_id (ver utils/tenant.js).
 *
 * Se quitó el "fallback de desarrollo" que, sin token, tomaba la última sesión activa
 * de cualquier usuario: con varios negocios eso mezclaría datos, y si NODE_ENV no
 * estaba definido en el servidor dejaba entrar a cualquiera sin autenticarse.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const token = req.headers['x-session-token'] || bearerToken || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token de sesión requerido.'
      });
    }

    // Sesion no es multi-negocio y el include de Usuario no pasa por los hooks de tenant
    const sesion = await Sesion.findOne({
      where: { token, activo: true },
      include: [{
        model: Usuario,
        as: 'usuario',
        where: { activo: true }
      }]
    });

    if (!sesion) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada.'
      });
    }

    if (sesion.estaExpirado()) {
      await sesion.update({ activo: false });
      return res.status(401).json({
        success: false,
        message: 'La sesión ha expirado. Por favor, inicie sesión nuevamente.'
      });
    }

    req.user = sesion.usuario;

    if (!req.user.negocio_id) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin negocio asignado.'
      });
    }

    // Todo lo que corra desde acá (rutas y controllers) queda dentro del negocio del usuario
    return ejecutarEnNegocio(req.user.negocio_id, next);
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar sesión'
    });
  }
};

module.exports = authMiddleware;
