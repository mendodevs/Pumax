const { Producto, MovimientoStock } = require('../models');

/**
 * MOTOR DE STOCK - único lugar donde cambia productos.stock
 *
 * Reglas:
 *  - Todo cambio de stock queda en movimientos_stock con quién lo hizo, por qué y de qué documento viene.
 *  - El stock nunca queda negativo: si no alcanza, se rechaza todo el movimiento.
 *  - Se llama SIEMPRE dentro de una transacción (t): si algo falla después, el stock vuelve a como estaba.
 *  - La fila del producto se bloquea mientras se modifica, así dos operaciones a la vez no se pisan.
 *  - El negocio sale del contexto de la sesión: un producto de otro negocio aparece como "no encontrado".
 */

class StockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function cantidadEntera(valor, etiqueta = 'La cantidad') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new StockError(`${etiqueta} debe ser un número entero mayor a 0`);
  }
  return n;
}

async function bloquearProducto(productoId, t) {
  const producto = await Producto.findByPk(productoId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!producto) throw new StockError(`Producto ${productoId} no encontrado`, 404);
  return producto;
}

/**
 * Suma (ENTRADA) o resta (SALIDA) unidades y registra el movimiento.
 * referenciaTipo: 'PEDIDO' | 'INGRESO' | 'AJUSTE_MANUAL' | 'FACTURA'
 */
async function moverStock(
  { productoId, tipo, cantidad, referenciaTipo, referenciaId = null, usuarioId = null, observaciones = null },
  t
) {
  if (tipo !== 'ENTRADA' && tipo !== 'SALIDA') {
    throw new StockError('Tipo de movimiento inválido');
  }
  const cant = cantidadEntera(cantidad);
  const producto = await bloquearProducto(productoId, t);

  const anterior = Number(producto.stock);
  const nuevo = tipo === 'ENTRADA' ? anterior + cant : anterior - cant;
  if (nuevo < 0) {
    throw new StockError(
      `Stock insuficiente de "${producto.descripcion}" (disponible: ${anterior}, solicitado: ${cant})`
    );
  }

  await producto.update({ stock: nuevo }, { transaction: t });
  const movimiento = await MovimientoStock.create({
    producto_id: producto.id,
    tipo_movimiento: tipo,
    cantidad: cant,
    stock_anterior: anterior,
    stock_nuevo: nuevo,
    referencia_tipo: referenciaTipo,
    referencia_id: referenciaId,
    usuario_id: usuarioId,
    observaciones
  }, { transaction: t });

  return { producto, movimiento };
}

/**
 * Ajuste por conteo físico: el stock pasa a ser exactamente `stockContado`.
 * El movimiento guarda la diferencia como cantidad (el panel la muestra con ±).
 */
async function fijarStock({ productoId, stockContado, usuarioId = null, observaciones = null }, t) {
  const contado = Number(stockContado);
  if (!Number.isInteger(contado) || contado < 0) {
    throw new StockError('El stock contado debe ser un número entero de 0 o más');
  }
  const producto = await bloquearProducto(productoId, t);

  const anterior = Number(producto.stock);
  if (contado === anterior) {
    throw new StockError('El stock contado es igual al actual: no hay nada que ajustar');
  }

  await producto.update({ stock: contado }, { transaction: t });
  const movimiento = await MovimientoStock.create({
    producto_id: producto.id,
    tipo_movimiento: 'AJUSTE',
    cantidad: Math.abs(contado - anterior),
    stock_anterior: anterior,
    stock_nuevo: contado,
    referencia_tipo: 'AJUSTE_MANUAL',
    referencia_id: null,
    usuario_id: usuarioId,
    observaciones
  }, { transaction: t });

  return { producto, movimiento };
}

/**
 * Valida una lista [{ producto_id, cantidad }], junta los productos repetidos y la ordena
 * por producto (siempre se bloquea en el mismo orden: evita bloqueos cruzados entre operaciones).
 */
function agruparItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new StockError('Debe incluir al menos un producto');
  }
  const porProducto = new Map();
  for (const item of items) {
    const productoId = Number(item && item.producto_id);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw new StockError('Hay un producto inválido en el detalle');
    }
    const cantidad = cantidadEntera(item.cantidad, `La cantidad del producto ${productoId}`);
    porProducto.set(productoId, (porProducto.get(productoId) || 0) + cantidad);
  }
  return [...porProducto.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
}

module.exports = { moverStock, fijarStock, agruparItems, cantidadEntera, StockError };
