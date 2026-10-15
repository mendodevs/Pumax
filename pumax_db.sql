-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: daylight_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Cables','Cables eléctricos de distintos tipos y medidas',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(2,'Iluminación','Lámparas, tubos LED y accesorios',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(3,'Llaves y Tomas','Interruptores, enchufes y tomacorrientes',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(4,'Protección','Térmicas, diferenciales y fusibles',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(5,'Herramientas','Herramientas eléctricas y manuales',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(6,'Instalación','Cajas, caños y accesorios de instalación',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(7,'Ventilación','Ventiladores y extractores',1,'2025-10-27 14:16:55','2025-10-27 14:16:55'),(8,'Materiales','Materiales varios de ferretería',1,'2025-10-27 14:16:55','2025-10-27 14:16:55');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `razon_social` varchar(150) DEFAULT NULL,
  `cuit` varchar(15) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `localidad` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `tipo_cliente` enum('MINORISTA','MAYORISTA') DEFAULT 'MINORISTA',
  `condicion_iva` enum('RI','MONOTRIBUTO','EXENTO','CONSUMIDOR_FINAL') DEFAULT 'CONSUMIDOR_FINAL',
  `descuento_habitual` decimal(5,2) DEFAULT 0.00 COMMENT 'Descuento automático por compra',
  `limite_credito` decimal(10,2) DEFAULT 0.00,
  `saldo_actual` decimal(10,2) DEFAULT 0.00,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuit` (`cuit`),
  KEY `idx_cuit` (`cuit`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_tipo` (`tipo_cliente`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Juan Pérez','','20-12345678-9','',NULL,NULL,'2616789012','juan@hotmail.com','MINORISTA','CONSUMIDOR_FINAL',5.00,0.00,0.00,1,'2025-10-27 15:08:03','2025-10-30 14:13:35'),(2,'Distribuidora El Rayo SA','Distribuidora El Rayo SA','30-71234567-8','Av. San Martín 1234','Mendoza','Mendoza','261-4567890','ventas@elrayo.com','MAYORISTA','RI',15.00,500000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(3,'Electricidad Total','Electricidad Total SRL','30-71234568-9','Calle Rivadavia 567','Godoy Cruz','Mendoza','261-4567891','info@electotal.com','MAYORISTA','RI',12.00,300000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(4,'Casa Martínez','Casa Martínez e Hijos SA','30-71234569-0','San Lorenzo 890','Las Heras','Mendoza','261-4567892','compras@casamartinez.com','MAYORISTA','RI',10.00,400000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(5,'Ferretería Central','Ferretería Central SRL','30-71234570-1','Belgrano 234','Maipú','Mendoza','261-4567893','ventas@ferrecentral.com','MAYORISTA','RI',12.00,350000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(6,'Iluminación Pro','Iluminación Pro SA','30-71234571-2','España 456','Luján de Cuyo','Mendoza','261-4567894','contacto@ilupro.com','MAYORISTA','RI',15.00,280000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(7,'Instalaciones Rodríguez','Rodríguez Juan Carlos','20-25345678-9','Las Heras 123','Mendoza','Mendoza','261-4567895','jrodriguez@gmail.com','MINORISTA','RI',5.00,50000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(8,'Electricista López','López María Elena','27-26456789-0','Colón 789','Godoy Cruz','Mendoza','261-4567896','mlopez@hotmail.com','MINORISTA','RI',5.00,40000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(9,'Construcciones Díaz','Díaz Pedro y Asociados','20-27567890-1','Mitre 456','Las Heras','Mendoza','261-4567897','pdiaz@outlook.com','MINORISTA','RI',8.00,60000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(10,'Taller Eléctrico Silva','Silva Roberto Daniel','20-28678901-2','Sarmiento 321','Mendoza','Mendoza','261-4567898','rsilva@gmail.com','MINORISTA','MONOTRIBUTO',3.00,30000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(11,'Servicios Eléctricos Paz','Paz Carolina Andrea','27-29789012-3','San Juan 654','Guaymallén','Mendoza','261-4567899','cpaz@yahoo.com','MINORISTA','MONOTRIBUTO',3.00,25000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(12,'García Constructora','García Constructora',NULL,'Las Heras 999','Mendoza','Mendoza','261-4567900',NULL,'MINORISTA','CONSUMIDOR_FINAL',0.00,20000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(13,'Obras Fernández','Fernández Luis Alberto',NULL,'Perú 333','Godoy Cruz','Mendoza','261-4567901',NULL,'MINORISTA','CONSUMIDOR_FINAL',0.00,15000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(14,'Consorcio Edificio Sol','Consorcio Edificio Sol',NULL,'Av. España 777','Mendoza','Mendoza','261-4567902','consorcio@edifisol.com','MINORISTA','CONSUMIDOR_FINAL',0.00,30000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(15,'Pinturas y Decoración Ruiz','Ruiz Martín',NULL,'Chile 555','Las Heras','Mendoza','261-4567903',NULL,'MINORISTA','CONSUMIDOR_FINAL',0.00,18000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(16,'Mantenimiento Gómez','Gómez Alberto José',NULL,'Godoy Cruz 222','Maipú','Mendoza','261-4567904',NULL,'MINORISTA','CONSUMIDOR_FINAL',0.00,12000.00,0.00,1,'2025-10-28 18:23:35','2025-10-28 18:23:35');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_dato` enum('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT INTO `configuracion` VALUES (1,'margen_ganancia_default','20','Margen de ganancia por defecto (%)','NUMBER','2025-10-27 14:16:55'),(2,'descuento_mayorista_default','10','Descuento por defecto para mayoristas (%)','NUMBER','2025-10-27 14:16:55'),(3,'descuento_minorista_default','5','Descuento por defecto para minoristas (%)','NUMBER','2025-10-27 14:16:55'),(4,'stock_minimo_alerta','10','Cantidad mínima de stock para alerta','NUMBER','2025-10-27 14:16:55'),(5,'iva_general','21','IVA general (%)','NUMBER','2025-10-27 14:16:55'),(6,'iva_reducido','10.5','IVA reducido (%)','NUMBER','2025-10-27 14:16:55'),(7,'punto_venta','00001','Punto de venta para facturación','STRING','2025-10-27 14:16:55'),(8,'backup_frecuencia_dias','7','Frecuencia de backups en días','NUMBER','2025-10-27 14:16:55');
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `descuentos_cliente`
--

DROP TABLE IF EXISTS `descuentos_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `descuentos_cliente` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint(20) NOT NULL,
  `tipo_descuento` enum('PORCENTAJE','MONTO_FIJO') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_desde` date NOT NULL,
  `fecha_hasta` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cliente` (`cliente_id`),
  KEY `idx_fecha` (`fecha_desde`,`fecha_hasta`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `descuentos_cliente_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `descuentos_cliente`
--

LOCK TABLES `descuentos_cliente` WRITE;
/*!40000 ALTER TABLE `descuentos_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `descuentos_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_facturas`
--

DROP TABLE IF EXISTS `detalle_facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_facturas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `factura_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_factura_id` (`factura_id`),
  KEY `idx_producto_id` (`producto_id`),
  CONSTRAINT `detalle_facturas_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_facturas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_facturas`
--

LOCK TABLES `detalle_facturas` WRITE;
/*!40000 ALTER TABLE `detalle_facturas` DISABLE KEYS */;
INSERT INTO `detalle_facturas` VALUES (1,32,2,1,195.00,195.00),(2,33,4,1,455.00,455.00),(3,34,3,5,286.00,1430.00),(4,35,11,8,156.00,1248.00),(5,36,2,20,195.00,3900.00),(6,36,19,3,5850.00,17550.00);
/*!40000 ALTER TABLE `detalle_facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ingresos`
--

DROP TABLE IF EXISTS `detalle_ingresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_ingresos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ingreso_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_compra` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ingreso` (`ingreso_id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `detalle_ingresos_ibfk_1` FOREIGN KEY (`ingreso_id`) REFERENCES `ingresos_mercaderia` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_ingresos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ingresos`
--

LOCK TABLES `detalle_ingresos` WRITE;
/*!40000 ALTER TABLE `detalle_ingresos` DISABLE KEYS */;
INSERT INTO `detalle_ingresos` VALUES (1,1,1,50,800.00,40000.00),(2,5,41,100,1200.00,120000.00),(3,5,42,50,2800.00,140000.00),(4,5,43,60,2400.00,144000.00);
/*!40000 ALTER TABLE `detalle_ingresos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_detalle_ingreso_insert
AFTER INSERT ON detalle_ingresos
FOR EACH ROW
BEGIN
    DECLARE stock_actual INT;
    
    
    SELECT stock INTO stock_actual FROM productos WHERE id = NEW.producto_id;
    
    
    UPDATE productos 
    SET stock = stock + NEW.cantidad 
    WHERE id = NEW.producto_id;
    
    
    INSERT INTO movimientos_stock 
    (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id)
    VALUES 
    (NEW.producto_id, 'ENTRADA', NEW.cantidad, stock_actual, stock_actual + NEW.cantidad, 'INGRESO', NEW.ingreso_id);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `detalle_pedidos`
--

DROP TABLE IF EXISTS `detalle_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedidos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento_item` decimal(5,2) DEFAULT 0.00 COMMENT 'Descuento específico del item',
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedido` (`pedido_id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pedidos`
--

LOCK TABLES `detalle_pedidos` WRITE;
/*!40000 ALTER TABLE `detalle_pedidos` DISABLE KEYS */;
INSERT INTO `detalle_pedidos` VALUES (1,1,1,10,1200.00,0.00,12000.00),(2,1,1,50,195.00,0.00,9750.00),(3,1,3,30,455.00,0.00,13650.00),(4,1,11,20,1105.00,0.00,22100.00),(5,2,21,10,416.00,0.00,4160.00),(6,2,22,8,754.00,0.00,6032.00),(7,2,24,5,494.00,0.00,2470.00),(8,3,14,5,1560.00,0.00,7800.00),(9,3,26,2,884.00,0.00,1768.00),(10,4,11,25,1105.00,0.00,27625.00),(11,4,12,10,1235.00,0.00,12350.00),(12,4,17,3,2730.00,0.00,8190.00),(13,5,31,2,3360.00,0.00,6720.00),(14,5,41,15,585.00,0.00,8775.00),(15,5,50,8,1040.00,0.00,8320.00),(16,6,1,80,195.00,0.00,15600.00),(17,6,4,40,676.00,0.00,27040.00),(18,6,31,3,3360.00,0.00,10080.00),(19,7,46,4,1560.00,0.00,6240.00),(20,7,50,10,1040.00,0.00,10400.00),(21,8,21,12,416.00,0.00,4992.00),(22,8,24,8,494.00,0.00,3952.00),(23,8,27,4,715.00,0.00,2860.00),(24,9,16,8,3250.00,0.00,26000.00),(25,9,18,4,5850.00,0.00,23400.00),(26,10,47,5,2860.00,0.00,14300.00),(27,10,44,12,585.00,0.00,7020.00);
/*!40000 ALTER TABLE `detalle_pedidos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_detalle_pedido_insert
AFTER INSERT ON detalle_pedidos
FOR EACH ROW
BEGIN
    DECLARE stock_actual INT;
    
    
    SELECT stock INTO stock_actual FROM productos WHERE id = NEW.producto_id;
    
    
    UPDATE productos 
    SET stock = stock - NEW.cantidad 
    WHERE id = NEW.producto_id;
    
    
    INSERT INTO movimientos_stock 
    (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id)
    VALUES 
    (NEW.producto_id, 'SALIDA', NEW.cantidad, stock_actual, stock_actual - NEW.cantidad, 'PEDIDO', NEW.pedido_id);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  KEY `idx_dni` (`dni`),
  KEY `idx_nombre` (`nombre`,`apellido`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
INSERT INTO `empleados` VALUES (1,'Administrador','Sistema','00000000',NULL,NULL,NULL,'Administrador General','2025-10-27',1,'2025-10-27 14:16:55'),(2,'Carlos','Gerente','30123456','2604111222','gerente@daylight.com','Calle Falsa 123','Gerente General','2024-01-15',1,'2025-10-29 15:19:25'),(3,'María','Supervisor','28456789','2604333444','supervisor@daylight.com','Avenida Siempreviva 456','Supervisor de Ventas','2024-03-01',1,'2025-10-29 15:19:25');
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(20) NOT NULL,
  `pedido_id` bigint(20) DEFAULT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `tipo_factura` enum('A','B','C','NEGRO') NOT NULL,
  `punto_venta` varchar(5) DEFAULT '00001',
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL,
  `iva_21` decimal(10,2) DEFAULT 0.00,
  `iva_105` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `cae` varchar(50) DEFAULT NULL COMMENT 'Código de Autorización Electrónico (ARCA)',
  `vencimiento_cae` date DEFAULT NULL,
  `estado` enum('EMITIDA','ANULADA') DEFAULT 'EMITIDA',
  `observaciones` text DEFAULT NULL,
  `usuario_emision_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_factura` (`numero_factura`),
  KEY `pedido_id` (`pedido_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `usuario_emision_id` (`usuario_emision_id`),
  KEY `idx_numero` (`numero_factura`),
  KEY `idx_tipo` (`tipo_factura`),
  KEY `idx_fecha` (`fecha_emision`),
  KEY `idx_estado` (`estado`),
  KEY `idx_cae` (`cae`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `facturas_ibfk_3` FOREIGN KEY (`usuario_emision_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (20,'00001-00000001',NULL,1,'B','00001','2025-10-30 15:33:34',5360.00,930.25,0.00,5360.00,'61858326653891','2025-11-09','EMITIDA',NULL,1),(21,'00001-00000002',NULL,1,'B','00001','2025-10-30 15:33:55',5360.00,930.25,0.00,5360.00,'90833103862853','2025-11-09','EMITIDA',NULL,1),(22,'00001-00000003',NULL,2,'B','00001','2025-10-30 15:35:23',1300.00,225.62,0.00,1300.00,'89621396287383','2025-11-09','EMITIDA',NULL,1),(23,'00001-00000004',NULL,3,'B','00001','2025-10-30 15:39:24',1105.00,191.78,0.00,1105.00,'71379870912250','2025-11-09','EMITIDA',NULL,1),(24,'00001-00000005',NULL,13,'B','00001','2025-10-30 15:41:36',1105.00,191.78,0.00,1105.00,'70401287172916','2025-11-09','EMITIDA',NULL,1),(25,'00001-00000006',NULL,2,'B','00001','2025-10-30 15:44:49',1105.00,191.78,0.00,1105.00,'73622080379564','2025-11-09','EMITIDA',NULL,1),(26,'00001-00000007',NULL,2,'B','00001','2025-10-30 15:47:01',1105.00,191.78,0.00,1105.00,'45416171960089','2025-11-09','EMITIDA',NULL,1),(27,'00001-00000008',NULL,8,'B','00001','2025-11-06 00:09:00',2305.00,400.04,0.00,2305.00,'67397290515448','2025-11-16','EMITIDA',NULL,1),(28,'00001-00000009',NULL,9,'B','00001','2025-11-06 00:13:42',195.00,33.84,0.00,195.00,'89695896894958','2025-11-16','EMITIDA',NULL,1),(29,'00001-00000010',NULL,9,'B','00001','2025-11-06 00:16:49',195.00,33.84,0.00,195.00,'90570218320185','2025-11-16','EMITIDA',NULL,1),(30,'00001-00000011',NULL,2,'B','00001','2025-11-06 00:19:49',195.00,33.84,0.00,195.00,'37191636125077','2025-11-16','EMITIDA',NULL,1),(31,'00001-00000012',NULL,7,'B','00001','2025-11-06 00:21:23',195.00,33.84,0.00,195.00,'94845736215222','2025-11-16','EMITIDA',NULL,1),(32,'00001-00000013',NULL,2,'B','00001','2025-11-06 00:34:26',195.00,33.84,0.00,195.00,'46112768117106','2025-11-16','EMITIDA',NULL,1),(33,'00001-00000014',NULL,4,'B','00001','2025-11-06 00:37:16',455.00,78.97,0.00,455.00,'46546742216894','2025-11-16','EMITIDA',NULL,1),(34,'00001-00000015',NULL,10,'B','00001','2025-11-06 00:40:24',1430.00,248.18,0.00,1430.00,'38227337086967','2025-11-16','EMITIDA',NULL,1),(35,'00001-00000016',NULL,1,'B','00001','2025-11-06 00:40:52',1248.00,216.60,0.00,1248.00,'74335045169630','2025-11-16','EMITIDA',NULL,1),(36,'00001-00000017',NULL,1,'B','00001','2026-05-04 19:08:35',21450.00,3722.73,0.00,21450.00,'50564433304143','2026-05-14','EMITIDA',NULL,1);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingresos_mercaderia`
--

DROP TABLE IF EXISTS `ingresos_mercaderia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingresos_mercaderia` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `proveedor_id` bigint(20) NOT NULL,
  `numero_remito` varchar(50) DEFAULT NULL,
  `numero_factura` varchar(50) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `usuario_registro_id` bigint(20) DEFAULT NULL,
  `total_compra` decimal(10,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('PENDIENTE','VERIFICADO','COMPLETADO') DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  KEY `usuario_registro_id` (`usuario_registro_id`),
  KEY `idx_proveedor` (`proveedor_id`),
  KEY `idx_fecha` (`fecha_ingreso`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `ingresos_mercaderia_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `ingresos_mercaderia_ibfk_2` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingresos_mercaderia`
--

LOCK TABLES `ingresos_mercaderia` WRITE;
/*!40000 ALTER TABLE `ingresos_mercaderia` DISABLE KEYS */;
INSERT INTO `ingresos_mercaderia` VALUES (1,1,'R-00123','A-00456','2025-10-27','2025-10-27 21:49:51',1,40000.00,'Ingreso semanal de cables','COMPLETADO'),(2,1,'REM-001234','A-0001-12345678','2024-09-15','2025-10-28 18:23:43',1,85000.00,'Reposición llaves y tomas Cambre','COMPLETADO'),(3,2,'REM-002345','A-0001-23456789','2024-09-20','2025-10-28 18:23:43',1,120000.00,'Térmicas y tableros Bticino','COMPLETADO'),(4,3,'REM-003456','B-0002-34567890','2024-09-25','2025-10-28 18:23:43',1,95000.00,'Cables varios Nexo','COMPLETADO'),(5,4,'REM-004567','A-0003-45678901','2024-10-05','2025-10-28 18:23:43',1,78000.00,'Iluminación LED Lumipack','COMPLETADO'),(6,5,'REM-005678','B-0004-56789012','2024-10-15','2025-10-28 18:23:43',1,42000.00,'Herramientas varias','VERIFICADO');
/*!40000 ALTER TABLE `ingresos_mercaderia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listas_precios`
--

DROP TABLE IF EXISTS `listas_precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listas_precios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_lista` enum('GENERAL','MAYORISTA','MINORISTA','ESPECIAL') DEFAULT 'GENERAL',
  `fecha_vigencia_desde` date NOT NULL,
  `fecha_vigencia_hasta` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_tipo` (`tipo_lista`),
  KEY `idx_vigencia` (`fecha_vigencia_desde`,`fecha_vigencia_hasta`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listas_precios`
--

LOCK TABLES `listas_precios` WRITE;
/*!40000 ALTER TABLE `listas_precios` DISABLE KEYS */;
/*!40000 ALTER TABLE `listas_precios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_stock`
--

DROP TABLE IF EXISTS `movimientos_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) NOT NULL,
  `tipo_movimiento` enum('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `stock_anterior` int(11) NOT NULL,
  `stock_nuevo` int(11) NOT NULL,
  `referencia_tipo` enum('PEDIDO','INGRESO','AJUSTE_MANUAL') NOT NULL,
  `referencia_id` bigint(20) DEFAULT NULL COMMENT 'ID del pedido, ingreso o ajuste',
  `usuario_id` bigint(20) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_producto` (`producto_id`),
  KEY `idx_tipo` (`tipo_movimiento`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_referencia` (`referencia_tipo`,`referencia_id`),
  CONSTRAINT `movimientos_stock_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `movimientos_stock_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_stock`
--

LOCK TABLES `movimientos_stock` WRITE;
/*!40000 ALTER TABLE `movimientos_stock` DISABLE KEYS */;
INSERT INTO `movimientos_stock` VALUES (1,1,'SALIDA',10,100,90,'PEDIDO',1,NULL,NULL,'2025-10-27 15:16:25'),(2,1,'ENTRADA',50,90,140,'INGRESO',1,NULL,NULL,'2025-10-27 21:49:51'),(3,1,'SALIDA',50,140,90,'PEDIDO',1,NULL,NULL,'2025-10-28 18:23:35'),(4,3,'SALIDA',30,8,-22,'PEDIDO',1,NULL,NULL,'2025-10-28 18:23:35'),(5,11,'SALIDA',20,250,230,'PEDIDO',1,NULL,NULL,'2025-10-28 18:23:35'),(6,21,'SALIDA',10,50,40,'PEDIDO',2,NULL,NULL,'2025-10-28 18:23:35'),(7,22,'SALIDA',8,200,192,'PEDIDO',2,NULL,NULL,'2025-10-28 18:23:35'),(8,24,'SALIDA',5,7,2,'PEDIDO',2,NULL,NULL,'2025-10-28 18:23:35'),(9,14,'SALIDA',5,85,80,'PEDIDO',3,NULL,NULL,'2025-10-28 18:23:35'),(10,26,'SALIDA',2,110,108,'PEDIDO',3,NULL,NULL,'2025-10-28 18:23:35'),(11,11,'SALIDA',25,230,205,'PEDIDO',4,NULL,NULL,'2025-10-28 18:23:35'),(12,12,'SALIDA',10,120,110,'PEDIDO',4,NULL,NULL,'2025-10-28 18:23:35'),(13,17,'SALIDA',3,45,42,'PEDIDO',4,NULL,NULL,'2025-10-28 18:23:35'),(14,31,'SALIDA',2,140,138,'PEDIDO',5,NULL,NULL,'2025-10-28 18:23:35'),(15,41,'SALIDA',15,40,25,'PEDIDO',5,NULL,NULL,'2025-10-28 18:23:35'),(16,50,'SALIDA',8,80,72,'PEDIDO',5,NULL,NULL,'2025-10-28 18:23:35'),(17,1,'SALIDA',80,90,10,'PEDIDO',6,NULL,NULL,'2025-10-28 18:23:35'),(18,4,'SALIDA',40,300,260,'PEDIDO',6,NULL,NULL,'2025-10-28 18:23:35'),(19,31,'SALIDA',3,138,135,'PEDIDO',6,NULL,NULL,'2025-10-28 18:23:35'),(20,46,'SALIDA',4,18,14,'PEDIDO',7,NULL,NULL,'2025-10-28 18:23:35'),(21,50,'SALIDA',10,72,62,'PEDIDO',7,NULL,NULL,'2025-10-28 18:23:35'),(22,21,'SALIDA',12,40,28,'PEDIDO',8,NULL,NULL,'2025-10-28 18:23:35'),(23,24,'SALIDA',8,2,-6,'PEDIDO',8,NULL,NULL,'2025-10-28 18:23:35'),(24,27,'SALIDA',4,0,-4,'PEDIDO',8,NULL,NULL,'2025-10-28 18:23:35'),(25,16,'SALIDA',8,0,-8,'PEDIDO',9,NULL,NULL,'2025-10-28 18:23:35'),(26,18,'SALIDA',4,3,-1,'PEDIDO',9,NULL,NULL,'2025-10-28 18:23:35'),(27,47,'SALIDA',5,0,-5,'PEDIDO',10,NULL,NULL,'2025-10-28 18:23:35'),(28,44,'SALIDA',12,30,18,'PEDIDO',10,NULL,NULL,'2025-10-28 18:23:35'),(29,41,'ENTRADA',100,25,125,'INGRESO',5,NULL,NULL,'2025-10-28 18:23:43'),(30,42,'ENTRADA',50,15,65,'INGRESO',5,NULL,NULL,'2025-10-28 18:23:43'),(31,43,'ENTRADA',60,22,82,'INGRESO',5,NULL,NULL,'2025-10-28 18:23:43');
/*!40000 ALTER TABLE `movimientos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `numero_pedido` varchar(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `usuario_registro_id` bigint(20) DEFAULT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_entrega` date DEFAULT NULL,
  `estado` enum('PENDIENTE','PREPARANDO','LISTO','ENTREGADO','CANCELADO') DEFAULT 'PENDIENTE',
  `tipo_operacion` enum('BLANCO','NEGRO') DEFAULT 'BLANCO',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `descuento_monto` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_pedido` (`numero_pedido`),
  KEY `usuario_registro_id` (`usuario_registro_id`),
  KEY `idx_numero` (`numero_pedido`),
  KEY `idx_cliente` (`cliente_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_pedido`),
  KEY `idx_tipo_operacion` (`tipo_operacion`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,'PED-0001',1,1,'2025-10-27 15:16:25',NULL,'ENTREGADO','BLANCO',12000.00,0.00,0.00,12000.00,'Pedido urgente - Entregar antes del viernes'),(2,'PED-2024-001',1,1,'2024-10-01 13:30:00','2024-10-03','ENTREGADO','BLANCO',45000.00,15.00,6750.00,38250.00,'Pedido mayorista distribuidor'),(3,'PED-2024-002',6,1,'2024-10-02 14:45:00','2024-10-04','ENTREGADO','BLANCO',12500.00,5.00,625.00,11875.00,'Instalación residencial'),(4,'PED-2024-003',11,1,'2024-10-03 12:20:00','2024-10-05','ENTREGADO','NEGRO',8500.00,0.00,0.00,8500.00,'Consumidor final - efectivo'),(5,'PED-2024-004',2,1,'2024-10-05 17:15:00','2024-10-07','ENTREGADO','BLANCO',35000.00,12.00,4200.00,30800.00,'Reposición stock iluminación'),(6,'PED-2024-005',9,1,'2024-10-08 13:00:00','2024-10-10','ENTREGADO','BLANCO',6800.00,3.00,204.00,6596.00,'Materiales obra'),(7,'PED-2024-006',3,1,'2024-10-10 18:30:00','2024-10-12','ENTREGADO','BLANCO',52000.00,10.00,5200.00,46800.00,'Pedido grande cables y protección'),(8,'PED-2024-007',12,1,'2024-10-12 14:20:00','2024-10-14','ENTREGADO','NEGRO',4200.00,0.00,0.00,4200.00,'Reparación edificio'),(9,'PED-2024-008',7,1,'2024-10-15 12:45:00','2024-10-17','ENTREGADO','BLANCO',9500.00,5.00,475.00,9025.00,'Instalación comercial'),(10,'PED-2024-009',5,1,'2024-10-18 16:00:00','2024-10-20','ENTREGADO','BLANCO',28000.00,15.00,4200.00,23800.00,'Solo iluminación LED'),(11,'PED-2024-010',13,1,'2024-10-20 13:30:00','2024-10-22','ENTREGADO','NEGRO',12000.00,0.00,0.00,12000.00,'Consorcio - pago efectivo'),(12,'PED-2024-011',1,1,'2024-09-02 13:00:00','2024-09-04','ENTREGADO','BLANCO',62000.00,15.00,9300.00,52700.00,'Pedido mensual distribuidor'),(13,'PED-2024-012',4,1,'2024-09-05 14:30:00','2024-09-07','ENTREGADO','BLANCO',41000.00,12.00,4920.00,36080.00,'Reposición ferretería'),(14,'PED-2024-013',8,1,'2024-09-08 17:20:00','2024-09-10','ENTREGADO','BLANCO',15500.00,8.00,1240.00,14260.00,'Construcción particular'),(15,'PED-2024-014',14,1,'2024-09-10 12:15:00','2024-09-12','ENTREGADO','NEGRO',7800.00,0.00,0.00,7800.00,'Pinturería - contado'),(16,'PED-2024-015',2,1,'2024-09-12 18:45:00','2024-09-14','ENTREGADO','BLANCO',38000.00,12.00,4560.00,33440.00,'Varios mayorista'),(17,'PED-2024-016',6,1,'2024-09-15 13:20:00','2024-09-17','ENTREGADO','BLANCO',11200.00,5.00,560.00,10640.00,'Instalación industrial'),(18,'PED-2024-017',10,1,'2024-09-18 14:50:00','2024-09-20','ENTREGADO','BLANCO',5400.00,3.00,162.00,5238.00,'Reparaciones varias'),(19,'PED-2024-018',3,1,'2024-09-20 16:30:00','2024-09-22','ENTREGADO','BLANCO',48000.00,10.00,4800.00,43200.00,'Protección y cables'),(20,'PED-2024-019',15,1,'2024-09-22 12:00:00','2024-09-24','ENTREGADO','NEGRO',9600.00,0.00,0.00,9600.00,'Mantenimiento edificios'),(21,'PED-2024-020',5,1,'2024-09-25 17:15:00','2024-09-27','ENTREGADO','BLANCO',33000.00,15.00,4950.00,28050.00,'Iluminación especial'),(22,'PED-2024-021',1,1,'2024-08-01 13:30:00','2024-08-03','ENTREGADO','BLANCO',55000.00,15.00,8250.00,46750.00,'Pedido mensual'),(23,'PED-2024-022',4,1,'2024-08-05 14:20:00','2024-08-07','ENTREGADO','BLANCO',39000.00,12.00,4680.00,34320.00,'Reposición agosto'),(24,'PED-2024-023',7,1,'2024-08-08 18:00:00','2024-08-10','ENTREGADO','BLANCO',13500.00,5.00,675.00,12825.00,'Obra comercial'),(25,'PED-2024-024',11,1,'2024-08-10 12:45:00','2024-08-12','ENTREGADO','NEGRO',6700.00,0.00,0.00,6700.00,'Constructora - efectivo'),(26,'PED-2024-025',2,1,'2024-08-12 16:30:00','2024-08-14','ENTREGADO','BLANCO',42000.00,12.00,5040.00,36960.00,'Pedido mensual agosto'),(27,'PED-2024-026',8,1,'2024-08-15 13:15:00','2024-08-17','ENTREGADO','BLANCO',16800.00,8.00,1344.00,15456.00,'Instalación completa'),(28,'PED-2024-027',3,1,'2024-08-18 17:45:00','2024-08-20','ENTREGADO','BLANCO',51000.00,10.00,5100.00,45900.00,'Pedido grande agosto'),(29,'PED-2024-028',12,1,'2024-08-20 14:00:00','2024-08-22','ENTREGADO','NEGRO',8900.00,0.00,0.00,8900.00,'Consorcio - contado'),(30,'PED-2024-029',5,1,'2024-08-23 18:20:00','2024-08-25','ENTREGADO','BLANCO',30000.00,15.00,4500.00,25500.00,'Solo LED'),(31,'PED-2024-030',9,1,'2024-08-28 13:50:00','2024-08-30','ENTREGADO','BLANCO',7200.00,3.00,216.00,6984.00,'Materiales varios');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `precios_productos`
--

DROP TABLE IF EXISTS `precios_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `precios_productos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) NOT NULL,
  `lista_precio_id` bigint(20) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `fecha_desde` date NOT NULL,
  `fecha_hasta` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_producto` (`producto_id`),
  KEY `idx_lista` (`lista_precio_id`),
  KEY `idx_fecha` (`fecha_desde`,`fecha_hasta`),
  CONSTRAINT `precios_productos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `precios_productos_ibfk_2` FOREIGN KEY (`lista_precio_id`) REFERENCES `listas_precios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `precios_productos`
--

LOCK TABLES `precios_productos` WRITE;
/*!40000 ALTER TABLE `precios_productos` DISABLE KEYS */;
/*!40000 ALTER TABLE `precios_productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `categoria_id` bigint(20) DEFAULT NULL,
  `precio_base` decimal(10,2) NOT NULL COMMENT 'Precio sin margen de ganancia',
  `precio_venta` decimal(10,2) NOT NULL COMMENT 'Precio con margen aplicado',
  `margen_ganancia` decimal(5,2) DEFAULT 20.00 COMMENT 'Porcentaje de ganancia',
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 10 COMMENT 'Alerta de stock bajo',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_categoria` (`categoria_id`),
  KEY `idx_activo` (`activo`),
  KEY `idx_stock` (`stock`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'CABLE001','Cable eléctrico 2.5mm',1,1000.00,1200.00,20.00,7,10,1,'2025-10-27 14:57:16','2025-11-06 00:09:00'),(2,'CAB-001','Cable Unipolar 1.5mm x Metro - Negro',1,150.00,195.00,30.00,474,100,1,'2025-10-28 18:23:13','2026-05-04 19:08:35'),(3,'CAB-002','Cable Unipolar 2.5mm x Metro - Rojo',1,220.00,286.00,30.00,195,100,1,'2025-10-28 18:23:13','2025-11-06 00:40:25'),(4,'CAB-003','Cable Unipolar 4mm x Metro - Azul',1,350.00,455.00,30.00,259,80,1,'2025-10-28 18:23:13','2025-11-06 00:37:16'),(5,'CAB-004','Cable Unipolar 6mm x Metro - Negro',1,520.00,676.00,30.00,150,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(6,'CAB-005','Cable Taller 3x1.5mm x Metro',1,480.00,624.00,30.00,0,60,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(7,'CAB-006','Cable Taller 3x2.5mm x Metro',1,720.00,936.00,30.00,180,40,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(8,'CAB-007','Cable TPR 2x1mm x Metro',1,280.00,364.00,30.00,400,120,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(9,'CAB-008','Cable TPR 2x2.5mm x Metro',1,450.00,585.00,30.00,5,100,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(10,'CAB-009','Cable Subterráneo 3x2.5mm x Metro',1,850.00,1105.00,30.00,90,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(11,'CAB-010','Cable Telefonía 2 Pares x Metro',1,120.00,156.00,30.00,197,80,1,'2025-10-28 18:23:13','2025-11-06 00:40:52'),(12,'ILU-001','Lámpara LED 9W E27 Luz Fría',2,850.00,1105.00,30.00,109,50,1,'2025-10-28 18:23:13','2025-11-06 00:09:00'),(13,'ILU-002','Lámpara LED 12W E27 Luz Cálida',2,950.00,1235.00,30.00,8,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(14,'ILU-003','Lámpara LED 15W E27 Luz Día',2,1100.00,1430.00,30.00,80,40,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(15,'ILU-004','Tubo LED T8 18W 120cm',2,1200.00,1560.00,30.00,60,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(16,'ILU-005','Tubo LED T8 9W 60cm',2,850.00,1105.00,30.00,-8,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(17,'ILU-006','Panel LED 24W Cuadrado Embutir',2,2500.00,3250.00,30.00,42,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(18,'ILU-007','Panel LED 18W Redondo Embutir',2,2100.00,2730.00,30.00,-1,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(19,'ILU-008','Reflector LED 50W Exterior',2,4500.00,5850.00,30.00,32,15,1,'2025-10-28 18:23:13','2026-05-04 19:08:35'),(20,'ILU-009','Reflector LED 100W Exterior',2,7200.00,9360.00,30.00,22,10,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(21,'ILU-010','Tira LED 5050 RGB x Metro con Control',2,1800.00,2340.00,30.00,28,25,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(22,'LLT-001','Llave Simple Cambre Blanca',3,320.00,416.00,30.00,192,80,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(23,'LLT-002','Llave Combinada Simple + Toma Cambre',3,580.00,754.00,30.00,150,60,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(24,'LLT-003','Llave Doble Cambre Blanca',3,450.00,585.00,30.00,-6,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(25,'LLT-004','Toma Simple Cambre con Tapa',3,380.00,494.00,30.00,180,70,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(26,'LLT-005','Toma Doble Cambre con Tapa',3,520.00,676.00,30.00,108,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(27,'LLT-006','Toma Triple Cambre con Tapa',3,680.00,884.00,30.00,-4,40,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(28,'LLT-007','Llave Cruzamiento Cambre',3,550.00,715.00,30.00,65,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(29,'LLT-008','Toma Schuko con Descarga a Tierra',3,720.00,936.00,30.00,90,40,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(30,'LLT-009','Dimmer Regulador de Luz 300W',3,1200.00,1560.00,30.00,4,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(31,'LLT-010','Pulsador Timbre Cambre Blanco',3,280.00,364.00,30.00,135,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(32,'PRO-001','Térmica Bipolar 10A Bticino',4,2800.00,3360.00,20.00,45,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(33,'PRO-002','Térmica Bipolar 16A Bticino',4,2900.00,3480.00,20.00,38,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(34,'PRO-003','Térmica Bipolar 20A Bticino',4,3000.00,3600.00,20.00,2,15,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(35,'PRO-004','Térmica Bipolar 25A Bticino',4,3200.00,3840.00,20.00,30,15,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(36,'PRO-005','Térmica Tripolar 32A Bticino',4,5500.00,6600.00,20.00,18,10,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(37,'PRO-006','Disyuntor Diferencial 25A 30mA Bipolar',4,8500.00,10200.00,20.00,12,8,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(38,'PRO-007','Disyuntor Diferencial 40A 30mA Bipolar',4,9200.00,11040.00,20.00,0,8,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(39,'PRO-008','Tablero Embutir 12 Módulos',4,3500.00,4200.00,20.00,25,12,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(40,'PRO-009','Tablero Embutir 24 Módulos',4,5800.00,6960.00,20.00,1,8,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(41,'PRO-010','Bornera Riel Din 10mm2 x20 Unidades',4,2400.00,2880.00,20.00,125,15,1,'2025-10-28 18:23:13','2025-10-28 18:23:43'),(42,'HER-001','Pinza Amperométrica Digital',5,8500.00,11050.00,30.00,65,5,1,'2025-10-28 18:23:13','2025-10-28 18:23:43'),(43,'HER-002','Tester Digital Multímetro',5,3200.00,4160.00,30.00,82,10,1,'2025-10-28 18:23:13','2025-10-28 18:23:43'),(44,'HER-003','Pinza Electricista 8\" Aislada',5,2800.00,3640.00,30.00,18,12,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(45,'HER-004','Destornillador Buscapolos Plano',5,450.00,585.00,30.00,2,20,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(46,'HER-005','Set Destornilladores Electricista 5 Piezas',5,2200.00,2860.00,30.00,14,8,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(47,'HER-006','Pela Cables Automático 3 en 1',5,1800.00,2340.00,30.00,-5,10,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(48,'HER-007','Crimpeadora RJ45 RJ11',5,3500.00,4550.00,30.00,12,6,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(49,'HER-008','Taladro Percutor 550W + Mechas',5,15000.00,19500.00,30.00,8,4,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(50,'INS-001','Caja Octogonal Chapa P/Techo x10',6,1200.00,1560.00,30.00,62,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:35'),(51,'INS-002','Caja Rectangular 5x10cm P/Pared x10',6,1500.00,1950.00,30.00,65,25,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(52,'INS-003','Caño Corrugado 3/4\" x Rollo 25m',6,3200.00,4160.00,30.00,1,15,1,'2025-10-28 18:23:13','2025-10-30 15:33:55'),(53,'INS-004','Caño Rígido PVC 5/8\" x 3m',6,850.00,1105.00,30.00,115,40,1,'2025-10-28 18:23:13','2025-10-30 15:47:01'),(54,'INS-005','Grampas Cañero 3/4\" x100 Unidades',6,450.00,585.00,30.00,0,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(55,'INS-006','Cinta Aisladora 3M Scotch 33+ 20m',6,1800.00,2340.00,30.00,95,30,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(56,'VEN-001','Ventilador de Techo 3 Palas Blanco',7,12000.00,15600.00,30.00,18,8,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(57,'VEN-002','Ventilador de Techo con Luz LED',7,18500.00,24050.00,30.00,1,6,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(58,'VEN-003','Extractor de Baño 6\" Axial',7,7800.00,10140.00,30.00,12,5,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(59,'VEN-004','Extractor Industrial 12\" Pared',7,15000.00,19500.00,30.00,0,4,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(60,'MAT-001','Precintos Plásticos 20cm x100 Blanco',8,800.00,1040.00,30.00,150,50,1,'2025-10-28 18:23:13','2025-10-28 18:23:13'),(61,'MAT-002','Bornera Electricista 10A x100 Unidades',8,1200.00,1560.00,30.00,2,40,1,'2025-10-28 18:23:13','2025-10-28 18:23:13');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `productos_stock_bajo`
--

DROP TABLE IF EXISTS `productos_stock_bajo`;
/*!50001 DROP VIEW IF EXISTS `productos_stock_bajo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `productos_stock_bajo` AS SELECT 
 1 AS `id`,
 1 AS `codigo`,
 1 AS `descripcion`,
 1 AS `categoria`,
 1 AS `stock`,
 1 AS `stock_minimo`,
 1 AS `unidades_faltantes`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `razon_social` varchar(150) DEFAULT NULL,
  `cuit` varchar(15) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `contacto_nombre` varchar(100) DEFAULT NULL COMMENT 'Nombre del contacto principal',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuit` (`cuit`),
  KEY `idx_cuit` (`cuit`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'Electro Sur SA','Electro Sur Sociedad Anónima','30-71234567-8','2614567890','ventas@electrosur.com.ar','Av. San Martín 2500, Mendoza','Roberto Gómez',1,'2025-10-27 21:48:42','2025-10-27 21:48:42'),(2,'Cambre Argentina','Cambre Argentina SA','30-50123456-7','011-43211234','ventas@cambre.com.ar','Av. Industrial 1000, CABA','Ricardo Fernández',1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(3,'Bticino Argentina','Bticino Argentina SA','30-50123457-8','011-43211235','comercial@bticino.com.ar','Panamericana Km 35, Pilar','Laura Martínez',1,'2025-10-28 18:23:35','2025-10-30 14:13:06'),(4,'Nexo Cables','Nexo Cables SRL','30-50123458-9','011-43211236','info@nexocables.com','Ruta 8 Km 50, Buenos Aires','Javier Sánchez',1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(5,'Lumipack LED','Lumipack Iluminación SA','30-50123459-0','011-43211237','ventas@lumipack.com.ar','Av. Córdoba 5000, CABA','Mónica López',1,'2025-10-28 18:23:35','2025-10-28 18:23:35'),(6,'Herramientas del Sur','Herramientas del Sur SA','30-50123460-1','011-43211238','comercial@herrasur.com','Av. Warnes 2000, CABA','Diego Rojas',1,'2025-10-28 18:23:35','2025-10-28 18:23:35');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `resumen_facturacion`
--

DROP TABLE IF EXISTS `resumen_facturacion`;
/*!50001 DROP VIEW IF EXISTS `resumen_facturacion`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `resumen_facturacion` AS SELECT 
 1 AS `fecha`,
 1 AS `tipo_factura`,
 1 AS `cantidad_facturas`,
 1 AS `total_subtotal`,
 1 AS `total_iva`,
 1 AS `total_facturado`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `sesiones`
--

DROP TABLE IF EXISTS `sesiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `token` varchar(255) NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime NOT NULL,
  `fecha_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones`
--

LOCK TABLES `sesiones` WRITE;
/*!40000 ALTER TABLE `sesiones` DISABLE KEYS */;
INSERT INTO `sesiones` VALUES (1,1,'00f98d7fceabaaf5e486aea7402890077e150c3476a769025676790d996d2126','2025-11-06 14:34:04',1,'2025-10-30 14:34:04','2025-10-30 14:34:04'),(2,1,'6f3813825a96c01795b135c584fa8badc4e46820a44961315db299d1e93b1029','2025-11-12 23:42:08',1,'2025-11-05 23:42:08','2025-11-05 23:42:08'),(3,1,'83167f213704b4808a2c38f9384fa8638d2f238b763a6c9bfb1a58845d68ecdf','2025-11-13 13:34:29',1,'2025-11-06 13:34:29','2025-11-06 13:34:29'),(4,1,'fe7df3917f384bef4964d3e3d59c98344cfe70084ab9ba2f8c0f0580da5b6a03','2025-11-13 13:35:57',1,'2025-11-06 13:35:57','2025-11-06 13:35:57'),(5,1,'726e5d7abcfb489ed319b8f932bc5adcdd232a7a2471954efe2a07ac52712d41','2025-11-13 13:38:44',1,'2025-11-06 13:38:44','2025-11-06 13:38:44'),(6,1,'6245d0ab126538db9aba4dceca22468ecbccd2ed352f962d3b5bffa799a9fd28','2025-11-13 14:05:51',1,'2025-11-06 14:05:51','2025-11-06 14:05:51'),(7,1,'168ef0a4449fe6437ad4302b62e7d7ebda160781543ee92bbc62bc8a173a8bb2','2025-11-13 14:14:25',1,'2025-11-06 14:14:25','2025-11-06 14:14:25'),(8,1,'ba6e7075ab94cc073288a4fd1ddddef5570c13df83314896209c5f772098b179','2026-05-11 19:06:48',1,'2026-05-04 19:06:48','2026-05-04 19:06:48');
/*!40000 ALTER TABLE `sesiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `empleado_id` bigint(20) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('ADMIN','VENDEDOR','DEPOSITO','FACTURACION','VIAJANTE') NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `empleado_id` (`empleado_id`),
  KEY `idx_username` (`username`),
  KEY `idx_rol` (`rol`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'admin','admin123','ADMIN',1,'2026-05-04 19:06:47','2025-10-27 14:16:55'),(5,2,'gerente','gerente123','ADMIN',1,'2025-10-29 15:32:43','2025-10-29 15:19:35'),(6,3,'supervisor','super123','ADMIN',1,NULL,'2025-10-29 15:19:35');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_pedidos_completos`
--

DROP TABLE IF EXISTS `vista_pedidos_completos`;
/*!50001 DROP VIEW IF EXISTS `vista_pedidos_completos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_pedidos_completos` AS SELECT 
 1 AS `id`,
 1 AS `numero_pedido`,
 1 AS `cliente`,
 1 AS `fecha_pedido`,
 1 AS `estado`,
 1 AS `tipo_operacion`,
 1 AS `total`,
 1 AS `usuario_registro`,
 1 AS `cantidad_items`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'daylight_db'
--

--
-- Final view structure for view `productos_stock_bajo`
--

/*!50001 DROP VIEW IF EXISTS `productos_stock_bajo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `productos_stock_bajo` AS select `p`.`id` AS `id`,`p`.`codigo` AS `codigo`,`p`.`descripcion` AS `descripcion`,`c`.`nombre` AS `categoria`,`p`.`stock` AS `stock`,`p`.`stock_minimo` AS `stock_minimo`,`p`.`stock_minimo` - `p`.`stock` AS `unidades_faltantes` from (`productos` `p` left join `categorias` `c` on(`p`.`categoria_id` = `c`.`id`)) where `p`.`stock` <= `p`.`stock_minimo` and `p`.`activo` = 1 order by `p`.`stock_minimo` - `p`.`stock` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `resumen_facturacion`
--

/*!50001 DROP VIEW IF EXISTS `resumen_facturacion`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `resumen_facturacion` AS select cast(`f`.`fecha_emision` as date) AS `fecha`,`f`.`tipo_factura` AS `tipo_factura`,count(0) AS `cantidad_facturas`,sum(`f`.`subtotal`) AS `total_subtotal`,sum(`f`.`iva_21` + `f`.`iva_105`) AS `total_iva`,sum(`f`.`total`) AS `total_facturado` from `facturas` `f` where `f`.`estado` = 'EMITIDA' group by cast(`f`.`fecha_emision` as date),`f`.`tipo_factura` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_pedidos_completos`
--

/*!50001 DROP VIEW IF EXISTS `vista_pedidos_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_pedidos_completos` AS select `p`.`id` AS `id`,`p`.`numero_pedido` AS `numero_pedido`,`c`.`nombre` AS `cliente`,`p`.`fecha_pedido` AS `fecha_pedido`,`p`.`estado` AS `estado`,`p`.`tipo_operacion` AS `tipo_operacion`,`p`.`total` AS `total`,`u`.`username` AS `usuario_registro`,count(`dp`.`id`) AS `cantidad_items` from (((`pedidos` `p` join `clientes` `c` on(`p`.`cliente_id` = `c`.`id`)) left join `usuarios` `u` on(`p`.`usuario_registro_id` = `u`.`id`)) left join `detalle_pedidos` `dp` on(`p`.`id` = `dp`.`pedido_id`)) group by `p`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-04 16:12:01
