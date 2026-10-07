import { clienteApi } from './cliente';
import type { PosicionResponse, UbicacionActivaResponse } from '@/types';

/**
 * Obtiene la última posición conocida de cada camión actualmente en ruta (EN_CURSO o PAUSADO).
 * Es el endpoint que alimenta el mapa en vivo.
 */
export async function obtenerUbicacionesActivas(): Promise<UbicacionActivaResponse[]> {
  const { data } = await clienteApi.get<UbicacionActivaResponse[]>('/api/viajes/activos/posiciones');
  return data;
}

/**
 * Obtiene el recorrido cronológico de un viaje para dibujar su traza sobre el mapa.
 */
export async function obtenerRecorrido(
  viajeId: number,
  limite = 1000
): Promise<PosicionResponse[]> {
  const { data } = await clienteApi.get<PosicionResponse[]>(`/api/viajes/${viajeId}/recorrido`, {
    params: { limite },
  });
  return data;
}
