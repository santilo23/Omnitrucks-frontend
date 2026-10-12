import { clienteApi } from '@/api/cliente';
import type { CambiarPasswordRequest, LoginRequest, LoginResponse } from '@/types';

/**
 * Realiza la autenticación contra el backend enviando email y contraseña.
 * Retorna el token JWT y los datos del perfil (nombre completo, rol, email).
 */
export async function loginApi(credenciales: LoginRequest): Promise<LoginResponse> {
  const { data } = await clienteApi.post<LoginResponse>('/api/auth/login', credenciales);
  return data;
}

/**
 * Actualiza la contraseña del usuario autenticado (requerido al ingresar con clave provisoria).
 */
export async function cambiarPasswordApi(datos: CambiarPasswordRequest): Promise<void> {
  await clienteApi.post('/api/auth/cambiar-password', datos);
}
