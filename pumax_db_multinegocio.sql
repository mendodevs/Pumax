-- =====================================================================
-- PUMAX - Base de datos COMPLETA desde cero (multi-negocio)
--
-- ATENCIÓN: este script BORRA la base `daylight_db` entera y la crea de nuevo.
-- Se pierden TODOS los datos actuales. Si querés conservarlos, exportá antes:
--   phpMyAdmin -> seleccionar la base -> Exportar
--   o:  mysqldump -u root -p daylight_db > backup.sql
--
-- Si tu back usa otro nombre de base (DB_NAME en el .env), cambialo en las
-- 3 primeras líneas de abajo y en el .env.
--
-- Incluye: negocio 1, su configuración, 8 categorías y la cuenta inicial
--   usuario: admin    clave: admin123   (cambiala apenas entres)
-- No incluye productos, clientes, pedidos ni facturas de ejemplo.
-- =====================================================================

DROP DATABASE IF EXISTS daylight_db;
CREATE DATABASE daylight_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE daylight_db;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Negocios (cada negocio es un "inquilino" con sus propios datos)
-- ---------------------------------------------------------------------
CREATE TABLE negocios (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  cuit VARCHAR(15) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_nombre (nombre),
  KEY idx_activo (activo),
  CONSTRAINT fk_categorias_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(150) DEFAULT NULL,
  cuit VARCHAR(15) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  localidad VARCHAR(100) DEFAULT NULL,
  provincia VARCHAR(100) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  tipo_cliente ENUM('MINORISTA','MAYORISTA') DEFAULT 'MINORISTA',
  condicion_iva ENUM('RI','MONOTRIBUTO','EXENTO','CONSUMIDOR_FINAL') DEFAULT 'CONSUMIDOR_FINAL',
  descuento_habitual DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Descuento automático por compra',
  limite_credito DECIMAL(10,2) DEFAULT 0.00,
  saldo_actual DECIMAL(10,2) DEFAULT 0.00,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_negocio_cuit (negocio_id, cuit),
  KEY idx_cuit (cuit),
  KEY idx_nombre (nombre),
  KEY idx_tipo (tipo_cliente),
  KEY idx_activo (activo),
  CONSTRAINT fk_clientes_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Proveedores
-- ---------------------------------------------------------------------
CREATE TABLE proveedores (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(150) DEFAULT NULL,
  cuit VARCHAR(15) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  contacto_nombre VARCHAR(100) DEFAULT NULL COMMENT 'Nombre del contacto principal',
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_proveedores_negocio_cuit (negocio_id, cuit),
  KEY idx_cuit (cuit),
  KEY idx_nombre (nombre),
  KEY idx_activo (activo),
  CONSTRAINT fk_proveedores_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Empleados
-- ---------------------------------------------------------------------
CREATE TABLE empleados (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dni VARCHAR(15) NOT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  cargo VARCHAR(100) DEFAULT NULL,
  fecha_ingreso DATE NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_empleados_negocio_dni (negocio_id, dni),
  KEY idx_dni (dni),
  KEY idx_nombre (nombre, apellido),
  KEY idx_activo (activo),
  CONSTRAINT fk_empleados_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Usuarios (acceso al sistema). username y email son únicos en TODOS los negocios.
-- password_hash es NULL en las cuentas que ingresan solo con Google.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  empleado_id BIGINT DEFAULT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  google_id VARCHAR(50) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  proveedor_auth ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL',
  email_verificado TINYINT(1) NOT NULL DEFAULT 0,
  acepta_promociones TINYINT(1) NOT NULL DEFAULT 0,
  rol ENUM('SUPERADMIN','ADMIN','VENDEDOR','DEPOSITO','FACTURACION','VIAJANTE') NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY username (username),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_google (google_id),
  KEY empleado_id (empleado_id),
  KEY idx_rol (rol),
  KEY idx_activo (activo),
  CONSTRAINT usuarios_ibfk_1 FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE SET NULL,
  CONSTRAINT fk_usuarios_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Configuración (por negocio)
-- ---------------------------------------------------------------------
CREATE TABLE configuracion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  clave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT DEFAULT NULL,
  tipo_dato ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_configuracion_negocio_clave (negocio_id, clave),
  KEY idx_clave (clave),
  CONSTRAINT fk_configuracion_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  categoria_id BIGINT DEFAULT NULL,
  precio_base DECIMAL(10,2) NOT NULL COMMENT 'Precio sin margen de ganancia',
  precio_venta DECIMAL(10,2) NOT NULL COMMENT 'Precio con margen aplicado',
  margen_ganancia DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Porcentaje de ganancia',
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT DEFAULT 10 COMMENT 'Alerta de stock bajo',
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_negocio_codigo (negocio_id, codigo),
  KEY idx_codigo (codigo),
  KEY idx_categoria (categoria_id),
  KEY idx_activo (activo),
  KEY idx_stock (stock),
  CONSTRAINT productos_ibfk_1 FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL,
  CONSTRAINT fk_productos_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  numero_pedido VARCHAR(20) NOT NULL,
  cliente_id BIGINT NOT NULL,
  usuario_registro_id BIGINT DEFAULT NULL,
  fecha_pedido TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  fecha_entrega DATE DEFAULT NULL,
  estado ENUM('PENDIENTE','PREPARANDO','LISTO','ENTREGADO','CANCELADO') DEFAULT 'PENDIENTE',
  tipo_operacion ENUM('BLANCO','NEGRO') DEFAULT 'BLANCO',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
  descuento_monto DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observaciones TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedidos_negocio_numero (negocio_id, numero_pedido),
  KEY usuario_registro_id (usuario_registro_id),
  KEY idx_numero (numero_pedido),
  KEY idx_cliente (cliente_id),
  KEY idx_estado (estado),
  KEY idx_fecha (fecha_pedido),
  KEY idx_tipo_operacion (tipo_operacion),
  CONSTRAINT pedidos_ibfk_1 FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT pedidos_ibfk_2 FOREIGN KEY (usuario_registro_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_pedidos_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedidos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento_item DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Descuento específico del item',
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pedido (pedido_id),
  KEY idx_producto (producto_id),
  CONSTRAINT detalle_pedidos_ibfk_1 FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT detalle_pedidos_ibfk_2 FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Facturas
-- ---------------------------------------------------------------------
CREATE TABLE facturas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  numero_factura VARCHAR(20) NOT NULL,
  pedido_id BIGINT DEFAULT NULL,
  cliente_id BIGINT NOT NULL,
  tipo_factura ENUM('A','B','C','NEGRO') NOT NULL,
  punto_venta VARCHAR(5) DEFAULT '00001',
  fecha_emision TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  subtotal DECIMAL(10,2) NOT NULL,
  iva_21 DECIMAL(10,2) DEFAULT 0.00,
  iva_105 DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  cae VARCHAR(50) DEFAULT NULL COMMENT 'Código de Autorización Electrónico (ARCA)',
  vencimiento_cae DATE DEFAULT NULL,
  estado ENUM('EMITIDA','ANULADA') DEFAULT 'EMITIDA',
  observaciones TEXT DEFAULT NULL,
  usuario_emision_id BIGINT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_facturas_negocio_numero (negocio_id, numero_factura),
  KEY pedido_id (pedido_id),
  KEY cliente_id (cliente_id),
  KEY usuario_emision_id (usuario_emision_id),
  KEY idx_numero (numero_factura),
  KEY idx_tipo (tipo_factura),
  KEY idx_fecha (fecha_emision),
  KEY idx_estado (estado),
  KEY idx_cae (cae),
  CONSTRAINT facturas_ibfk_1 FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE SET NULL,
  CONSTRAINT facturas_ibfk_2 FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT facturas_ibfk_3 FOREIGN KEY (usuario_emision_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_facturas_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_facturas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  factura_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_factura_id (factura_id),
  KEY idx_producto_id (producto_id),
  CONSTRAINT detalle_facturas_ibfk_1 FOREIGN KEY (factura_id) REFERENCES facturas (id) ON DELETE CASCADE,
  CONSTRAINT detalle_facturas_ibfk_2 FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Ingresos de mercadería
-- ---------------------------------------------------------------------
CREATE TABLE ingresos_mercaderia (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  proveedor_id BIGINT NOT NULL,
  numero_remito VARCHAR(50) DEFAULT NULL,
  numero_factura VARCHAR(50) DEFAULT NULL,
  fecha_ingreso DATE NOT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  usuario_registro_id BIGINT DEFAULT NULL,
  total_compra DECIMAL(10,2) DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  estado ENUM('PENDIENTE','VERIFICADO','COMPLETADO') DEFAULT 'PENDIENTE',
  PRIMARY KEY (id),
  KEY usuario_registro_id (usuario_registro_id),
  KEY idx_proveedor (proveedor_id),
  KEY idx_fecha (fecha_ingreso),
  KEY idx_estado (estado),
  CONSTRAINT ingresos_mercaderia_ibfk_1 FOREIGN KEY (proveedor_id) REFERENCES proveedores (id),
  CONSTRAINT ingresos_mercaderia_ibfk_2 FOREIGN KEY (usuario_registro_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_ingresos_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_ingresos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ingreso_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  cantidad INT NOT NULL,
  precio_compra DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ingreso (ingreso_id),
  KEY idx_producto (producto_id),
  CONSTRAINT detalle_ingresos_ibfk_1 FOREIGN KEY (ingreso_id) REFERENCES ingresos_mercaderia (id) ON DELETE CASCADE,
  CONSTRAINT detalle_ingresos_ibfk_2 FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Movimientos de stock (los inserta el trigger o el back)
-- ---------------------------------------------------------------------
CREATE TABLE movimientos_stock (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL,
  tipo_movimiento ENUM('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  cantidad INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  referencia_tipo ENUM('PEDIDO','INGRESO','AJUSTE_MANUAL') NOT NULL,
  referencia_id BIGINT DEFAULT NULL COMMENT 'ID del pedido, ingreso o ajuste',
  usuario_id BIGINT DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY usuario_id (usuario_id),
  KEY idx_producto (producto_id),
  KEY idx_tipo (tipo_movimiento),
  KEY idx_fecha (fecha),
  KEY idx_referencia (referencia_tipo, referencia_id),
  CONSTRAINT movimientos_stock_ibfk_1 FOREIGN KEY (producto_id) REFERENCES productos (id),
  CONSTRAINT movimientos_stock_ibfk_2 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_movstock_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Sesiones y recuperación de contraseña
-- ---------------------------------------------------------------------
CREATE TABLE sesiones (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL,
  fecha_expiracion DATETIME NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME NOT NULL,
  fecha_actualizacion DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY usuario_id (usuario_id),
  CONSTRAINT sesiones_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tokens_recuperacion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,           -- se guarda el hash, no el token
  expira_en DATETIME NOT NULL,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token_hash (token_hash),
  CONSTRAINT fk_tokrec_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tablas que el back todavía no usa (se conservan del esquema original)
-- ---------------------------------------------------------------------
CREATE TABLE listas_precios (
  id BIGINT NOT NULL AUTO_INCREMENT,
  negocio_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  tipo_lista ENUM('GENERAL','MAYORISTA','MINORISTA','ESPECIAL') DEFAULT 'GENERAL',
  fecha_vigencia_desde DATE NOT NULL,
  fecha_vigencia_hasta DATE DEFAULT NULL,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_nombre (nombre),
  KEY idx_tipo (tipo_lista),
  KEY idx_vigencia (fecha_vigencia_desde, fecha_vigencia_hasta),
  KEY idx_activo (activo),
  CONSTRAINT fk_listas_negocio FOREIGN KEY (negocio_id) REFERENCES negocios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE descuentos_cliente (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT NOT NULL,
  tipo_descuento ENUM('PORCENTAJE','MONTO_FIJO') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE DEFAULT NULL,
  activo TINYINT(1) DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_cliente (cliente_id),
  KEY idx_fecha (fecha_desde, fecha_hasta),
  KEY idx_activo (activo),
  CONSTRAINT descuentos_cliente_ibfk_1 FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE precios_productos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  producto_id BIGINT NOT NULL,
  lista_precio_id BIGINT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_producto (producto_id),
  KEY idx_lista (lista_precio_id),
  KEY idx_fecha (fecha_desde, fecha_hasta),
  CONSTRAINT precios_productos_ibfk_1 FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT precios_productos_ibfk_2 FOREIGN KEY (lista_precio_id) REFERENCES listas_precios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Triggers de stock (copian el negocio del producto al movimiento)
-- ---------------------------------------------------------------------
DELIMITER ;;

CREATE TRIGGER after_detalle_ingreso_insert
AFTER INSERT ON detalle_ingresos
FOR EACH ROW
BEGIN
  DECLARE stock_actual INT;
  DECLARE v_negocio BIGINT;

  SELECT stock, negocio_id INTO stock_actual, v_negocio
  FROM productos WHERE id = NEW.producto_id;

  UPDATE productos SET stock = stock + NEW.cantidad WHERE id = NEW.producto_id;

  INSERT INTO movimientos_stock
    (negocio_id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id)
  VALUES
    (v_negocio, NEW.producto_id, 'ENTRADA', NEW.cantidad, stock_actual, stock_actual + NEW.cantidad, 'INGRESO', NEW.ingreso_id);
END;;

CREATE TRIGGER after_detalle_pedido_insert
AFTER INSERT ON detalle_pedidos
FOR EACH ROW
BEGIN
  DECLARE stock_actual INT;
  DECLARE v_negocio BIGINT;

  SELECT stock, negocio_id INTO stock_actual, v_negocio
  FROM productos WHERE id = NEW.producto_id;

  UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;

  INSERT INTO movimientos_stock
    (negocio_id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id)
  VALUES
    (v_negocio, NEW.producto_id, 'SALIDA', NEW.cantidad, stock_actual, stock_actual - NEW.cantidad, 'PEDIDO', NEW.pedido_id);
END;;

DELIMITER ;

-- ---------------------------------------------------------------------
-- Vistas (exponen negocio_id: filtrá siempre por él al consultarlas)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW productos_stock_bajo AS
SELECT p.id, p.negocio_id, p.codigo, p.descripcion, c.nombre AS categoria,
       p.stock, p.stock_minimo, (p.stock_minimo - p.stock) AS unidades_faltantes
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.stock <= p.stock_minimo AND p.activo = 1
ORDER BY (p.stock_minimo - p.stock) DESC;

CREATE OR REPLACE VIEW resumen_facturacion AS
SELECT f.negocio_id, CAST(f.fecha_emision AS DATE) AS fecha, f.tipo_factura,
       COUNT(0) AS cantidad_facturas, SUM(f.subtotal) AS total_subtotal,
       SUM(f.iva_21 + f.iva_105) AS total_iva, SUM(f.total) AS total_facturado
FROM facturas f
WHERE f.estado = 'EMITIDA'
GROUP BY f.negocio_id, CAST(f.fecha_emision AS DATE), f.tipo_factura;

CREATE OR REPLACE VIEW vista_pedidos_completos AS
SELECT p.id, p.negocio_id, p.numero_pedido, c.nombre AS cliente, p.fecha_pedido,
       p.estado, p.tipo_operacion, p.total, u.username AS usuario_registro,
       COUNT(dp.id) AS cantidad_items
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN usuarios u ON p.usuario_registro_id = u.id
LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
GROUP BY p.id;

-- ---------------------------------------------------------------------
-- Datos iniciales: negocio 1, su configuración, categorías y la cuenta admin
-- ---------------------------------------------------------------------
INSERT INTO negocios (id, nombre) VALUES (1, 'Negocio principal');   -- cambiale el nombre

INSERT INTO configuracion (negocio_id, clave, valor, descripcion, tipo_dato) VALUES
(1, 'margen_ganancia_default',   '20',    'Margen de ganancia por defecto (%)',        'NUMBER'),
(1, 'descuento_mayorista_default','10',   'Descuento por defecto para mayoristas (%)', 'NUMBER'),
(1, 'descuento_minorista_default','5',    'Descuento por defecto para minoristas (%)', 'NUMBER'),
(1, 'stock_minimo_alerta',       '10',    'Cantidad mínima de stock para alerta',      'NUMBER'),
(1, 'iva_general',               '21',    'IVA general (%)',                           'NUMBER'),
(1, 'iva_reducido',              '10.5',  'IVA reducido (%)',                          'NUMBER'),
(1, 'punto_venta',               '00001', 'Punto de venta para facturación',           'STRING'),
(1, 'backup_frecuencia_dias',    '7',     'Frecuencia de backups en días',             'NUMBER');

INSERT INTO categorias (negocio_id, nombre, descripcion) VALUES
(1, 'Cables',        'Cables eléctricos de distintos tipos y medidas'),
(1, 'Iluminación',   'Lámparas, tubos LED y accesorios'),
(1, 'Llaves y Tomas','Interruptores, enchufes y tomacorrientes'),
(1, 'Protección',    'Térmicas, diferenciales y fusibles'),
(1, 'Herramientas',  'Herramientas eléctricas y manuales'),
(1, 'Instalación',   'Cajas, caños y accesorios de instalación'),
(1, 'Ventilación',   'Ventiladores y extractores'),
(1, 'Materiales',    'Materiales varios de ferretería');

INSERT INTO empleados (negocio_id, nombre, apellido, dni, cargo, fecha_ingreso)
VALUES (1, 'Administrador', 'Sistema', '00000000', 'Administrador General', CURDATE());

-- Clave en texto plano a propósito: el login la convierte a bcrypt en el primer ingreso.
-- Cambiala apenas entres (Mi cuenta -> cambiar contraseña).
INSERT INTO usuarios (negocio_id, empleado_id, username, password_hash, rol)
VALUES (1, 1, 'admin', 'admin123', 'ADMIN');
