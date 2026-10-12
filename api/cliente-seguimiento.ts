import { clienteApi } from './cliente';
import type {
  EnvioClienteResumenResponse,
  SeguimientoClienteResponse,
  UbicacionSeguimientoResponse,
} from '@/types';

/**
 * Consulta la información pública y estado de un envío mediante código de seguimiento.
 */
export async function obtenerSeguimiento(codigoSeguimiento: string): Promise<SeguimientoClienteResponse> {
  const { data } = await clienteApi.get<SeguimientoClienteResponse>(
    `/api/cliente/seguimiento/${encodeURIComponent(codigoSeguimiento.trim())}`
  );
  return data;
}

/**
 * Lista todos los envíos asignados al cliente actualmente autenticado.
 */
export async function obtenerMisEnvios(): Promise<EnvioClienteResumenResponse[]> {
  const { data } = await clienteApi.get<EnvioClienteResumenResponse[]>('/api/cliente/mis-envios');
  return data;
}

/**
 * Consulta la posición en vivo del camión asignado para dibujar el mapa exclusivo del envío.
 */
export async function obtenerUbicacionSeguimiento(
  codigoSeguimiento: string
): Promise<UbicacionSeguimientoResponse> {
  const { data } = await clienteApi.get<UbicacionSeguimientoResponse>(
    `/api/cliente/seguimiento/${encodeURIComponent(codigoSeguimiento.trim())}/ubicacion`
  );
  return data;
}
