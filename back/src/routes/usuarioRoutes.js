const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Rutas públicas
router.post('/login', usuarioController.login);
router.get('/verificar-sesion', usuarioController.verificarSesion);

// Rutas protegidas (requieren sesión activa)
router.use(authMiddleware);

// Mi cuenta: cualquier usuario autenticado, solo sobre sí mismo
// (van antes de '/:id' para que "me" no se interprete como un id)
router.get('/me', usuarioController.getMe);
router.put('/me', usuarioController.updateMe);
router.put('/me/password', usuarioController.changeMyPassword);

// Administración de usuarios: solo ADMIN
router.use(requireRole('ADMIN'));
router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id/password', usuarioController.resetPassword);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.delete);

module.exports = router;