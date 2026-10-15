import { api } from './api.service';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DashboardData {
  kpis: {
    ventas_totales: number;
    facturacion_total: number;
    ticket_promedio: number;
    pedidos_pendientes: number;
    stock_critico: number;
    clientes_activos: number;
    productos_vendidos: number;
    crecimiento_vs_mes_anterior: number;
  };
  ventas_por_tipo: {
    BLANCO: number;
    NEGRO: number;
  };
  evolucion_ventas: Array<{
    mes: string;
    ventas: number;
  }>;
  top_productos: Array<{
    producto_id: number;
    nombre: string;
    cantidad_vendida: number;
    monto_total: number;
  }>;
  top_clientes: Array<{
    cliente_id: number;
    nombre: string;
    total_compras: number;
    cantidad_pedidos: number;
  }>;
  facturacion_por_tipo: {
    A: number;
    B: number;
    C: number;
    NEGRO: number;
  };
  pedidos_por_estado: {
    PENDIENTE: number;
    EN_PROCESO: number;
    COMPLETADO: number;
    CANCELADO: number;
  };
}

export interface VentasReportParams {
  fecha_desde: string; // YYYY-MM-DD
  fecha_hasta: string; // YYYY-MM-DD
  tipo_operacion?: 'BLANCO' | 'NEGRO';
}

export interface VentasReport {
  total_ventas: number;
  cantidad_pedidos: number;
  ticket_promedio: number;
  ventas_por_dia: Array<{
    fecha: string;
    cantidad: number;
    monto: number;
  }>;
  detalle_pedidos: Array<{
    id: number;
    fecha_pedido: string;
    cliente: string;
    total: number;
    estado: string;
  }>;
}

export interface TopProducto {
  producto_id: number;
  nombre: string;
  categoria: string;
  cantidad_vendida: number;
  monto_total: number;
  porcentaje_ventas: number;
}

export interface TopCliente {
  cliente_id: number;
  nombre: string;
  total_compras: number;
  cantidad_pedidos: number;
  ticket_promedio: number;
  ultima_compra: string;
}

export interface StockCritico {
  producto_id: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  estado: 'CRITICO' | 'BAJO' | 'AGOTADO';
}

export interface MovimientoStock {
  id: number;
  producto_id: number;
  producto_nombre: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  usuario?: string;
  fecha: string;
}

export interface FacturacionReport {
  total_facturado: number;
  cantidad_facturas: number;
  facturacion_por_tipo: {
    A: number;
    B: number;
    C: number;
    NEGRO: number;
  };
  detalle_facturas: Array<{
    id: number;
    numero_factura: string;
    tipo_factura: string;
    fecha_emision: string;
    cliente: string;
    total: number;
  }>;
}

export interface RentabilidadCategoria {
  categoria_id: number;
  categoria_nombre: string;
  total_ventas: number;
  costo_total: number;
  ganancia: number;
  margen_porcentaje: number;
  cantidad_productos: number;
  cantidad_vendida: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Obtiene el dashboard completo con KPIs y gráficas
 */
export async function getDashboard() {
  const response = await api.get<{ success: boolean; data: DashboardData }>('/reportes/dashboard');
  return response.data;
}

/**
 * Reporte de ventas por período
 */
export async function getVentasReport(params: VentasReportParams) {
  const queryParams = new URLSearchParams();
  queryParams.append('fecha_desde', params.fecha_desde);
  queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.tipo_operacion) {
    queryParams.append('tipo_operacion', params.tipo_operacion);
  }

