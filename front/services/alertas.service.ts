import { api } from './api.service';

export interface Alertas {
  pedidos_pendientes: number;
  stock_bajo: number;
  agotados: number;
}

export async function getAlertas(): Promise<Alertas> {
  const response = await api.get<{ success: boolean; data: Alertas }>('/reportes/alertas');
  return response.data;
}
