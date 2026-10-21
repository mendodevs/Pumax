const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  // negocio_id lo agrega aplicarTenant() desde models/index.js
  empleado_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    validate: { isEmail: true }
  },
  google_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true // null en cuentas creadas con Google
  },
  proveedor_auth: {
    type: DataTypes.ENUM('LOCAL', 'GOOGLE'),
    allowNull: false,
    defaultValue: 'LOCAL'
  },
  email_verificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  acepta_promociones: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rol: {
    type: DataTypes.ENUM('SUPERADMIN', 'ADMIN', 'VENDEDOR', 'DEPOSITO', 'FACTURACION', 'VIAJANTE'),
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false
});

module.exports = Usuario;
