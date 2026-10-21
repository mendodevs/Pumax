const sequelize = require('../config/database');
const { QueryTypes, Op } = require('sequelize');
const Pedido = require('../models/Pedido');
const Factura = require('../models/Factura');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const DetallePedido = require('../models/DetallePedido');
const Categoria = require('../models/Categoria');
const { negocioRequerido, consultaNegocio } = require('../utils/tenant');

// SQL escrito a mano: siempre con :negocioId y parámetros (nunca texto pegado en el SQL).
const consulta = (sql, opciones) => consultaNegocio(sequelize, sql, opciones);

// LIMIT seguro: entero entre 1 y 500
const limiteSeguro = (v, def = 20) => Math.min(Math.max(parseInt(v, 10) || def, 1), 500);

/**
 * MÓDULO DE REPORTES - PUMAX
 * Endpoints para análisis de negocio, ventas, stock y facturación
 */

// ============================================
// 1. DASHBOARD COMPLETO
// ============================================
const getDashboard = async (req, res) => {
  try {
    const negocioId = negocioRequerido();
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);

    // ============================================
    // 1. KPIs PRINCIPALES
    // ============================================

    // Ventas del mes actual
    const ventasMesActual = await Pedido.sum('total', {
      where: {
        negocio_id: negocioId,
        fecha_pedido: { [Op.gte]: primerDiaMes },
        estado: 'ENTREGADO'
      }
    }) || 0;

    // Ventas del mes anterior
    const ventasMesAnterior = await Pedido.sum('total', {
      where: {
        negocio_id: negocioId,
        fecha_pedido: {
          [Op.between]: [primerDiaMesAnterior, ultimoDiaMesAnterior]
        },
        estado: 'ENTREGADO'
      }
    }) || 0;

    // Crecimiento vs mes anterior
    const crecimientoVentas = ventasMesAnterior > 0 
      ? ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior * 100).toFixed(2)
      : 0;

    // Facturación del mes
    const facturacionMes = await Factura.sum('total', {
      where: {
        negocio_id: negocioId,
        fecha_emision: { [Op.gte]: primerDiaMes },
        estado: 'EMITIDA'
      }
    }) || 0;

    // Cantidad de pedidos del mes
    const pedidosMes = await Pedido.count({
      where: {
        fecha_pedido: { [Op.gte]: primerDiaMes }
      }
    });

    // Ticket promedio
    const ticketPromedio = pedidosMes > 0 ? ventasMesActual / pedidosMes : 0;

    // Pedidos pendientes
    const pedidosPendientes = await Pedido.count({
      where: {
        estado: { [Op.in]: ['PENDIENTE', 'PREPARANDO', 'LISTO'] }
      }
    });

    // Alertas de stock usando SQL raw
    const [stockResult] = await consulta(`
      SELECT COUNT(*) as alertas_stock
      FROM productos 
      WHERE negocio_id = :negocioId AND stock <= stock_minimo AND activo = 1
    `, { type: QueryTypes.SELECT });
    const alertasStock = stockResult.alertas_stock;

    // Productos sin stock
    const productosSinStock = await Producto.count({
      where: { stock: 0, activo: true }
    });

    // Total clientes activos
    const clientesActivos = await Cliente.count({
      where: { activo: true }
    });

    // Nuevos clientes este mes
    const nuevosClientes = await Cliente.count({
      where: {
        fecha_creacion: { [Op.gte]: primerDiaMes }
      }
    });

    // ============================================
    // 2. VENTAS POR TIPO (BLANCO vs NEGRO)
    // ============================================
    const ventasPorTipo = await Pedido.findAll({
      attributes: [
        'tipo_operacion',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_pedido: { [Op.gte]: primerDiaMes },
        estado: 'ENTREGADO'
      },
      group: ['tipo_operacion'],
      raw: true
    });

    const ventas_blanco = ventasPorTipo.find(v => v.tipo_operacion === 'BLANCO');
    const ventas_negro = ventasPorTipo.find(v => v.tipo_operacion === 'NEGRO');

    const porcentajeBlanco = ventasMesActual > 0 
      ? ((parseFloat(ventas_blanco?.total || 0) / ventasMesActual) * 100).toFixed(1)
      : 0;
    
    const porcentajeNegro = ventasMesActual > 0 
      ? ((parseFloat(ventas_negro?.total || 0) / ventasMesActual) * 100).toFixed(1)
      : 0;

    // ============================================
    // 3. VENTAS POR MES (GRÁFICA LINEAL)
    // ============================================
    const ventasPorMes = await Pedido.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pedido'), '%Y-%m'), 'mes'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: {
        fecha_pedido: { [Op.gte]: inicioAnio },
        estado: 'ENTREGADO'
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pedido'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pedido'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // ============================================
    // 4. TOP 5 PRODUCTOS MÁS VENDIDOS
    // ============================================
    const topProductos = await DetallePedido.findAll({
      attributes: [
        'producto_id',
        [sequelize.fn('SUM', sequelize.col('DetallePedido.cantidad')), 'cantidad_vendida'],
        [sequelize.fn('SUM', sequelize.col('DetallePedido.subtotal')), 'total_vendido']
      ],
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['codigo', 'descripcion', 'precio_venta']
        },
        {
          model: Pedido,
          as: 'pedido',
          attributes: [],
          where: {
            negocio_id: negocioId,
            fecha_pedido: { [Op.gte]: primerDiaMes },
            estado: 'ENTREGADO'
          }
        }
      ],
      group: ['producto_id'],
      order: [[sequelize.fn('SUM', sequelize.col('DetallePedido.cantidad')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    // ============================================
    // 5. TOP 5 CLIENTES DEL MES
    // ============================================
    const topClientes = await Pedido.findAll({
      attributes: [
        'cliente_id',
        [sequelize.fn('COUNT', sequelize.col('Pedido.id')), 'cantidad_pedidos'],
        [sequelize.fn('SUM', sequelize.col('Pedido.total')), 'total_comprado']
      ],
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'tipo_cliente']
        }
      ],
      where: {
        fecha_pedido: { [Op.gte]: primerDiaMes },
        estado: 'ENTREGADO'
      },
      group: ['cliente_id'],
      order: [[sequelize.fn('SUM', sequelize.col('Pedido.total')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    // ============================================
    // 6. FACTURACIÓN POR TIPO
    // ============================================
    const facturacionPorTipo = await Factura.findAll({
      attributes: [
        'tipo_factura',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_emision: { [Op.gte]: primerDiaMes },
        estado: 'EMITIDA'
      },
      group: ['tipo_factura'],
      raw: true
    });

    // ============================================
    // 7. PEDIDOS POR ESTADO
    // ============================================
    const pedidosPorEstado = await Pedido.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['estado'],
      raw: true
    });

    // ============================================
    // 8. ESTADÍSTICAS DEL DÍA
    // ============================================
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const ventasHoy = await Pedido.sum('total', {
      where: {
        negocio_id: negocioId,
        fecha_pedido: { [Op.gte]: hoyInicio },
        estado: 'ENTREGADO'
      }
    }) || 0;

    const pedidosHoy = await Pedido.count({
      where: {
        fecha_pedido: { [Op.gte]: hoyInicio }
      }
    });

    // ============================================
    // RESPUESTA COMPLETA (formato compatible con frontend)
    // ============================================
    res.json({
      success: true,
      data: {
        // KPIs Principales - Formato plano para el frontend
        kpis: {
          ventas_totales: pedidosMes,
          facturacion_total: parseFloat(facturacionMes.toFixed(2)),
          ticket_promedio: parseFloat(ticketPromedio.toFixed(2)),
          pedidos_pendientes: pedidosPendientes,
          stock_critico: alertasStock,
          clientes_activos: clientesActivos,
          productos_vendidos: pedidosMes, // Cantidad de pedidos como productos vendidos
          crecimiento_vs_mes_anterior: parseFloat(crecimientoVentas)
        },

        // Gráfica: Ventas BLANCO vs NEGRO (keys en mayúsculas)
        ventas_por_tipo: {
          BLANCO: parseFloat(ventas_blanco?.total || 0),
          NEGRO: parseFloat(ventas_negro?.total || 0)
        },

        // Gráfica: Evolución de ventas por mes
        evolucion_ventas: ventasPorMes.map(v => ({
          mes: v.mes,
          ventas: parseFloat(v.total)
        })),

        // Top 5 productos más vendidos
        top_productos: topProductos.map(p => ({
          producto_id: p.producto_id,
          nombre: p.producto.descripcion,
          cantidad_vendida: parseInt(p.cantidad_vendida),
          monto_total: parseFloat(p.total_vendido)
        })),

        // Top 5 clientes
        top_clientes: topClientes.map(c => ({
          cliente_id: c.cliente_id,
          nombre: c.cliente.nombre,
          total_compras: parseFloat(c.total_comprado),
          cantidad_pedidos: parseInt(c.cantidad_pedidos)
        })),

        // Facturación por tipo de factura
        facturacion_por_tipo: {
          A: parseFloat(facturacionPorTipo.find(f => f.tipo_factura === 'A')?.total || 0),
          B: parseFloat(facturacionPorTipo.find(f => f.tipo_factura === 'B')?.total || 0),
          C: parseFloat(facturacionPorTipo.find(f => f.tipo_factura === 'C')?.total || 0),
          NEGRO: parseFloat(facturacionPorTipo.find(f => f.tipo_factura === 'NEGRO')?.total || 0)
        },

        // Pedidos por estado
        pedidos_por_estado: {
          PENDIENTE: parseInt(pedidosPorEstado.find(p => p.estado === 'PENDIENTE')?.cantidad || 0),
          EN_PROCESO: parseInt(pedidosPorEstado.find(p => p.estado === 'EN_PROCESO')?.cantidad || 0),
          COMPLETADO: parseInt(pedidosPorEstado.find(p => p.estado === 'COMPLETADO')?.cantidad || 0),
          CANCELADO: parseInt(pedidosPorEstado.find(p => p.estado === 'CANCELADO')?.cantidad || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error en getDashboardMejorado:', error);
    res.status(500).json({
      mensaje: 'Error al obtener datos del dashboard mejorado',
      error: error.message
    });
  }
};

// ============================================
// 2. REPORTE DE VENTAS POR PERÍODO
// ============================================
const getVentasPorPeriodo = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo_operacion } = req.query;

    // Validar fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta (formato: YYYY-MM-DD)' 
      });
    }

    let whereClause = `
      WHERE p.negocio_id = :negocioId
        AND p.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
        AND p.estado != 'CANCELADO'
    `;
    const replacements = { fecha_desde, fecha_hasta };

    // Filtro opcional por tipo de operación (BLANCO/NEGRO)
    if (tipo_operacion) {
      whereClause += ' AND p.tipo_operacion = :tipo_operacion';
      replacements.tipo_operacion = tipo_operacion;
    }

    // Resumen general
    const resumenQuery = `
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as total_vendido,
        COALESCE(AVG(total), 0) as ticket_promedio,
        tipo_operacion,
        COUNT(DISTINCT cliente_id) as clientes_unicos
      FROM pedidos p
      ${whereClause}
      GROUP BY tipo_operacion
    `;

    // Ventas por día
    const ventasPorDiaQuery = `
      SELECT 
        DATE(fecha_pedido) as fecha,
        COUNT(*) as cantidad_pedidos,
        COALESCE(SUM(total), 0) as total_dia,
        tipo_operacion
      FROM pedidos p
      ${whereClause}
      GROUP BY DATE(fecha_pedido), tipo_operacion
      ORDER BY fecha DESC
    `;

    // Ventas por cliente
    const ventasPorClienteQuery = `
      SELECT 
        c.id,
        c.nombre,
        c.tipo_cliente,
        COUNT(p.id) as cantidad_pedidos,
        COALESCE(SUM(p.total), 0) as total_comprado
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      ${whereClause}
      GROUP BY c.id, c.nombre, c.tipo_cliente
      ORDER BY total_comprado DESC
    `;

    const resumen = await consulta(resumenQuery, { replacements, type: QueryTypes.SELECT });
    const ventasPorDia = await consulta(ventasPorDiaQuery, { replacements, type: QueryTypes.SELECT });
    const ventasPorCliente = await consulta(ventasPorClienteQuery, { replacements, type: QueryTypes.SELECT });

    res.json({
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      resumen,
      ventas_por_dia: ventasPorDia,
      ventas_por_cliente: ventasPorCliente
    });

  } catch (error) {
    console.error('Error en getVentasPorPeriodo:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener reporte de ventas',
      error: error.message 
    });
  }
};

