export type Rol = "SUPERADMIN" | "ADMIN" | "VENDEDOR" | "DEPOSITO" | "FACTURACION" | "VIAJANTE";

/** Ficha de empleado asociada a la cuenta (puede no existir) */
export interface AccountEmployee {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fecha_ingreso: string | null;
}

export interface Account {
  id: number;
  username: string;
  rol: Rol;
  activo: boolean;
  ultimo_acceso: string | null;
  fecha_creacion: string | null;
  empleado: AccountEmployee | null;
}

/** Lo que cada persona puede editar de sí misma */
export interface UpdateAccountData {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export const ROLE_LABELS: Record<Rol, string> = {
  SUPERADMIN: "Super Administrador",
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  DEPOSITO: "Depósito",
  FACTURACION: "Facturación",
  VIAJANTE: "Viajante",
};
