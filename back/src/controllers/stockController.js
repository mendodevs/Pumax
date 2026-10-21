const sequelize = require('../config/database');
const { moverStock, fijarStock, StockError } = require('../services/stockService');

const TIPOS = ['ENTRADA', 'SALIDA', 'AJUSTE'];

/**
 * POST /api/stock/ajustes
 * Body: { producto_id, tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE', cantidad, motivo }
 *   - ENTRADA: suma `cantidad` unidades (por ejemplo, mercadería encontrada)
 *   - SALIDA:  resta `cantidad` unidades (rotura, pérdida, uso interno...)
 *   - AJUSTE:  conteo físico: `cantidad` es el stock REAL contado y el stock pasa a ese valor
 * El motivo es obligatorio. Queda registrado quién lo hizo.
 */
exports.crearAjuste = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { producto_id, tipo, cantidad } = req.body;
    const motivo = String(req.body.motivo || '').trim().slice(0, 500);

    if (!TIPOS.includes(tipo)) {
      throw new StockError(`Tipo inválido. Usar: ${TIPOS.join(', ')}`);
    }
    if (!motivo) {
      throw new StockError('Indicá el motivo del movimiento');
    }

    const { producto, movimiento } =
      tipo === 'AJUSTE'
        ? await fijarStock(
            { productoId: producto_id, stockContado: cantidad, usuarioId: req.user.id, observaciones: motivo },
            t
          )
        : await moverStock(
            {
              productoId: producto_id,
              tipo,
              cantidad,
              referenciaTipo: 'AJUSTE_MANUAL',
              usuarioId: req.user.id,
              observaciones: motivo
            },
            t
          );

    await t.commit();

    // Misma forma que devuelve la lista de movimientos (GET /api/reportes/movimientos-stock)
    res.status(201).json({
      success: true,
      message: 'Movimiento registrado',
      data: {
        id: movimiento.id,
        producto_id: producto.id,
        producto_nombre: producto.descripcion,
        tipo_movimiento: movimiento.tipo_movimiento,
        cantidad: movimiento.cantidad,
        stock_anterior: movimiento.stock_anterior,
        stock_nuevo: movimiento.stock_nuevo,
        motivo,
        usuario: req.user.username,
        fecha: movimiento.fecha
      }
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.status || 400).json({ success: false, message: error.message, error: error.message });
  }
};