// ============================================
// 3. REPORTE DE STOCK CRÍTICO
// ============================================
const getStockCritico = async (req, res) => {
  try {
    const { categoria_id } = req.query;
    
    let whereClause = `
      WHERE p.negocio_id = :negocioId
        AND p.stock <= p.stock_minimo
        AND p.activo = 1
    `;
    const replacements = {};

    // Filtro por categoría
    if (categoria_id) {
      whereClause += ' AND p.categoria_id = :categoria_id';
      replacements.categoria_id = categoria_id;
    }
    
    // Usar la vista existente o query directa
    const stockCriticoQuery = `
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        c.nombre as categoria,
        c.id as categoria_id,
        p.stock as stock_actual,
        p.stock_minimo,
        (p.stock_minimo - p.stock) as unidades_faltantes,
        p.precio_venta,
        (p.stock_minimo - p.stock) * p.precio_base as costo_reposicion_estimado
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY (p.stock_minimo - p.stock) DESC
    `;

    const productosStockBajo = await consulta(stockCriticoQuery, { replacements, type: QueryTypes.SELECT });

    // Resumen
    const resumen = {
      total_productos_criticos: productosStockBajo.length,
      valor_reposicion_total: productosStockBajo.reduce((sum, p) => sum + parseFloat(p.costo_reposicion_estimado || 0), 0),
      productos_sin_stock: productosStockBajo.filter(p => p.stock_actual === 0).length
    };

    res.json({
      resumen,
      productos: productosStockBajo
    });

  } catch (error) {
    console.error('Error en getStockCritico:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener reporte de stock crítico',
      error: error.message 
    });
  }
};

