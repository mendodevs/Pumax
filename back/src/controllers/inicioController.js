const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { consultaNegocio } = require('../utils/tenant');

// SQL escrito a mano: siempre con :negocioId (el filtro automático por negocio no lo cubre).
const consulta = (sql, opciones) => consultaNegocio(sequelize, sql, opciones);

/**
 * DATOS PARA LA PANTALLA DE INICIO
 * GET /api/reportes/inicio
 * Una sola llamada con lo que hace falta para arrancar el día: ventas de hoy, semana y mes
 * (cada uno contra el mismo tramo del período anterior), pedidos por atender, stock a reponer,
 * últimas facturas y deuda de clientes.
 * "Ventas" = pedidos no cancelados. Todas las consultas usan replacements.
 */

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const num = (v) => Number(v) || 0;

/** Ventas y pedidos entre [desde, hasta) */
async function ventas(desde, hasta) {
  const [r] = await consulta(
    `SELECT COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS ventas
       FROM pedidos
      WHERE negocio_id = :negocioId AND fecha_pedido >= :desde AND fecha_pedido < :hasta AND estado <> 'CANCELADO'`,
    { replacements: { desde: ymd(desde), hasta: ymd(hasta) }, type: QueryTypes.SELECT }
  );
  return { pedidos: num(r.pedidos), ventas: num(r.ventas) };
}

