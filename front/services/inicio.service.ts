import { api } from './api.service';

export interface InicioPeriodo {
  pedidos: number;
  ventas: number;
  anterior: { pedidos: number; ventas: number };
}

export interface InicioData {
  hoy: InicioPeriodo;
  semana: InicioPeriodo;
  mes: InicioPeriodo;
  ultimos_7_dias: Array<{ dia: string; ventas: number }>;
  pedidos_activos: { PENDIENTE: number; PREPARANDO: number; LISTO: number };
  pedidos_por_atender: Array<{
    id: number;
    numero: string | null;
    estado: 'PENDIENTE' | 'PREPARANDO' | 'LISTO';
    total: number;
    tipo: 'BLANCO' | 'NEGRO';
    fecha: string;
    cliente: string;
  }>;
  stock_bajo: {
    total: number;
    agotados: number;
    items: Array<{ id: number; codigo: string; descripcion: string; stock: number; minimo: number }>;
  };
  ultimas_facturas: Array<{
    id: number;
    numero: string | null;
    tipo: string;
    total: number;
    estado: 'EMITIDA' | 'ANULADA';
    fecha: string;
    cliente: string;
  }>;
  deuda_clientes: { clientes: number; monto: number };
}

export async function getInicio(): Promise<InicioData> {
  const response = await api.get<{ success: boolean; data: InicioData }>('/reportes/inicio');
  return response.data;
}