// ============================================
// 4. REPORTE DE FACTURACIÓN
// ============================================
const getReporteFacturacion = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo_factura } = req.query;

    // Validar fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta (formato: YYYY-MM-DD)' 
      });
    }

    let whereClause = `
      WHERE f.negocio_id = :negocioId
        AND f.fecha_emision BETWEEN :fecha_desde AND :fecha_hasta
        AND f.estado = 'EMITIDA'
    `;
    const replacements = { fecha_desde, fecha_hasta };

    if (tipo_factura) {
      whereClause += ' AND f.tipo_factura = :tipo_factura';
      replacements.tipo_factura = tipo_factura;
    }

    // Resumen por tipo de factura
    const resumenQuery = `
      SELECT 
        tipo_factura,
        COUNT(*) as cantidad,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(iva_105), 0) as total_iva_105,
        COALESCE(SUM(iva_21), 0) as total_iva_21,
        COALESCE(SUM(total), 0) as total_facturado
      FROM facturas f
      ${whereClause}
      GROUP BY tipo_factura
    `;

    // Facturación por día
    const facturacionDiariaQuery = `
      SELECT 
        DATE(fecha_emision) as fecha,
        tipo_factura,
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total_dia
      FROM facturas f
      ${whereClause}
      GROUP BY DATE(fecha_emision), tipo_factura
      ORDER BY fecha DESC
    `;

    // Top clientes facturados
    const topClientesQuery = `
      SELECT 
        c.id,
        c.nombre,
        c.tipo_cliente,
        c.condicion_iva,
        COUNT(f.id) as cantidad_facturas,
        COALESCE(SUM(f.total), 0) as total_facturado
      FROM facturas f
      INNER JOIN clientes c ON f.cliente_id = c.id
      ${whereClause}
      GROUP BY c.id, c.nombre, c.tipo_cliente, c.condicion_iva
      ORDER BY total_facturado DESC
      LIMIT 10
    `;

    const resumen = await consulta(resumenQuery, { replacements, type: QueryTypes.SELECT });
    const facturacionDiaria = await consulta(facturacionDiariaQuery, { replacements, type: QueryTypes.SELECT });
    const topClientes = await consulta(topClientesQuery, { replacements, type: QueryTypes.SELECT });

    // Calcular totales generales
    const totales = {
      total_facturas: resumen.reduce((sum, r) => sum + r.cantidad, 0),
      total_subtotal: resumen.reduce((sum, r) => sum + parseFloat(r.total_subtotal), 0),
      total_iva: resumen.reduce((sum, r) => sum + parseFloat(r.total_iva_105) + parseFloat(r.total_iva_21), 0),
      total_facturado: resumen.reduce((sum, r) => sum + parseFloat(r.total_facturado), 0)
    };

    res.json({
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      totales,
      resumen_por_tipo: resumen,
      facturacion_diaria: facturacionDiaria,
      top_clientes: topClientes
    });

  } catch (error) {
    console.error('Error en getReporteFacturacion:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener reporte de facturación',
      error: error.message 
    });
  }
};

