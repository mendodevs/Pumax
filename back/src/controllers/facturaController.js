const { Factura, Pedido, Cliente, DetallePedido, Producto, DetalleFactura } = require('../models');
const { generarPDFFactura } = require('../services/pdfGenerator');
const arcaService = require('../services/arca');

// Obtener todas las facturas
exports.getAll = async (req, res) => {
  try {
    const { tipo_factura } = req.query; // Filtrar por tipo si se necesita
    
    const where = {};
    if (tipo_factura) {
      where.tipo_factura = tipo_factura;
    }
    
    const facturas = await Factura.findAll({
      where,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'cuit', 'condicion_iva']
        },
        {
          model: Pedido,
          as: 'pedido',
          attributes: ['id', 'numero_pedido']
        }
      ],
      order: [['fecha_emision', 'DESC']]
    });
    
    res.json({
      success: true,
      data: facturas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo facturas',
      error: error.message
    });
  }
};

// Obtener factura por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const factura = await Factura.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente'
        },
        {
          model: Pedido,
          as: 'pedido',
          include: [{
            model: DetallePedido,
            as: 'detalles',
            include: [{
              model: Producto,
              as: 'producto'
            }]
          }]
        }
      ]
    });
    
    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: factura
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo factura',
      error: error.message
    });
  }
};