  const response = await api.get<{ success: boolean; data: VentasReport }>(
    `/reportes/ventas?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Top productos más vendidos
 */
export async function getTopProductos(params: {
  fecha_desde: string;
  fecha_hasta: string;
  limit?: number;
  categoria_id?: number;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('fecha_desde', params.fecha_desde);
  queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString());

  const response = await api.get<{ success: boolean; data: TopProducto[] }>(
    `/reportes/top-productos?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Top clientes con mayores compras
 */
export async function getTopClientes(params: {
  fecha_desde: string;
  fecha_hasta: string;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('fecha_desde', params.fecha_desde);
  queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await api.get<{ success: boolean; data: TopCliente[] }>(
    `/reportes/top-clientes?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Productos con stock crítico o agotado
 */
export async function getStockCritico(categoria_id?: number) {
  const queryParams = categoria_id ? `?categoria_id=${categoria_id}` : '';
  const response = await api.get<{ success: boolean; data: StockCritico[] }>(
    `/reportes/stock-critico${queryParams}`
  );
  return response.data;
}

/**
 * Historial de movimientos de stock
 */
export async function getMovimientosStock(params?: {
  producto_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_movimiento?: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
}) {
  const queryParams = new URLSearchParams();
  if (params?.producto_id) queryParams.append('producto_id', params.producto_id.toString());
  if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
  if (params?.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params?.tipo_movimiento) queryParams.append('tipo_movimiento', params.tipo_movimiento);

  const query = queryParams.toString();
  const response = await api.get<{ success: boolean; data: MovimientoStock[] }>(
    `/reportes/movimientos-stock${query ? '?' + query : ''}`
  );
  return response.data;
}

/**
 * Reporte de facturación por período
 */
export async function getFacturacionReport(params: {
  fecha_desde: string;
  fecha_hasta: string;
  tipo_factura?: 'A' | 'B' | 'C' | 'NEGRO';
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('fecha_desde', params.fecha_desde);
  queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.tipo_factura) queryParams.append('tipo_factura', params.tipo_factura);

  const response = await api.get<{ success: boolean; data: FacturacionReport }>(
    `/reportes/facturacion?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Análisis de rentabilidad por categorías
 */
export async function getRentabilidadCategorias(params: {
  fecha_desde: string;
  fecha_hasta: string;
  categoria_id?: number;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('fecha_desde', params.fecha_desde);
  queryParams.append('fecha_hasta', params.fecha_hasta);
  if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString());

  const response = await api.get<{ success: boolean; data: RentabilidadCategoria[] }>(
    `/reportes/rentabilidad-categorias?${queryParams.toString()}`
  );
  return response.data;
}

// ============================================
// RESUMEN SEMANAL / MENSUAL
// ============================================
export type PeriodoTipo = 'semana' | 'mes';

export interface ResumenTotales {
  ventas: number;
  pedidos: number;
  ticket_promedio: number;
  clientes: number;
  unidades: number;
  ganancia_estimada: number;
  facturas: number;
  facturado: number;
}

export interface ResumenData {
  periodo: { tipo: PeriodoTipo; desde: string; hasta: string; etiqueta: string; es_actual: boolean };
  anterior_desde: string;
  actual: ResumenTotales;
  anterior: ResumenTotales;
  serie: Array<{ dia: string; ventas: number; pedidos: number }>;
  por_estado: Array<{ estado: string; cantidad: number }>;
  por_tipo: Array<{ tipo: 'BLANCO' | 'NEGRO'; pedidos: number; ventas: number }>;
  top_productos: Array<{ id: number; codigo: string; descripcion: string; unidades: number; monto: number }>;
  top_clientes: Array<{ id: number; nombre: string; pedidos: number; monto: number }>;
  por_categoria: Array<{ categoria: string; monto: number }>;
  movimientos_stock: Record<'ENTRADA' | 'SALIDA' | 'AJUSTE', { movimientos: number; unidades: number }>;
  stock_actual: { bajo: number; agotado: number };
}

export async function getResumen(periodo: PeriodoTipo, fecha: string) {
  const response = await api.get<{ success: boolean; data: ResumenData }>(
    `/reportes/resumen?periodo=${periodo}&fecha=${fecha}`
  );
  return response.data;
}