// ============================================
// 5. TOP PRODUCTOS MÁS VENDIDOS
// ============================================
const getTopProductos = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, limit = 20, categoria_id } = req.query;

    // Validar fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta (formato: YYYY-MM-DD)' 
      });
    }

    let whereClause = `
      WHERE ped.negocio_id = :negocioId
        AND ped.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
        AND ped.estado != 'CANCELADO'
    `;
    const replacements = { fecha_desde, fecha_hasta, limit: limiteSeguro(limit) };

    // Filtro por categoría
    if (categoria_id) {
      whereClause += ' AND p.categoria_id = :categoria_id';
      replacements.categoria_id = categoria_id;
    }

    const topProductosQuery = `
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        c.nombre as categoria,
        c.id as categoria_id,
        SUM(dp.cantidad) as cantidad_vendida,
        SUM(dp.subtotal) as total_vendido,
        AVG(dp.precio_unitario) as precio_promedio,
        COUNT(DISTINCT dp.pedido_id) as cantidad_pedidos,
        p.stock as stock_actual,
        p.margen_ganancia,
        SUM(dp.subtotal) * (p.margen_ganancia / 100) as ganancia_estimada
      FROM detalle_pedidos dp
      INNER JOIN productos p ON dp.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN pedidos ped ON dp.pedido_id = ped.id
      ${whereClause}
      GROUP BY p.id, p.codigo, p.descripcion, c.nombre, c.id, p.stock, p.margen_ganancia
      ORDER BY cantidad_vendida DESC
      LIMIT :limit
    `;

    const topProductos = await consulta(topProductosQuery, { replacements, type: QueryTypes.SELECT });

    // Calcular totales
    const totales = {
      total_unidades_vendidas: topProductos.reduce((sum, p) => sum + parseInt(p.cantidad_vendida), 0),
      total_vendido: topProductos.reduce((sum, p) => sum + parseFloat(p.total_vendido), 0),
      ganancia_total_estimada: topProductos.reduce((sum, p) => sum + parseFloat(p.ganancia_estimada), 0)
    };

    res.json({
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      totales,
      productos: topProductos
    });

  } catch (error) {
    console.error('Error en getTopProductos:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener top productos',
      error: error.message 
    });
  }
};