// Crear factura en NEGRO (Comprobante interno sin ARCA)
exports.createNegro = async (req, res) => {
  const transaction = await Factura.sequelize.transaction();
  
  try {
    const { pedido_id, cliente_id, observaciones, items } = req.body;
    let subtotal = 0;
    let total = 0;
    let clienteIdFinal = cliente_id;
    let pedido = null;
    let detallesFactura = [];

    // Flujo 1: Si viene de un pedido existente
    if (pedido_id) {
      pedido = await Pedido.findByPk(pedido_id, {
        include: [{
          model: DetallePedido,
          as: 'detalles'
        }]
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      clienteIdFinal = pedido.cliente_id;
      subtotal = pedido.subtotal;
      total = pedido.total;

    // Flujo 2: Venta directa en negro con items
    } else if (items && Array.isArray(items) && items.length > 0) {
      if (!cliente_id) {
        throw new Error('Debe especificar un cliente_id');
      }
      const clienteDirecto = await Cliente.findByPk(cliente_id);
      if (!clienteDirecto) {
        throw new Error('Cliente no encontrado');
      }
      for (const item of items) {
        if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
          throw new Error('Items inválidos: deben incluir producto_id, cantidad y precio_unitario');
        }
        const producto = await Producto.findByPk(item.producto_id);
        if (!producto) {
          throw new Error(`Producto ${item.producto_id} no encontrado`);
        }
        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para producto ${producto.descripcion}`);
        }

        const cantidad = parseFloat(item.cantidad);
        const precioUnitario = parseFloat(item.precio_unitario);
        const subtotalItem = cantidad * precioUnitario;
        subtotal += subtotalItem;
        detallesFactura.push({
          producto_id: item.producto_id,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotalItem
        });
      }
      total = subtotal;
    } else {
      throw new Error('Debe proporcionar pedido_id o items para crear la factura en negro');
    }
    
    // Generar número de factura NEGRO correlativo
    const ultimaFacturaNegro = await Factura.findOne({
      where: { tipo_factura: 'NEGRO' },
      order: [['id', 'DESC']],
      attributes: ['numero_factura']
    });
    
    let numeroNuevo = 'NEG-0001';
    if (ultimaFacturaNegro) {
      const num = parseInt(ultimaFacturaNegro.numero_factura.split('-')[1]) + 1;
      numeroNuevo = `NEG-${num.toString().padStart(4, '0')}`;
    }
    
    // Crear factura en negro (sin CAE, sin impacto impositivo en ARCA)
    const factura = await Factura.create({
      numero_factura: numeroNuevo,
      pedido_id: pedido_id || null,
      cliente_id: clienteIdFinal,
      tipo_factura: 'NEGRO',
      subtotal,
      iva_21: 0.00,
      iva_105: 0.00,
      total,
      estado: 'EMITIDA',
      observaciones,
      usuario_emision_id: req.user.id
    }, { transaction });
    
    // Si viene de pedido, actualizar estado y descontar stock de cada producto
    if (pedido_id && pedido) {
      await Pedido.update(
        { estado: 'ENTREGADO' },
        { where: { id: pedido_id }, transaction }
      );

      const detallesPedido = pedido.detalles || [];
      for (const detallePedido of detallesPedido) {
        // Descontar stock físico real
        await Producto.decrement('stock', {
          by: detallePedido.cantidad,
          where: { id: detallePedido.producto_id },
          transaction
        });

        await DetalleFactura.create({
          factura_id: factura.id,
          producto_id: detallePedido.producto_id,
          cantidad: detallePedido.cantidad,
          precio_unitario: detallePedido.precio_unitario,
          subtotal: detallePedido.subtotal
        }, { transaction });
      }
    } else {
      // Venta directa: descontar stock de cada ítem
      for (const det of detallesFactura) {
        await Producto.decrement('stock', {
          by: det.cantidad,
          where: { id: det.producto_id },
          transaction
        });

        await DetalleFactura.create({
          factura_id: factura.id,
          producto_id: det.producto_id,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario,
          subtotal: det.subtotal
        }, { transaction });
      }
    }

    await transaction.commit();
    
    const facturaCompleta = await Factura.findByPk(factura.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Pedido, as: 'pedido' }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Factura en negro creada exitosamente (stock físico descontado)',
      data: facturaCompleta
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: 'Error creando factura en negro',
      error: error.message
    });
  }
};

// Crear factura LEGAL (con ARCA)
exports.createLegal = async (req, res) => {
  const transaction = await Factura.sequelize.transaction();

  try {
    const { pedido_id, cliente_id, tipo_factura, observaciones, items } = req.body;

    // Validar tipo de factura
    if (!['A', 'B', 'C'].includes(tipo_factura)) {
      throw new Error('Tipo de factura inválido');
    }

    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) throw new Error('Cliente no encontrado');

    // Variables para subtotal y detalles
    let subtotal = 0;
    let detallesFactura = [];
    let pedido = null;

    // FLUJO 1: Si hay pedido_id, usar datos del pedido (flujo original)
    if (pedido_id) {
      pedido = await Pedido.findByPk(pedido_id, {
        include: [{
          model: DetallePedido,
          as: 'detalles'
        }]
      });

      if (!pedido) throw new Error('Pedido no encontrado');
      subtotal = pedido.subtotal;

    // FLUJO 2: Si NO hay pedido_id pero hay items, calcular desde items directos
    } else if (items && Array.isArray(items) && items.length > 0) {
      // Validar que todos los items tengan los campos necesarios
      for (const item of items) {
        if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
          throw new Error('Items inválidos: deben incluir producto_id, cantidad y precio_unitario');
        }

        // Verificar que el producto existe y tiene stock
        const producto = await Producto.findByPk(item.producto_id);
        if (!producto) {
          throw new Error(`Producto ${item.producto_id} no encontrado`);
        }
        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para producto ${producto.descripcion}`);
        }

        // Convertir a números por si vienen como strings
        const cantidad = parseFloat(item.cantidad);
        const precioUnitario = parseFloat(item.precio_unitario);

        // Calcular subtotal del item
        const subtotalItem = cantidad * precioUnitario;
        subtotal += subtotalItem;

        // Guardar info para actualizar stock después
        detallesFactura.push({
          producto_id: item.producto_id,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotalItem
        });
      }
    } else {
      throw new Error('Debe proporcionar pedido_id o items para crear la factura');
    }

    // Redondear subtotal a 2 decimales
    subtotal = Math.round(subtotal * 100) / 100;

    // Validar condición IVA del cliente vs tipo de factura
    const validacion = validarTipoFactura(cliente.condicion_iva, tipo_factura);
    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    // Calcular IVA según el tipo de factura
    let iva_21 = 0.00;
    let iva_105 = 0.00;
    let total = subtotal;

    if (tipo_factura === 'A') {
      // Factura A: IVA discriminado
      iva_21 = Math.round(subtotal * 0.21 * 100) / 100;
      total = Math.round((subtotal + iva_21) * 100) / 100;
    } else if (tipo_factura === 'B') {
      // Factura B: IVA incluido
      // El subtotal ya incluye IVA, calculamos el IVA para registro
      iva_21 = Math.round((subtotal / 1.21) * 0.21 * 100) / 100;
      total = Math.round(subtotal * 100) / 100;
    }
    // Factura C: sin IVA
    
    // Obtener configuración de punto de venta
    const config = await obtenerConfiguracion('punto_venta');
    const punto_venta = config || '00001';
    
    // Generar número de factura
    const ultimaFactura = await Factura.findOne({
      where: { 
        tipo_factura,
        punto_venta 
      },
      order: [['id', 'DESC']],
      attributes: ['numero_factura']
    });
    
    let numeroNuevo = `${punto_venta}-00000001`;
    if (ultimaFactura) {
      const partes = ultimaFactura.numero_factura.split('-');
      const num = parseInt(partes[1]) + 1;
      numeroNuevo = `${punto_venta}-${num.toString().padStart(8, '0')}`;
    }
    
    // Solicitar autorización fiscal a ARCA (o modo simulado si aún no hay certificados)
    const numeroSugerido = ultimaFactura ? parseInt(ultimaFactura.numero_factura.split('-')[1], 10) + 1 : 1;
    const responseArca = await arcaService.solicitarCAE({
      tipoFactura: tipo_factura,
      puntoVenta: parseInt(punto_venta, 10),
      numeroComprobante: numeroSugerido,
      cliente,
      subtotal,
      iva21: iva_21,
      iva105: iva_105,
      total
    });

    if (!responseArca.success) {
      throw new Error(`Error ARCA: ${responseArca.error || 'No se pudo autorizar el comprobante'}`);
    }

    const numeroFinal = responseArca.numero_comprobante
      ? `${punto_venta}-${String(responseArca.numero_comprobante).padStart(8, '0')}`
      : numeroNuevo;

    // Crear factura con CAE
    const factura = await Factura.create({
      numero_factura: numeroFinal,
      pedido_id: pedido_id || null,
      cliente_id,
      tipo_factura,
      punto_venta,
      subtotal: subtotal,
      iva_21,
      iva_105,
      total,
      cae: responseArca.cae,
      vencimiento_cae: responseArca.vencimiento_cae,
      estado: 'EMITIDA',
      observaciones,
      usuario_emision_id: req.user.id
    }, { transaction });

    // Si hay pedido, actualizar su estado
    if (pedido_id) {
      await Pedido.update(
        { estado: 'ENTREGADO' },
        { where: { id: pedido_id }, transaction }
      );
    }

    // Si NO hay pedido (flujo directo con items), actualizar stock de productos Y guardar detalles
    if (!pedido_id && detallesFactura.length > 0) {
      for (const detalle of detallesFactura) {
        // Decrementar stock
        await Producto.decrement(
          'stock',
          {
            by: detalle.cantidad,
            where: { id: detalle.producto_id },
            transaction
          }
        );

        // Guardar detalle de factura
        await DetalleFactura.create({
          factura_id: factura.id,
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal
        }, { transaction });
      }
    }

    // Si hay pedido, copiar los detalles del pedido a la factura Y descontar stock físico
    if (pedido_id && pedido) {
      const detallesPedido = await DetallePedido.findAll({
        where: { pedido_id: pedido_id },
        transaction
      });

      for (const detallePedido of detallesPedido) {
        // Descontar stock físico real
        await Producto.decrement(
          'stock',
          {
            by: detallePedido.cantidad,
            where: { id: detallePedido.producto_id },
            transaction
          }
        );

        await DetalleFactura.create({
          factura_id: factura.id,
          producto_id: detallePedido.producto_id,
          cantidad: detallePedido.cantidad,
          precio_unitario: detallePedido.precio_unitario,
          subtotal: detallePedido.subtotal
        }, { transaction });
      }
    }

    await transaction.commit();
    
    // Obtener factura completa
    const facturaCompleta = await Factura.findByPk(factura.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Pedido, as: 'pedido' }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Factura legal creada exitosamente',
      data: facturaCompleta,
      arca: {
        cae: responseArca.cae,
        vencimiento: responseArca.vencimiento_cae
      }
    });
  } catch (error) {
    console.error('Error creando factura legal:', error.stack);
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: 'Error creando factura legal',
      error: error.message
    });
  }
};

