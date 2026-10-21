import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginRequest } from '../types/auth.types';
import { storageService } from '../services/storage.service';
import { login as loginService, verificarSesion } from '../services/auth.service';
import { ApiError } from '../services/api.service';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  /** Deja iniciada la sesión con la respuesta de registro / ingreso con Google */
  establecerSesion: (usuario: Usuario, token?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  /**
   * Restaura la sesión desde el almacenamiento al iniciar la app
   * Valida con el backend usando el token de sesión almacenado
   */
  const restoreSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await storageService.getToken();

      if (storedToken) {
        // Validar con el backend que el token sigue siendo válido
        try {
          const response = await verificarSesion();

          if (response.success && response.data) {
            // Sesión válida, actualizar con datos frescos del backend
            setUser(response.data);
            await storageService.saveUser(response.data);
            // Si el backend devuelve un nuevo token, guardarlo
            if (response.token) {
              await storageService.saveToken(response.token);
            }
          } else {
            // Sesión inválida, limpiar storage
            console.log('Sesión expirada o inválida');
            await storageService.removeUser();
            setUser(null);
          }
        } catch (error) {
          // Error al validar con backend (401, 403, etc.), limpiar sesión
          console.log('Error validando sesión con backend, limpiando...');
          await storageService.removeUser();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      // Si hay error, limpiamos cualquier dato corrupto
      await storageService.removeUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia sesión y guarda los datos del usuario y el token
   */
  const login = async (credentials: LoginRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await loginService(credentials);

      if (response.success && response.data) {
        // Guardar usuario en el estado y en storage
        setUser(response.data);
        await storageService.saveUser(response.data);

        // Guardar el token de sesión si existe
        if (response.token) {
          await storageService.saveToken(response.token);
        }

        return { success: true };
      } else {
        return {
          success: false,
          message: response.message || 'Error al iniciar sesión'
        };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, message: error.message };
      }
      return {
        success: false,
        message: 'Error de conexión. Por favor intente nuevamente.'
      };
    }
  };

  /**
   * Deja iniciada la sesión con una respuesta que ya trae usuario y token
   * (registro y login con Google). El token se guarda ANTES de marcar al usuario
   * como autenticado, para que la primera pantalla ya lo tenga disponible.
   */
  const establecerSesion = async (usuario: Usuario, token?: string) => {
    if (token) {
      await storageService.saveToken(token);
    }
    await storageService.saveUser(usuario);
    setUser(usuario);
  };

  /**
   * Cierra sesión y limpia todos los datos
   */
  const logout = async () => {
    try {
      setUser(null);
      await storageService.removeUser();
    } catch (error) {
      console.error('Error during logout:', error);
      // Aun si hay error, limpiamos el estado local
      setUser(null);
    }
  };

  // Restaurar sesión al montar el componente
  useEffect(() => {
    restoreSession();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    restoreSession,
    establecerSesion,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