// ============================================
// 6. TOP CLIENTES
// ============================================
const getTopClientes = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, limit = 20 } = req.query;

    // Validar fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta (formato: YYYY-MM-DD)' 
      });
    }

    const replacements = { fecha_desde, fecha_hasta, limit: limiteSeguro(limit) };

    const topClientesQuery = `
      SELECT 
        c.id,
        c.nombre,
        c.razon_social,
        c.tipo_cliente,
        c.condicion_iva,
        c.localidad,
        c.provincia,
        COUNT(p.id) as cantidad_pedidos,
        SUM(p.total) as total_comprado,
        AVG(p.total) as ticket_promedio,
        MAX(p.fecha_pedido) as ultima_compra,
        SUM(CASE WHEN p.tipo_operacion = 'BLANCO' THEN p.total ELSE 0 END) as total_blanco,
        SUM(CASE WHEN p.tipo_operacion = 'NEGRO' THEN p.total ELSE 0 END) as total_negro
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      WHERE p.negocio_id = :negocioId
        AND p.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
        AND p.estado != 'CANCELADO'
      GROUP BY c.id, c.nombre, c.razon_social, c.tipo_cliente, c.condicion_iva, c.localidad, c.provincia
      ORDER BY total_comprado DESC
      LIMIT :limit
    `;

    const topClientes = await consulta(topClientesQuery, { replacements, type: QueryTypes.SELECT });

    // Calcular totales
    const totales = {
      total_clientes: topClientes.length,
      total_vendido: topClientes.reduce((sum, c) => sum + parseFloat(c.total_comprado), 0),
      total_pedidos: topClientes.reduce((sum, c) => sum + parseInt(c.cantidad_pedidos), 0)
    };

    res.json({
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      totales,
      clientes: topClientes
    });

  } catch (error) {
    console.error('Error en getTopClientes:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener top clientes',
      error: error.message 
    });
  }
};