// Generar PDF de factura
exports.getPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener factura con todos sus datos relacionados
    const factura = await Factura.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente'
        },
        {
          model: DetalleFactura,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto'
          }]
        }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Extraer items de los detalles de la factura
    let items = [];
    if (factura.detalles && factura.detalles.length > 0) {
      items = factura.detalles.map(detalle => ({
        cantidad: detalle.cantidad,
        producto: detalle.producto,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal
      }));
    }

    // Generar PDF
    const pdfBuffer = await generarPDFFactura(
      factura.toJSON(),
      factura.cliente.toJSON(),
      items
    );

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando PDF de factura',
      error: error.message
    });
  }
};

// Anular factura
exports.anular = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const factura = await Factura.findByPk(id);
    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    if (factura.estado === 'ANULADA') {
      return res.status(400).json({
        success: false,
        message: 'La factura ya está anulada'
      });
    }

    // Si es factura legal, notificar a ARCA
    if (['A', 'B', 'C'].includes(factura.tipo_factura)) {
      // **AQUÍ IRÍA LA ANULACIÓN EN ARCA/AFIP**
      const responseAnulacion = await anularFacturaArca({
        tipo_factura: factura.tipo_factura,
        punto_venta: factura.punto_venta,
        numero: factura.numero_factura,
        cae: factura.cae
      });

      if (!responseAnulacion.success) {
        throw new Error(`Error anulando en ARCA: ${responseAnulacion.error}`);
      }
    }

    await factura.update({
      estado: 'ANULADA',
      observaciones: `${factura.observaciones || ''}\nANULADA: ${motivo}`
    });

    res.json({
      success: true,
      message: 'Factura anulada exitosamente',
      data: factura
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error anulando factura',
      error: error.message
    });
  }
};

