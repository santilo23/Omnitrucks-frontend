import { clienteApi } from './cliente';
import type { RutaChoferResponse, ViajeChoferResumenResponse } from '@/types';

/**
 * Consulta la ruta activa y destino final del camión asignado al chofer actualmente autenticado.
 * Si el chofer no tiene ningún viaje activo (204 No Content), retorna null.
 */
export async function obtenerRutaActivaChofer(): Promise<RutaChoferResponse | null> {
  const response = await clienteApi.get<RutaChoferResponse | ''>('/api/chofer/ruta-activa');
  if (response.status === 204 || !response.data) {
    return null;
  }
  return response.data as RutaChoferResponse;
}

/**
 * Consulta el itinerario, datos del vehículo asignado y traza completa de un viaje específico del chofer.
 * Restringido por política de seguridad: Chofer A no puede consultar viajes de Chofer B.
 */
export async function obtenerRutaPorViajeId(viajeId: number): Promise<RutaChoferResponse> {
  const { data } = await clienteApi.get<RutaChoferResponse>(`/api/chofer/viajes/${viajeId}/ruta`);
  return data;
}

/**
 * Obtiene el historial de viajes asignados al chofer autenticado ordenados cronológicamente.
 */
export async function obtenerMisViajesChofer(): Promise<ViajeChoferResumenResponse[]> {
  const { data } = await clienteApi.get<ViajeChoferResumenResponse[]>('/api/chofer/mis-viajes');
  return data;
}
