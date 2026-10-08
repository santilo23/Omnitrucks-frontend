import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { loginApi } from '@/api/auth';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/api/cliente';
import { storage } from '@/lib/storage';
import type { LoginRequest, UsuarioAutenticado } from '@/types';

interface AuthContextType {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  isLoading: boolean;
  login: (credenciales: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión guardada al iniciar la aplicación
  useEffect(() => {
    async function restaurarSesion() {
      try {
        const storedToken = await storage.getItem(TOKEN_STORAGE_KEY);
        const storedUserJson = await storage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUserJson) {
          const userParsed = JSON.parse(storedUserJson) as UsuarioAutenticado;
          setToken(storedToken);
          setUsuario(userParsed);
        }
      } catch (error) {
        console.error('Error al restaurar sesión previa:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restaurarSesion();
  }, []);

  const login = useCallback(async (credenciales: LoginRequest) => {
    const data = await loginApi(credenciales);

    const user: UsuarioAutenticado = {
      email: data.email,
      nombreCompleto: data.nombreCompleto,
      rol: data.rol,
    };

    await storage.setItem(TOKEN_STORAGE_KEY, data.token);
    await storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    setToken(data.token);
    setUsuario(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await storage.removeItem(TOKEN_STORAGE_KEY);
      await storage.removeItem(USER_STORAGE_KEY);
    } finally {
      setToken(null);
      setUsuario(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isLoading,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
