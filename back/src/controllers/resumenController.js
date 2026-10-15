const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * RESUMEN POR PERÍODO (semanal / mensual)
 * GET /api/reportes/resumen?periodo=semana|mes&fecha=YYYY-MM-DD
 *   - periodo: "semana" (lunes a domingo) o "mes". Por defecto "semana".
 *   - fecha: cualquier día dentro del período que se quiere ver. Por defecto hoy.
 *
 * "Ventas" = pedidos no cancelados. "Facturado" = facturas emitidas.
 * Todas las consultas usan parámetros (replacements), nunca texto concatenado.
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Devuelve [inicio, finExclusivo] del período que contiene a `ref` */
function rango(tipo, ref) {
  if (tipo === 'mes') {
    return [new Date(ref.getFullYear(), ref.getMonth(), 1), new Date(ref.getFullYear(), ref.getMonth() + 1, 1)];
  }
  const diasDesdeLunes = (ref.getDay() + 6) % 7;
  const lunes = addDays(ref, -diasDesdeLunes);
  return [lunes, addDays(lunes, 7)];
}

function etiqueta(tipo, inicio, finExcl) {
  if (tipo === 'mes') return `${MESES[inicio.getMonth()]} de ${inicio.getFullYear()}`;
  const fin = addDays(finExcl, -1);
  const mismoMes = inicio.getMonth() === fin.getMonth();
  return mismoMes
    ? `${inicio.getDate()} al ${fin.getDate()} de ${MESES[fin.getMonth()]} de ${fin.getFullYear()}`
    : `${inicio.getDate()} de ${MESES[inicio.getMonth()]} al ${fin.getDate()} de ${MESES[fin.getMonth()]} de ${fin.getFullYear()}`;
}

const num = (v) => Number(v) || 0;

/** Totales de un rango */
async function totales(desde, hasta) {
  const [v] = await sequelize.query(
    `SELECT COUNT(*) AS pedidos,
            COALESCE(SUM(total), 0) AS ventas,
            COUNT(DISTINCT cliente_id) AS clientes
       FROM pedidos
      WHERE fecha_pedido >= :desde AND fecha_pedido < :hasta AND estado <> 'CANCELADO'`,
    { replacements: { desde, hasta }, type: QueryTypes.SELECT }
  );

  const [u] = await sequelize.query(
    `SELECT COALESCE(SUM(dp.cantidad), 0) AS unidades,
            COALESCE(SUM(dp.subtotal - dp.cantidad * p.precio_base), 0) AS ganancia
       FROM detalle_pedidos dp
       JOIN pedidos ped ON dp.pedido_id = ped.id
       JOIN productos p ON dp.producto_id = p.id
      WHERE ped.fecha_pedido >= :desde AND ped.fecha_pedido < :hasta AND ped.estado <> 'CANCELADO'`,
    { replacements: { desde, hasta }, type: QueryTypes.SELECT }
  );

  const [f] = await sequelize.query(
    `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS monto
       FROM facturas
      WHERE fecha_emision >= :desde AND fecha_emision < :hasta AND estado = 'EMITIDA'`,
    { replacements: { desde, hasta }, type: QueryTypes.SELECT }
  );

  const pedidos = num(v.pedidos);
  const ventas = num(v.ventas);
  return {
    ventas,
    pedidos,
    ticket_promedio: pedidos > 0 ? ventas / pedidos : 0,
    clientes: num(v.clientes),
    unidades: num(u.unidades),
    ganancia_estimada: num(u.ganancia),
    facturas: num(f.cantidad),
    facturado: num(f.monto),
  };
}

