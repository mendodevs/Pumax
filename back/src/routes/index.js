const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const productoRoutes = require('./productoRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const clienteRoutes = require('./clienteRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const pedidoRoutes = require('./pedidoRoutes');
const facturaRoutes = require('./facturaRoutes');
const proveedorRoutes = require('./proveedorRoutes');
const ingresoRoutes = require('./ingresoRoutes');
const reporteRoutes = require('./reporteRoutes');
const exportRoutes = require('./exportRoutes');
const busquedasRoutes = require('./busquedasRoutes');
const authRoutes = require('./authRoutes');

// Registro, Google y recuperación de contraseña (públicas)
router.use('/auth', authRoutes);

// Rutas de usuarios (login y verificar-sesion son públicas, CRUD es protegido internamente)
router.use('/usuarios', usuarioRoutes);

// Rutas protegidas con token de sesión
router.use('/productos', authMiddleware, productoRoutes);
router.use('/categorias', authMiddleware, categoriaRoutes);
router.use('/clientes', authMiddleware, clienteRoutes);
router.use('/pedidos', authMiddleware, pedidoRoutes);
router.use('/facturas', authMiddleware, facturaRoutes);
router.use('/proveedores', authMiddleware, proveedorRoutes);
router.use('/ingresos', authMiddleware, ingresoRoutes);
router.use('/reportes', authMiddleware, reporteRoutes);
router.use('/exportar', authMiddleware, exportRoutes);
router.use('/busquedas', authMiddleware, busquedasRoutes);

module.exports = router;