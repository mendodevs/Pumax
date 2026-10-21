const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoStock = sequelize.define('MovimientoStock', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  producto_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('ENTRADA', 'SALIDA', 'AJUSTE'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock_anterior: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stock_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  referencia_tipo: {
    type: DataTypes.ENUM('PEDIDO', 'INGRESO', 'AJUSTE_MANUAL', 'FACTURA'),
    allowNull: true,
    comment: 'Tipo de documento que origina el movimiento'
  },
  referencia_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del documento que origina el movimiento'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Usuario que realizó el movimiento'
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'movimientos_stock',
  timestamps: false
});

module.exports = MovimientoStock;
