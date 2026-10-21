import { Usuario } from '../types/auth.types';

/**
 * Llamadas públicas de cuenta (no necesitan sesión): registro, ingreso con Google y
 * recuperación de contraseña.
 *
 * La URL base sale de EXPO_PUBLIC_API_URL, igual que el resto de la app. Acepta tanto
 * "http://IP:3000" como "http://IP:3000/api".
 *
 * Ninguna función tira error: si falla la conexión o el servidor responde con error,
 * devuelven { success: false, message } listo para mostrar en pantalla.
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

export interface RespuestaSimple {
  success: boolean;
  message?: string;
}

export interface RespuestaSesion extends RespuestaSimple {
  data?: Usuario;
  token?: string;
  /** Código que manda el servidor en algunos errores, por ejemplo CUENTA_NO_ENCONTRADA */
  codigo?: string;
}

async function post<T extends RespuestaSimple>(ruta: string, cuerpo: unknown): Promise<T> {
  try {
    const res = await fetch(`${API}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // respuesta sin JSON (por ejemplo, un error del proxy)
    }

    if (json && typeof json.success === 'boolean') {
      return json as T;
    }
    return {
      success: false,
      message: json?.message || json?.mensaje || `Error ${res.status}`,
    } as T;
  } catch {
    return {
      success: false,
      message: 'No se pudo conectar con el servidor. Probá de nuevo.',
    } as T;
  }
}

/** Crea el negocio y la cuenta de superadministrador. Devuelve la sesión ya iniciada. */
export const registrar = (datos: {
  nombre: string;
  apellido: string;
  nombre_negocio: string;
  email: string;
  password: string;
  acepta_promociones: boolean;
}) => post<RespuestaSesion>('/auth/register', datos);

/**
 * Ingreso o registro con Google. El idToken lo verifica el servidor contra Google.
 *  - modo "login": solo entra si la cuenta ya existe (si no, codigo CUENTA_NO_ENCONTRADA).
 *  - modo "registro": si la cuenta no existe, la crea junto con su negocio.
 */
export const ingresarConGoogle = (datos: {
  idToken: string;
  modo: 'login' | 'registro';
  nombre_negocio?: string;
  acepta_promociones?: boolean;
}) => post<RespuestaSesion>('/auth/google', datos);

/** Pide el correo de recuperación. Responde igual exista o no el email. */
export const olvidePassword = (email: string) =>
  post<RespuestaSimple>('/auth/forgot-password', { email });

/** Cambia la contraseña con el token que llegó por mail. */
export const restablecerPassword = (token: string, password_nueva: string) =>
  post<RespuestaSimple>('/auth/reset-password', { token, password_nueva });