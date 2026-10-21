const { Pedido, DetallePedido, Cliente, Producto, Usuario } = require('../models');

// Obtener todos los pedidos con relaciones
exports.getAll = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'cuit', 'tipo_cliente']
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: ['id', 'username', 'rol']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'descripcion', 'precio_venta']
          }]
        }
      ],
      order: [['fecha_pedido', 'DESC']]
    });
    
    res.json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos',
      error: error.message
    });
  }
};

// Obtener pedido por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente'
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: ['id', 'username', 'rol']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto'
          }]
        }
      ]
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedido',
      error: error.message
    });
  }
};

// Crear pedido con detalles
exports.create = async (req, res) => {
  const transaction = await Pedido.sequelize.transaction();
  
  try {
    const { cliente_id, detalles, observaciones } = req.body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      throw new Error('Debe incluir al menos un producto');
    }

    // El cliente tiene que ser de este negocio (findByPk ya filtra por negocio)
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    
    // Generar número de pedido
    const ultimoPedido = await Pedido.findOne({
      order: [['id', 'DESC']],
      attributes: ['numero_pedido']
    });
    
    let numeroNuevo = 'PED-0001';
    if (ultimoPedido) {
      const num = parseInt(ultimoPedido.numero_pedido.split('-')[1]) + 1;
      numeroNuevo = `PED-${num.toString().padStart(4, '0')}`;
    }
    
    // Calcular totales
    let subtotal = 0;
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.producto_id);
      if (!producto) {
        throw new Error(`Producto ${detalle.producto_id} no encontrado`);
      }
      subtotal += detalle.cantidad * producto.precio_venta;
    }
    
    // Crear pedido
    const pedido = await Pedido.create({
      numero_pedido: numeroNuevo,
      cliente_id,
      usuario_registro_id: req.user.id,
      subtotal,
      total: subtotal,
      observaciones
    }, { transaction });
    
    // Crear detalles
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.producto_id);
      await DetallePedido.create({
        pedido_id: pedido.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: producto.precio_venta,
        subtotal: detalle.cantidad * producto.precio_venta
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener pedido completo
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: pedidoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: 'Error creando pedido',
      error: error.message
    });
  }
};

// Actualizar estado del pedido
exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const [updated] = await Pedido.update(
      { estado },
      { where: { id } }
    );
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    const pedido = await Pedido.findByPk(id);
    res.json({
      success: true,
      message: 'Estado actualizado',
      data: pedido
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error actualizando estado',
      error: error.message
    });
  }
};