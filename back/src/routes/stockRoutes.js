const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const requireRole = require('../middlewares/requireRole');

/**
 * RUTAS DE STOCK - Endpoint base: /api/stock
 * (la lista de movimientos sigue en GET /api/reportes/movimientos-stock)
 *
 * POST /api/stock/ajustes   { producto_id, tipo: ENTRADA | SALIDA | AJUSTE, cantidad, motivo }
 *   Solo ADMIN, DEPOSITO y SUPERADMIN pueden tocar el stock a mano.
 */
router.post('/ajustes', requireRole('ADMIN', 'DEPOSITO'), stockController.crearAjuste);

module.exports = router;
