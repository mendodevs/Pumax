const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Cliente = require('./Cliente');
const Proveedor = require('./Proveedor');
const Empleado = require('./Empleado');
const Usuario = require('./Usuario');
const Sesion = require('./Sesion');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Factura = require('./Factura');
const DetalleFactura = require('./DetalleFactura');
const Configuracion = require('./Configuracion');
const IngresoMercaderia = require('./IngresoMercaderia');
const DetalleIngreso = require('./DetalleIngreso');
const MovimientoStock = require('./MovimientoStock');
const Negocio = require('./Negocio');
const { aplicarTenant } = require('../utils/tenant');

// Multi-negocio: agrega negocio_id y el filtro automático por negocio a estos modelos.
// Tiene que ir antes de definir las relaciones.
[Categoria, Producto, Cliente, Proveedor, Empleado, Usuario, Pedido, Factura,
  IngresoMercaderia, Configuracion, MovimientoStock].forEach(aplicarTenant);


// Producto - Categoria
Producto.belongsTo(Categoria, {
  foreignKey: 'categoria_id',
  as: 'categoria'
});
Categoria.hasMany(Producto, {
  foreignKey: 'categoria_id',
  as: 'productos'
});

// Usuario - Empleado
Usuario.belongsTo(Empleado, {
  foreignKey: 'empleado_id',
  as: 'empleado'
});
Empleado.hasOne(Usuario, {
  foreignKey: 'empleado_id',
  as: 'usuario'
});

// Pedido - Cliente
Pedido.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente'
});
Cliente.hasMany(Pedido, {
  foreignKey: 'cliente_id',
  as: 'pedidos'
});

// Pedido - Usuario (quien registró)
Pedido.belongsTo(Usuario, {
  foreignKey: 'usuario_registro_id',
  as: 'usuario_registro'
});

// DetallePedido - Pedido
DetallePedido.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
  as: 'pedido'
});
Pedido.hasMany(DetallePedido, {
  foreignKey: 'pedido_id',
  as: 'detalles'
});

// DetallePedido - Producto
DetallePedido.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto'
});
Producto.hasMany(DetallePedido, {
  foreignKey: 'producto_id',
  as: 'detalles_pedido'
});

// Factura - Cliente
Factura.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente'
});
Cliente.hasMany(Factura, {
  foreignKey: 'cliente_id',
  as: 'facturas'
});

// Factura - Pedido
Factura.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
  as: 'pedido'
});
Pedido.hasOne(Factura, {
  foreignKey: 'pedido_id',
  as: 'factura'
});

// Factura - Usuario (quien emitió)
Factura.belongsTo(Usuario, {
  foreignKey: 'usuario_emision_id',
  as: 'usuario_emision'
});

// IngresoMercaderia - Proveedor
IngresoMercaderia.belongsTo(Proveedor, {
  foreignKey: 'proveedor_id',
  as: 'proveedor'
});
Proveedor.hasMany(IngresoMercaderia, {
  foreignKey: 'proveedor_id',
  as: 'ingresos'
});

// IngresoMercaderia - Usuario
IngresoMercaderia.belongsTo(Usuario, {
  foreignKey: 'usuario_registro_id',
  as: 'usuario_registro'
});

// DetalleIngreso - IngresoMercaderia
DetalleIngreso.belongsTo(IngresoMercaderia, {
  foreignKey: 'ingreso_id',
  as: 'ingreso'
});
IngresoMercaderia.hasMany(DetalleIngreso, {
  foreignKey: 'ingreso_id',
  as: 'detalles'
});

// DetalleIngreso - Producto
DetalleIngreso.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto'
});
Producto.hasMany(DetalleIngreso, {
  foreignKey: 'producto_id',
  as: 'detalles_ingreso'
});

// DetalleFactura - Factura
DetalleFactura.belongsTo(Factura, {
  foreignKey: 'factura_id',
  as: 'factura'
});
Factura.hasMany(DetalleFactura, {
  foreignKey: 'factura_id',
  as: 'detalles'
});

// DetalleFactura - Producto
DetalleFactura.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto'
});
Producto.hasMany(DetalleFactura, {
  foreignKey: 'producto_id',
  as: 'detalles_factura'
});

// MovimientoStock - Producto
MovimientoStock.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto'
});
Producto.hasMany(MovimientoStock, {
  foreignKey: 'producto_id',
  as: 'movimientos_stock'
});

// MovimientoStock - Usuario
MovimientoStock.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});
Usuario.hasMany(MovimientoStock, {
  foreignKey: 'usuario_id',
  as: 'movimientos_stock'
});

module.exports = {
  Categoria,
  Producto,
  Cliente,
  Proveedor,
  Empleado,
  Usuario,
  Sesion,
  Pedido,
  DetallePedido,
  Factura,
  DetalleFactura,
  Configuracion,
  IngresoMercaderia,
  DetalleIngreso,
  MovimientoStock,
  Negocio
};