// ============================================
// 7. MOVIMIENTOS DE STOCK
// ============================================
const getMovimientosStock = async (req, res) => {
  try {
    const { producto_id, fecha_desde, fecha_hasta, tipo_movimiento } = req.query;

    let whereClause = 'WHERE ms.negocio_id = :negocioId';
    const replacements = {};

    if (producto_id) {
      whereClause += ' AND ms.producto_id = :producto_id';
      replacements.producto_id = producto_id;
    }

    if (fecha_desde && fecha_hasta) {
      whereClause += ' AND ms.fecha BETWEEN :fecha_desde AND :fecha_hasta';
      replacements.fecha_desde = fecha_desde;
      replacements.fecha_hasta = fecha_hasta;
    }

    if (tipo_movimiento) {
      whereClause += ' AND ms.tipo_movimiento = :tipo_movimiento';
      replacements.tipo_movimiento = tipo_movimiento;
    }

    const movimientosQuery = `
      SELECT
        ms.id,
        ms.producto_id,
        ms.fecha,
        ms.tipo_movimiento,
        ms.cantidad,
        ms.stock_anterior,
        ms.stock_nuevo,
        ms.observaciones as motivo,
        p.descripcion as producto_nombre,
        u.username as usuario
      FROM movimientos_stock ms
      INNER JOIN productos p ON ms.producto_id = p.id
      LEFT JOIN usuarios u ON ms.usuario_id = u.id
      ${whereClause}
      ORDER BY ms.fecha DESC, ms.id DESC
      LIMIT 100
    `;

    const movimientos = await consulta(movimientosQuery, { replacements, type: QueryTypes.SELECT });

    // Formatear respuesta para el frontend
    res.json({
      success: true,
      data: movimientos.map(m => ({
        id: m.id,
        producto_id: m.producto_id,
        producto_nombre: m.producto_nombre,
        tipo_movimiento: m.tipo_movimiento,
        cantidad: m.cantidad,
        stock_anterior: m.stock_anterior,
        stock_nuevo: m.stock_nuevo,
        motivo: m.motivo,
        usuario: m.usuario,
        fecha: m.fecha
      }))
    });

  } catch (error) {
    console.error('Error en getMovimientosStock:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener movimientos de stock',
      error: error.message 
    });
  }
};

// ============================================
// 8. REPORTE DE RENTABILIDAD POR CATEGORÍA
// ============================================
const getRentabilidadCategorias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, categoria_id } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta (formato: YYYY-MM-DD)' 
      });
    }

    let whereClause = `
      WHERE ped.negocio_id = :negocioId
        AND ped.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
        AND ped.estado != 'CANCELADO'
    `;
    const replacements = { fecha_desde, fecha_hasta };

    // Filtro por categoría específica
    if (categoria_id) {
      whereClause += ' AND c.id = :categoria_id';
      replacements.categoria_id = categoria_id;
    }

    const rentabilidadQuery = `
      SELECT 
        c.id,
        c.nombre as categoria,
        COUNT(DISTINCT p.id) as productos_en_categoria,
        SUM(dp.cantidad) as unidades_vendidas,
        SUM(dp.subtotal) as total_vendido,
        AVG(p.margen_ganancia) as margen_promedio,
        SUM(dp.subtotal * (p.margen_ganancia / 100)) as ganancia_estimada
      FROM detalle_pedidos dp
      INNER JOIN productos p ON dp.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN pedidos ped ON dp.pedido_id = ped.id
      ${whereClause}
      GROUP BY c.id, c.nombre
      ORDER BY ganancia_estimada DESC
    `;

    const rentabilidad = await consulta(rentabilidadQuery, { replacements, type: QueryTypes.SELECT });

    const totales = {
      total_vendido: rentabilidad.reduce((sum, r) => sum + parseFloat(r.total_vendido), 0),
      ganancia_total: rentabilidad.reduce((sum, r) => sum + parseFloat(r.ganancia_estimada), 0)
    };

    res.json({
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      totales,
      categorias: rentabilidad
    });

  } catch (error) {
    console.error('Error en getRentabilidadCategorias:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener rentabilidad por categorías',
      error: error.message 
    });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  getDashboard,
  getVentasPorPeriodo,
  getStockCritico,
  getReporteFacturacion,
  getTopProductos,
  getTopClientes,
  getMovimientosStock,
  getRentabilidadCategorias
};