const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const DetallePedido = require('../models/DetallePedido');
const Producto = require('../models/Producto');

/**
 * BÚSQUEDAS Y FILTROS AVANZADOS - PEDIDOS
 * GET /api/pedidos con múltiples parámetros de búsqueda
 */

const getPedidosConFiltros = async (req, res) => {
  try {
    const { 
      numero_pedido,    // Buscar por número exacto
      cliente_id,       // Filtro por cliente
      estado,           // PENDIENTE, PREPARANDO, LISTO, ENTREGADO, CANCELADO
      tipo_operacion,   // BLANCO, NEGRO
      fecha_desde,      // Fecha inicio
      fecha_hasta,      // Fecha fin
      monto_min,        // Monto mínimo
      monto_max,        // Monto máximo
      usuario_id,       // Usuario que registró
      order_by,         // Campo para ordenar
      order,            // ASC o DESC
      limit,
      offset
    } = req.query;

    // Construir condiciones WHERE
    let whereConditions = {};

    // Búsqueda por número de pedido
    if (numero_pedido) {
      whereConditions.numero_pedido = { [Op.like]: `%${numero_pedido}%` };
    }

    // Filtro por cliente
    if (cliente_id) {
      whereConditions.cliente_id = cliente_id;
    }

    // Filtro por estado
    if (estado) {
      whereConditions.estado = estado;
    }

    // Filtro por tipo de operación
    if (tipo_operacion) {
      whereConditions.tipo_operacion = tipo_operacion;
    }

    // Filtro por usuario
    if (usuario_id) {
      whereConditions.usuario_registro_id = usuario_id;
    }

    // Filtro por rango de fechas
    if (fecha_desde && fecha_hasta) {
      whereConditions.fecha_pedido = {
        [Op.between]: [fecha_desde, fecha_hasta + ' 23:59:59']
      };
    } else if (fecha_desde) {
      whereConditions.fecha_pedido = {
        [Op.gte]: fecha_desde
      };
    } else if (fecha_hasta) {
      whereConditions.fecha_pedido = {
        [Op.lte]: fecha_hasta + ' 23:59:59'
      };
    }

    // Filtro por rango de montos
    if (monto_min) {
      whereConditions.total = { 
        ...whereConditions.total,
        [Op.gte]: parseFloat(monto_min) 
      };
    }
    if (monto_max) {
      whereConditions.total = { 
        ...whereConditions.total,
        [Op.lte]: parseFloat(monto_max) 
      };
    }

    // Ordenamiento
    let orderClause = [['fecha_pedido', 'DESC']]; // Default
    if (order_by) {
      const validOrderFields = ['numero_pedido', 'fecha_pedido', 'total', 'estado', 'id'];
      const orderField = validOrderFields.includes(order_by) ? order_by : 'fecha_pedido';
      const orderDirection = order === 'ASC' ? 'ASC' : 'DESC';
      orderClause = [[orderField, orderDirection]];
    }

    // Paginación
    const limitValue = limit ? parseInt(limit) : 50;
    const offsetValue = offset ? parseInt(offset) : 0;

    // Ejecutar consulta
    const { count, rows } = await Pedido.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'tipo_cliente', 'condicion_iva']
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: ['id', 'username']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          attributes: ['id', 'cantidad', 'precio_unitario', 'subtotal'],
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['codigo', 'descripcion']
            }
          ]
        }
      ],
      order: orderClause,
      limit: limitValue,
      offset: offsetValue
    });

    // Metadata
    const totalPages = Math.ceil(count / limitValue);
    const currentPage = Math.floor(offsetValue / limitValue) + 1;

    // Estadísticas de los resultados
    const estadisticas = {
      total_pedidos: count,
      total_monto: rows.reduce((sum, p) => sum + parseFloat(p.total), 0),
      promedio_ticket: count > 0 ? rows.reduce((sum, p) => sum + parseFloat(p.total), 0) / count : 0
    };

    res.json({
      metadata: {
        total: count,
        limit: limitValue,
        offset: offsetValue,
        currentPage,
        totalPages
      },
      filtros_aplicados: {
        numero_pedido: numero_pedido || null,
        cliente_id: cliente_id || null,
        estado: estado || null,
        tipo_operacion: tipo_operacion || null,
        fecha_desde: fecha_desde || null,
        fecha_hasta: fecha_hasta || null,
        monto_min: monto_min || null,
        monto_max: monto_max || null
      },
      estadisticas,
      pedidos: rows
    });

  } catch (error) {
    console.error('Error en getPedidosConFiltros:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener pedidos',
      error: error.message 
    });
  }
};

/**
 * PEDIDOS PENDIENTES POR CLIENTE
 * Útil para ver pedidos pendientes de un cliente específico
 */
const getPedidosPendientesPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const pedidos = await Pedido.findAll({
      where: {
        cliente_id,
        estado: {
          [Op.in]: ['PENDIENTE', 'PREPARANDO', 'LISTO']
        }
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['codigo', 'descripcion']
            }
          ]
        }
      ],
      order: [['fecha_pedido', 'ASC']]
    });

    const total_pendiente = pedidos.reduce((sum, p) => sum + parseFloat(p.total), 0);

    res.json({
      cliente_id,
      cantidad_pedidos_pendientes: pedidos.length,
      total_pendiente,
      pedidos
    });

  } catch (error) {
    console.error('Error en getPedidosPendientesPorCliente:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener pedidos pendientes',
      error: error.message 
    });
  }
};

/**
 * ESTADÍSTICAS DE PEDIDOS POR ESTADO
 * Dashboard de estados de pedidos
 */
const getEstadisticasPorEstado = async (req, res) => {
  try {
    const estadisticas = await Pedido.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total_monto']
      ],
      group: ['estado']
    });

    res.json({
      estadisticas: estadisticas.map(e => ({
        estado: e.estado,
        cantidad: parseInt(e.dataValues.cantidad),
        total_monto: parseFloat(e.dataValues.total_monto || 0)
      }))
    });

  } catch (error) {
    console.error('Error en getEstadisticasPorEstado:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

module.exports = {
  getPedidosConFiltros,
  getPedidosPendientesPorCliente,
  getEstadisticasPorEstado
};