const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * RUTAS PÚBLICAS DE CUENTA - Endpoint base: /api/auth
 * (el login con usuario/clave sigue en POST /api/usuarios/login)
 *
 * POST /api/auth/register          { nombre_negocio, email, password, acepta_promociones? }
 * POST /api/auth/google            { idToken, nombre_negocio?, acepta_promociones? }
 * POST /api/auth/forgot-password   { email }
 * POST /api/auth/reset-password    { token, password_nueva }
 *
 * Son endpoints sensibles a abuso (fuerza bruta, spam de mails): conviene
 * ponerles un límite de intentos por IP (ver nota en la respuesta).
 */
router.post('/register', authController.register);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