const getResumen = async (req, res) => {
  try {
    const tipo = req.query.periodo === 'mes' ? 'mes' : 'semana';

    let ref = new Date();
    if (req.query.fecha) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(req.query.fecha));
      if (!m) return res.status(400).json({ success: false, mensaje: 'fecha inválida, usá YYYY-MM-DD' });
      ref = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }

    const [desde, hasta] = rango(tipo, ref);
    // Período anterior: la semana o el mes inmediatamente previo
    const [antDesde, antHasta] = rango(tipo, addDays(desde, -1));
    const rep = { desde, hasta };

    const [actual, anterior] = await Promise.all([totales(desde, hasta), totales(antDesde, antHasta)]);

    const [porDia, porEstado, porTipo, topProductos, topClientes, porCategoria, movimientos, stock] = await Promise.all([
      sequelize.query(
        `SELECT DATE_FORMAT(fecha_pedido, '%Y-%m-%d') AS dia, COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS ventas
           FROM pedidos
          WHERE fecha_pedido >= :desde AND fecha_pedido < :hasta AND estado <> 'CANCELADO'
          GROUP BY dia`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT estado, COUNT(*) AS cantidad
           FROM pedidos
          WHERE fecha_pedido >= :desde AND fecha_pedido < :hasta
          GROUP BY estado`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT tipo_operacion AS tipo, COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS ventas
           FROM pedidos
          WHERE fecha_pedido >= :desde AND fecha_pedido < :hasta AND estado <> 'CANCELADO'
          GROUP BY tipo_operacion`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT p.id, p.codigo, p.descripcion,
                SUM(dp.cantidad) AS unidades, SUM(dp.subtotal) AS monto
           FROM detalle_pedidos dp
           JOIN pedidos ped ON dp.pedido_id = ped.id
           JOIN productos p ON dp.producto_id = p.id
          WHERE ped.fecha_pedido >= :desde AND ped.fecha_pedido < :hasta AND ped.estado <> 'CANCELADO'
          GROUP BY p.id, p.codigo, p.descripcion
          ORDER BY unidades DESC
          LIMIT 5`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT c.id, c.nombre, COUNT(*) AS pedidos, SUM(ped.total) AS monto
           FROM pedidos ped
           JOIN clientes c ON ped.cliente_id = c.id
          WHERE ped.fecha_pedido >= :desde AND ped.fecha_pedido < :hasta AND ped.estado <> 'CANCELADO'
          GROUP BY c.id, c.nombre
          ORDER BY monto DESC
          LIMIT 5`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COALESCE(cat.nombre, 'Sin categoría') AS categoria, SUM(dp.subtotal) AS monto
           FROM detalle_pedidos dp
           JOIN pedidos ped ON dp.pedido_id = ped.id
           JOIN productos p ON dp.producto_id = p.id
           LEFT JOIN categorias cat ON p.categoria_id = cat.id
          WHERE ped.fecha_pedido >= :desde AND ped.fecha_pedido < :hasta AND ped.estado <> 'CANCELADO'
          GROUP BY categoria
          ORDER BY monto DESC
          LIMIT 6`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT tipo_movimiento AS tipo, COUNT(*) AS movimientos, COALESCE(SUM(cantidad), 0) AS unidades
           FROM movimientos_stock
          WHERE fecha >= :desde AND fecha < :hasta
          GROUP BY tipo_movimiento`,
        { replacements: rep, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT SUM(stock <= stock_minimo AND stock > 0) AS bajo, SUM(stock <= 0) AS agotado
           FROM productos WHERE activo = 1`,
        { type: QueryTypes.SELECT }
      ),
    ]);

    // Serie completa: un punto por cada día del período, con ceros donde no hubo ventas
    const mapa = new Map(porDia.map((r) => [r.dia, r]));
    const serie = [];
    for (let d = new Date(desde); d < hasta; d = addDays(d, 1)) {
      const r = mapa.get(ymd(d));
      serie.push({ dia: ymd(d), ventas: r ? num(r.ventas) : 0, pedidos: r ? num(r.pedidos) : 0 });
    }

    const mov = { ENTRADA: { movimientos: 0, unidades: 0 }, SALIDA: { movimientos: 0, unidades: 0 }, AJUSTE: { movimientos: 0, unidades: 0 } };
    movimientos.forEach((m) => {
      mov[m.tipo] = { movimientos: num(m.movimientos), unidades: num(m.unidades) };
    });

    res.json({
      success: true,
      data: {
        periodo: {
          tipo,
          desde: ymd(desde),
          hasta: ymd(addDays(hasta, -1)),
          etiqueta: etiqueta(tipo, desde, hasta),
          es_actual: new Date() >= desde && new Date() < hasta,
        },
        anterior_desde: ymd(antDesde),
        actual,
        anterior,
        serie,
        por_estado: porEstado.map((r) => ({ estado: r.estado, cantidad: num(r.cantidad) })),
        por_tipo: porTipo.map((r) => ({ tipo: r.tipo, pedidos: num(r.pedidos), ventas: num(r.ventas) })),
        top_productos: topProductos.map((r) => ({
          id: num(r.id), codigo: r.codigo, descripcion: r.descripcion, unidades: num(r.unidades), monto: num(r.monto),
        })),
        top_clientes: topClientes.map((r) => ({
          id: num(r.id), nombre: r.nombre, pedidos: num(r.pedidos), monto: num(r.monto),
        })),
        por_categoria: porCategoria.map((r) => ({ categoria: r.categoria, monto: num(r.monto) })),
        movimientos_stock: mov,
        stock_actual: { bajo: num(stock[0]?.bajo), agotado: num(stock[0]?.agotado) },
      },
    });
  } catch (error) {
    console.error('Error en resumen de reportes:', error);
    res.status(500).json({ success: false, mensaje: 'No se pudo generar el resumen', error: error.message });
  }
};

module.exports = { getResumen };
