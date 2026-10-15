export type PermissionState = "granted" | "denied" | "default" | "unsupported";

export interface NotifyOptions {
  /** Notificaciones con el mismo tag se reemplazan entre sí en vez de apilarse */
  tag?: string;
  /** Pantalla a abrir al tocar la notificación (ej. "/dashboard/Products") */
  url?: string;
}
