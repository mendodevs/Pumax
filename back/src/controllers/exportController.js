const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const ExcelJS = require('exceljs');
const { consultaNegocio } = require('../utils/tenant');

// SQL escrito a mano: siempre con :negocioId (el filtro automático por negocio no lo cubre).
const consulta = (sql, opciones) => consultaNegocio(sequelize, sql, opciones);

/**
 * MÓDULO DE EXPORTACIÓN - PUMAX
 * Exporta reportes a Excel (.xlsx) y CSV
 */

// ============================================
// EXPORTAR VENTAS A EXCEL
// ============================================
const exportarVentasExcel = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo_operacion } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta' 
      });
    }

    let whereClause = `
      WHERE p.negocio_id = :negocioId
        AND p.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
        AND p.estado != 'CANCELADO'
    `;
    const replacements = { fecha_desde, fecha_hasta };

    if (tipo_operacion) {
      whereClause += ' AND p.tipo_operacion = :tipo_operacion';
      replacements.tipo_operacion = tipo_operacion;
    }

    // Obtener datos
    const ventasQuery = `
      SELECT 
        p.id,
        p.numero_pedido,
        DATE_FORMAT(p.fecha_pedido, '%d/%m/%Y') as fecha,
        c.nombre as cliente,
        c.tipo_cliente,
        p.tipo_operacion,
        p.estado,
        p.subtotal,
        p.descuento_porcentaje,
        p.descuento_monto,
        p.total,
        u.username as usuario
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      INNER JOIN usuarios u ON p.usuario_registro_id = u.id
      ${whereClause}
      ORDER BY p.fecha_pedido DESC
    `;

    const ventas = await consulta(ventasQuery, { replacements, type: QueryTypes.SELECT });

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Número Pedido', key: 'numero_pedido', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Tipo Cliente', key: 'tipo_cliente', width: 15 },
      { header: 'Operación', key: 'tipo_operacion', width: 12 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Desc %', key: 'descuento_porcentaje', width: 10 },
      { header: 'Desc $', key: 'descuento_monto', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Usuario', key: 'usuario', width: 15 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    ventas.forEach(venta => {
      worksheet.addRow(venta);
    });

    // Formato de moneda para columnas numéricas
    worksheet.getColumn('subtotal').numFmt = '$#,##0.00';
    worksheet.getColumn('descuento_monto').numFmt = '$#,##0.00';
    worksheet.getColumn('total').numFmt = '$#,##0.00';

    // Totales al final
    const totalRow = worksheet.addRow({
      numero_pedido: 'TOTALES',
      subtotal: { formula: `SUM(H2:H${ventas.length + 1})` },
      descuento_monto: { formula: `SUM(J2:J${ventas.length + 1})` },
      total: { formula: `SUM(K2:K${ventas.length + 1})` }
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };

    // Configurar respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ventas_${fecha_desde}_${fecha_hasta}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error en exportarVentasExcel:', error);
    res.status(500).json({ 
      mensaje: 'Error al exportar ventas',
      error: error.message 
    });
  }
};

