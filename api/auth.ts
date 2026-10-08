import { clienteApi } from '@/api/cliente';
import type { LoginRequest, LoginResponse } from '@/types';

/**
 * Realiza la autenticación contra el backend enviando email y contraseña.
 * Retorna el token JWT y los datos del perfil (nombre completo, rol, email).
 */
export async function loginApi(credenciales: LoginRequest): Promise<LoginResponse> {
  const { data } = await clienteApi.post<LoginResponse>('/api/auth/login', credenciales);
  return data;
}
