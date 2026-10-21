const { IngresoMercaderia, DetalleIngreso, Proveedor, Producto, Usuario } = require('../models');

// Obtener todos los ingresos
exports.getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    
    const where = {};
    if (estado) {
      where.estado = estado;
    }
    
    const ingresos = await IngresoMercaderia.findAll({
      where,
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'nombre', 'cuit']
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: ['id', 'username']
        },
        {
          model: DetalleIngreso,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'descripcion']
          }]
        }
      ],
      order: [['fecha_registro', 'DESC']]
    });
    
    res.json({
      success: true,
      data: ingresos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ingresos',
      error: error.message
    });
  }
};

// Obtener ingreso por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingreso = await IngresoMercaderia.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: Usuario,
          as: 'usuario_registro',
          attributes: ['id', 'username']
        },
        {
          model: DetalleIngreso,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto'
          }]
        }
      ]
    });
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: ingreso
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ingreso',
      error: error.message
    });
  }
};

// Crear ingreso de mercadería
exports.create = async (req, res) => {
  const transaction = await IngresoMercaderia.sequelize.transaction();
  
  try {
    const {
      proveedor_id,
      numero_remito,
      numero_factura,
      fecha_ingreso,
      observaciones,
      detalles
    } = req.body;
    
    // Validar que existan detalles
    if (!detalles || detalles.length === 0) {
      throw new Error('Debe incluir al menos un producto');
    }

    // El proveedor tiene que ser de este negocio (findByPk ya filtra por negocio)
    const proveedor = await Proveedor.findByPk(proveedor_id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }
    
    // Calcular total
    let total_compra = 0;
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.producto_id);
      if (!producto) {
        throw new Error(`Producto ${detalle.producto_id} no encontrado`);
      }
      total_compra += detalle.cantidad * detalle.precio_compra;
    }
    
    // Crear ingreso
    const ingreso = await IngresoMercaderia.create({
      proveedor_id,
      numero_remito,
      numero_factura,
      fecha_ingreso,
      usuario_registro_id: req.user.id,
      total_compra,
      observaciones,
      estado: 'PENDIENTE'
    }, { transaction });
    
    // Crear detalles
    for (const detalle of detalles) {
      await DetalleIngreso.create({
        ingreso_id: ingreso.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_compra: detalle.precio_compra,
        subtotal: detalle.cantidad * detalle.precio_compra
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener ingreso completo
    const ingresoCompleto = await IngresoMercaderia.findByPk(ingreso.id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        {
          model: DetalleIngreso,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Ingreso de mercadería registrado. Recuerde completarlo para actualizar el stock.',
      data: ingresoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: 'Error creando ingreso',
      error: error.message
    });
  }
};

// Completar ingreso (actualiza stock - el trigger lo hace automáticamente)
exports.completar = async (req, res) => {
  const transaction = await IngresoMercaderia.sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const ingreso = await IngresoMercaderia.findByPk(id, {
      include: [{
        model: DetalleIngreso,
        as: 'detalles'
      }]
    });
    
    if (!ingreso) {
      throw new Error('Ingreso no encontrado');
    }
    
    if (ingreso.estado === 'COMPLETADO') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este ingreso ya fue completado'
      });
    }
    
    // Actualizar estado
    await ingreso.update({ estado: 'COMPLETADO' }, { transaction });
    
    // El trigger de MySQL ya actualiza el stock automáticamente
    // al tener los detalles_ingresos
    
    await transaction.commit();
    
    // Obtener ingreso actualizado
    const ingresoActualizado = await IngresoMercaderia.findByPk(id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        {
          model: DetalleIngreso,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Ingreso completado. Stock actualizado automáticamente.',
      data: ingresoActualizado
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: 'Error completando ingreso',
      error: error.message
    });
  }
};

// Verificar ingreso (cambiar a estado VERIFICADO)
exports.verificar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingreso = await IngresoMercaderia.findByPk(id);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }
    
    if (ingreso.estado !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden verificar ingresos pendientes'
      });
    }
    
    await ingreso.update({ estado: 'VERIFICADO' });
    
    res.json({
      success: true,
      message: 'Ingreso verificado',
      data: ingreso
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error verificando ingreso',
      error: error.message
    });
  }
};