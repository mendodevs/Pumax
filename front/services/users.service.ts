import { api } from './api.service';
import type { Rol } from '../types/account.types';

export type { Rol };

/** Ficha de empleado de la persona (puede no existir en usuarios viejos) */
export interface UserEmpleado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
}

export interface User {
  id: number;
  username: string;
  rol: Rol;
  activo: boolean;
  empleado_id: number | null;
  ultimo_acceso: string | null;
  fecha_creacion: string | null;
  empleado: UserEmpleado | null;
}

export interface EmpleadoInput {
  nombre: string;
  apellido: string;
  dni: string;
  cargo?: string;
  email?: string;
  telefono?: string;
}

export interface CreateUserData {
  username: string;
  rol: Rol;
  /** Sin contraseña, el servidor genera una temporal */
  password?: string;
  empleado: EmpleadoInput;
}

export interface UpdateUserData {
  rol?: Rol;
  activo?: boolean;
  empleado?: Partial<EmpleadoInput>;
}

/** Todos los usuarios, activos e inactivos (solo ADMIN) */
export async function getAllUsers(): Promise<User[]> {
  const response = await api.get<{ success: boolean; data: User[] }>('/usuarios');
  return response.data;
}

/** Crea el usuario con su ficha de empleado. `passwordTemporal` viene solo si el servidor la generó. */
export async function createUser(data: CreateUserData) {
  const response = await api.post<{ success: boolean; data: User; password_temporal?: string }>(
    '/usuarios',
    data
  );
  return { user: response.data, passwordTemporal: response.password_temporal };
}

export async function updateUser(id: number, data: UpdateUserData): Promise<User> {
  const response = await api.put<{ success: boolean; data: User }>(`/usuarios/${id}`, data);
  return response.data;
}

/** Desactivar o reactivar (no se borra nunca: conserva el historial) */
export const setUserActive = (id: number, activo: boolean) => updateUser(id, { activo });

/** Reinicia la contraseña de otra persona. Sin `password`, el servidor genera una temporal. */
export async function resetUserPassword(id: number, password?: string) {
  const response = await api.put<{ success: boolean; password_temporal?: string }>(
    `/usuarios/${id}/password`,
    password ? { password_nueva: password } : {}
  );
  return { passwordTemporal: response.password_temporal };
}

// Perfil del usuario que inició sesión
export async function getCurrentUser() {
  const response = await api.get<{ success: boolean; data: User; message: string }>(
    '/usuarios/verificar-sesion'
  );
  return response.data;
}
