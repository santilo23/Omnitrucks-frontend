import { clienteApi } from './cliente';
import type { EstadoViaje, ViajeResponse } from '@/types';

/**
 * Obtiene el listado de viajes, opcionalmente filtrados por estado.
 */
export async function obtenerViajes(estado?: EstadoViaje): Promise<ViajeResponse[]> {
  const { data } = await clienteApi.get<ViajeResponse[]>('/api/viajes', {
    params: estado ? { estado } : undefined,
  });
  return data;
}

/**
 * Obtiene los datos detallados de un viaje en particular.
 */
export async function obtenerViaje(viajeId: number): Promise<ViajeResponse> {
  const { data } = await clienteApi.get<ViajeResponse>(`/api/viajes/${viajeId}`);
  return data;
}