const getInicio = async (req, res) => {
  try {
    const hoy = new Date();
    const manana = addDays(hoy, 1);
    const ayer = addDays(hoy, -1);

    const lunes = addDays(hoy, -((hoy.getDay() + 6) % 7));
    const lunesAnt = addDays(lunes, -7);
    const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    // Mismo tramo del mes anterior (si hoy es 31 y el mes anterior tiene 30 días, se corta en su fin)
    const finMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesAntHasta = new Date(Math.min(addDays(mesAnt, hoy.getDate()).getTime(), finMesAnt.getTime()));

    const [
      vHoy, vAyer, vSemana, vSemanaAnt, vMes, vMesAnt,
      serie, activos, pendientes, stock, stockCount, facturas, deuda,
    ] = await Promise.all([
      ventas(hoy, manana),
      ventas(ayer, hoy),
      ventas(lunes, manana),
      ventas(lunesAnt, addDays(lunesAnt, (hoy.getDay() + 6) % 7 + 1)),
      ventas(mes, manana),
      ventas(mesAnt, mesAntHasta),
      consulta(
        `SELECT DATE_FORMAT(fecha_pedido, '%Y-%m-%d') AS dia, COALESCE(SUM(total), 0) AS ventas
           FROM pedidos
          WHERE negocio_id = :negocioId AND fecha_pedido >= :desde AND fecha_pedido < :hasta AND estado <> 'CANCELADO'
          GROUP BY dia`,
        { replacements: { desde: ymd(addDays(hoy, -6)), hasta: ymd(manana) }, type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT estado, COUNT(*) AS cantidad
           FROM pedidos
          WHERE negocio_id = :negocioId AND estado IN ('PENDIENTE', 'PREPARANDO', 'LISTO')
          GROUP BY estado`,
        { type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT ped.id, ped.numero_pedido, ped.estado, ped.total, ped.tipo_operacion,
                DATE_FORMAT(ped.fecha_pedido, '%Y-%m-%d') AS fecha, c.nombre AS cliente
           FROM pedidos ped
           LEFT JOIN clientes c ON ped.cliente_id = c.id
          WHERE ped.negocio_id = :negocioId AND ped.estado IN ('PENDIENTE', 'PREPARANDO', 'LISTO')
          ORDER BY ped.fecha_pedido ASC, ped.id ASC
          LIMIT 6`,
        { type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT id, codigo, descripcion, stock, stock_minimo
           FROM productos
          WHERE negocio_id = :negocioId AND activo = 1 AND stock <= stock_minimo
          ORDER BY (stock - stock_minimo) ASC, id ASC
          LIMIT 6`,
        { type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT COUNT(*) AS total, COALESCE(SUM(stock <= 0), 0) AS agotados
           FROM productos WHERE negocio_id = :negocioId AND activo = 1 AND stock <= stock_minimo`,
        { type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT f.id, f.numero_factura, f.tipo_factura, f.total, f.estado,
                DATE_FORMAT(f.fecha_emision, '%Y-%m-%d') AS fecha, c.nombre AS cliente
           FROM facturas f
           LEFT JOIN clientes c ON f.cliente_id = c.id
          WHERE f.negocio_id = :negocioId
          ORDER BY f.fecha_emision DESC, f.id DESC
          LIMIT 5`,
        { type: QueryTypes.SELECT }
      ),
      consulta(
        `SELECT COUNT(*) AS clientes, COALESCE(SUM(saldo_actual), 0) AS monto
           FROM clientes WHERE negocio_id = :negocioId AND activo = 1 AND saldo_actual > 0`,
        { type: QueryTypes.SELECT }
      ),
    ]);

    const mapa = new Map(serie.map((r) => [r.dia, num(r.ventas)]));
    const ultimos7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(hoy, -i);
      ultimos7.push({ dia: ymd(d), ventas: mapa.get(ymd(d)) || 0 });
    }

    const porEstado = { PENDIENTE: 0, PREPARANDO: 0, LISTO: 0 };
    activos.forEach((r) => { porEstado[r.estado] = num(r.cantidad); });

    res.json({
      success: true,
      data: {
        hoy: { ...vHoy, anterior: vAyer },
        semana: { ...vSemana, anterior: vSemanaAnt },
        mes: { ...vMes, anterior: vMesAnt },
        ultimos_7_dias: ultimos7,
        pedidos_activos: porEstado,
        pedidos_por_atender: pendientes.map((r) => ({
          id: num(r.id), numero: r.numero_pedido, estado: r.estado, total: num(r.total),
          tipo: r.tipo_operacion, fecha: r.fecha, cliente: r.cliente || 'Sin cliente',
        })),
        stock_bajo: {
          total: num(stockCount[0]?.total),
          agotados: num(stockCount[0]?.agotados),
          items: stock.map((r) => ({
            id: num(r.id), codigo: r.codigo, descripcion: r.descripcion,
            stock: num(r.stock), minimo: num(r.stock_minimo),
          })),
        },
        ultimas_facturas: facturas.map((r) => ({
          id: num(r.id), numero: r.numero_factura, tipo: r.tipo_factura, total: num(r.total),
          estado: r.estado, fecha: r.fecha, cliente: r.cliente || 'Consumidor final',
        })),
        deuda_clientes: { clientes: num(deuda[0]?.clientes), monto: num(deuda[0]?.monto) },
      },
    });
  } catch (error) {
    console.error('Error en inicio:', error);
    res.status(500).json({ success: false, mensaje: 'No se pudo cargar el inicio', error: error.message });
  }
};

/**
 * ALERTAS LIVIANAS (para notificaciones)
 * GET /api/reportes/alertas
 * Solo dos conteos, pensado para consultarse cada minuto desde la app:
 *   - pedidos_pendientes: pedidos en estado PENDIENTE
 *   - stock_bajo / agotados: productos activos en el mínimo o por debajo / sin stock
 */
const getAlertas = async (req, res) => {
  try {
    const [[ped], [stock]] = await Promise.all([
      consulta(`SELECT COUNT(*) AS n FROM pedidos WHERE negocio_id = :negocioId AND estado = 'PENDIENTE'`, { type: QueryTypes.SELECT }),
      consulta(
        `SELECT COUNT(*) AS total, COALESCE(SUM(stock <= 0), 0) AS agotados
           FROM productos WHERE negocio_id = :negocioId AND activo = 1 AND stock <= stock_minimo`,
        { type: QueryTypes.SELECT }
      ),
    ]);
    res.json({
      success: true,
      data: {
        pedidos_pendientes: num(ped.n),
        stock_bajo: num(stock.total),
        agotados: num(stock.agotados),
      },
    });
  } catch (error) {
    console.error('Error en alertas:', error);
    res.status(500).json({ success: false, mensaje: 'No se pudieron cargar las alertas', error: error.message });
  }
};

module.exports = { getInicio, getAlertas };