// ============================================
// EXPORTAR PRODUCTOS A EXCEL
// ============================================
const exportarProductosExcel = async (req, res) => {
  try {
    const { categoria_id, stock_bajo } = req.query;

    let whereClause = 'WHERE p.negocio_id = :negocioId AND p.activo = 1';
    const replacements = {};

    if (categoria_id) {
      whereClause += ' AND p.categoria_id = :categoria_id';
      replacements.categoria_id = categoria_id;
    }

    if (stock_bajo === 'true') {
      whereClause += ` AND p.stock <= p.stock_minimo`;
    }

    const productosQuery = `
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        c.nombre as categoria,
        p.precio_base,
        p.precio_venta,
        p.margen_ganancia,
        p.stock,
        p.stock_minimo,
        CASE 
          WHEN p.stock <= 0 THEN 'SIN STOCK'
          WHEN p.stock <= p.stock_minimo THEN 'STOCK BAJO'
          ELSE 'OK'
        END as estado_stock
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY c.nombre, p.codigo
    `;

    const productos = await consulta(productosQuery, { replacements, type: QueryTypes.SELECT });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Precio Base', key: 'precio_base', width: 12 },
      { header: 'Precio Venta', key: 'precio_venta', width: 12 },
      { header: 'Margen %', key: 'margen_ganancia', width: 10 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Mín', key: 'stock_minimo', width: 10 },
      { header: 'Estado', key: 'estado_stock', width: 15 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    productos.forEach(producto => {
      const row = worksheet.addRow(producto);
      
      // Colorear según estado de stock
      if (producto.estado_stock === 'SIN STOCK') {
        row.getCell('estado_stock').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        row.getCell('estado_stock').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      } else if (producto.estado_stock === 'STOCK BAJO') {
        row.getCell('estado_stock').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }
        };
        row.getCell('estado_stock').font = { bold: true };
      }
    });

    // Formato de moneda
    worksheet.getColumn('precio_base').numFmt = '$#,##0.00';
    worksheet.getColumn('precio_venta').numFmt = '$#,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=productos_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error en exportarProductosExcel:', error);
    res.status(500).json({ 
      mensaje: 'Error al exportar productos',
      error: error.message 
    });
  }
};

// ============================================
// EXPORTAR FACTURACIÓN A EXCEL
// ============================================
const exportarFacturacionExcel = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo_factura } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ 
        mensaje: 'Se requieren fecha_desde y fecha_hasta' 
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

    const facturasQuery = `
      SELECT 
        f.id,
        f.numero_factura,
        f.tipo_factura,
        DATE_FORMAT(f.fecha_emision, '%d/%m/%Y') as fecha,
        c.nombre as cliente,
        c.cuit,
        c.condicion_iva,
        f.punto_venta,
        f.subtotal,
        f.iva_105,
        f.iva_21,
        f.total,
        f.cae,
        DATE_FORMAT(f.vencimiento_cae, '%d/%m/%Y') as venc_cae
      FROM facturas f
      INNER JOIN clientes c ON f.cliente_id = c.id
      ${whereClause}
      ORDER BY f.fecha_emision DESC, f.numero_factura DESC
    `;

    const facturas = await consulta(facturasQuery, { replacements, type: QueryTypes.SELECT });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Facturación');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Número', key: 'numero_factura', width: 18 },
      { header: 'Tipo', key: 'tipo_factura', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'CUIT', key: 'cuit', width: 15 },
      { header: 'IVA', key: 'condicion_iva', width: 18 },
      { header: 'PV', key: 'punto_venta', width: 8 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'IVA 10.5%', key: 'iva_105', width: 12 },
      { header: 'IVA 21%', key: 'iva_21', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'CAE', key: 'cae', width: 18 },
      { header: 'Venc. CAE', key: 'venc_cae', width: 12 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5B9BD5' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    facturas.forEach(factura => {
      const row = worksheet.addRow(factura);
      
      // Colorear facturas en negro
      if (factura.tipo_factura === 'NEGRO') {
        row.getCell('tipo_factura').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF808080' }
        };
        row.getCell('tipo_factura').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    });

    // Formato de moneda
    worksheet.getColumn('subtotal').numFmt = '$#,##0.00';
    worksheet.getColumn('iva_105').numFmt = '$#,##0.00';
    worksheet.getColumn('iva_21').numFmt = '$#,##0.00';
    worksheet.getColumn('total').numFmt = '$#,##0.00';

    // Totales
    const totalRow = worksheet.addRow({
      numero_factura: 'TOTALES',
      subtotal: { formula: `SUM(I2:I${facturas.length + 1})` },
      iva_105: { formula: `SUM(J2:J${facturas.length + 1})` },
      iva_21: { formula: `SUM(K2:K${facturas.length + 1})` },
      total: { formula: `SUM(L2:L${facturas.length + 1})` }
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=facturacion_${fecha_desde}_${fecha_hasta}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error en exportarFacturacionExcel:', error);
    res.status(500).json({ 
      mensaje: 'Error al exportar facturación',
      error: error.message 
    });
  }
};

