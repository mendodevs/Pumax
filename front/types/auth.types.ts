// Tipos para autenticación

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
}

export interface Usuario {
  id: number;
  empleado_id: number | null;
  username: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'DEPOSITO' | 'FACTURACION' | 'VIAJANTE';
  activo: boolean;
  ultimo_acceso: string | null;
  fecha_creacion: string;
  empleado?: Empleado;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: Usuario;
  token?: string; // Token de sesión
}