// Obtener estado y diagnóstico de conexión con ARCA
exports.getArcaStatus = async (req, res) => {
  try {
    const status = await arcaService.verificarEstado();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error consultando estado de ARCA',
      error: error.message
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function validarTipoFactura(condicion_iva, tipo_factura) {
  const reglas = {
    'RI': ['A', 'B'],
    'MONOTRIBUTO': ['B', 'C'],
    'EXENTO': ['C'],
    'CONSUMIDOR_FINAL': ['B', 'C']
  };
  
  if (!reglas[condicion_iva] || !reglas[condicion_iva].includes(tipo_factura)) {
    return {
      valido: false,
      mensaje: `Cliente con condición ${condicion_iva} no puede recibir factura tipo ${tipo_factura}`
    };
  }
  
  return { valido: true };
}

async function obtenerConfiguracion(clave) {
  const { Configuracion } = require('../models');
  const config = await Configuracion.findOne({ where: { clave } });
  return config ? config.valor : null;
}

// Delegación a arcaService (compatible hacia atrás)
async function solicitarCAE(datosFactura) {
  return arcaService.solicitarCAE(datosFactura);
}

// Anulación / emisión de nota de crédito para ARCA
async function anularFacturaArca(datosFactura) {
  // En ARCA la anulación fiscal se realiza emitiendo una Nota de Crédito vinculada
  return {
    success: true,
    mensaje: 'Comprobante marcado para nota de crédito'
  };
}

module.exports = exports;