// ============================================
// EXPORTAR A CSV (GENÉRICO)
// ============================================
const exportarCSV = async (req, res) => {
  try {
    const { tipo, fecha_desde, fecha_hasta } = req.query;

    if (!tipo) {
      return res.status(400).json({ 
        mensaje: 'Se requiere el parámetro "tipo" (ventas, productos, facturacion)' 
      });
    }

    let data = [];
    let filename = '';
    let headers = [];

    // Según el tipo, obtener datos diferentes
    switch (tipo) {
      case 'ventas':
        if (!fecha_desde || !fecha_hasta) {
          return res.status(400).json({ mensaje: 'Se requieren fechas' });
        }
        
        const ventasQuery = `
          SELECT 
            p.numero_pedido,
            DATE_FORMAT(p.fecha_pedido, '%d/%m/%Y') as fecha,
            c.nombre as cliente,
            p.tipo_operacion,
            p.total
          FROM pedidos p
          INNER JOIN clientes c ON p.cliente_id = c.id
          WHERE p.negocio_id = :negocioId
            AND p.fecha_pedido BETWEEN :fecha_desde AND :fecha_hasta
            AND p.estado != 'CANCELADO'
          ORDER BY p.fecha_pedido DESC
        `;
        data = await consulta(ventasQuery, { replacements: { fecha_desde, fecha_hasta }, type: QueryTypes.SELECT });
        headers = ['Número Pedido', 'Fecha', 'Cliente', 'Operación', 'Total'];
        filename = `ventas_${fecha_desde}_${fecha_hasta}.csv`;
        break;

      case 'productos':
        const productosQuery = `
          SELECT 
            p.codigo,
            p.descripcion,
            c.nombre as categoria,
            p.precio_venta,
            p.stock,
            p.stock_minimo
          FROM productos p
          INNER JOIN categorias c ON p.categoria_id = c.id
          WHERE p.negocio_id = :negocioId AND p.activo = 1
          ORDER BY c.nombre, p.codigo
        `;
        data = await consulta(productosQuery, { type: QueryTypes.SELECT });
        headers = ['Código', 'Descripción', 'Categoría', 'Precio', 'Stock', 'Stock Mín'];
        filename = `productos_${Date.now()}.csv`;
        break;

      case 'facturacion':
        if (!fecha_desde || !fecha_hasta) {
          return res.status(400).json({ mensaje: 'Se requieren fechas' });
        }
        
        const facturasQuery = `
          SELECT 
            f.numero_factura,
            f.tipo_factura,
            DATE_FORMAT(f.fecha_emision, '%d/%m/%Y') as fecha,
            c.nombre as cliente,
            f.total
          FROM facturas f
          INNER JOIN clientes c ON f.cliente_id = c.id
          WHERE f.negocio_id = :negocioId
            AND f.fecha_emision BETWEEN :fecha_desde AND :fecha_hasta
            AND f.estado = 'EMITIDA'
          ORDER BY f.fecha_emision DESC
        `;
        data = await consulta(facturasQuery, { replacements: { fecha_desde, fecha_hasta }, type: QueryTypes.SELECT });
        headers = ['Número', 'Tipo', 'Fecha', 'Cliente', 'Total'];
        filename = `facturacion_${fecha_desde}_${fecha_hasta}.csv`;
        break;

      default:
        return res.status(400).json({ 
          mensaje: 'Tipo inválido. Usar: ventas, productos o facturacion' 
        });
    }

    // Generar CSV
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
      csv += Object.values(row).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (error) {
    console.error('Error en exportarCSV:', error);
    res.status(500).json({ 
      mensaje: 'Error al exportar CSV',
      error: error.message 
    });
  }
};

module.exports = {
  exportarVentasExcel,
  exportarProductosExcel,
  exportarFacturacionExcel,
  exportarCSV
};