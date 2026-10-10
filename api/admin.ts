import { clienteApi } from './cliente';
import type { CamionFlotaResponse, FiltroFlota, FlotaResumenResponse } from '@/types';

/**
 * Consulta la flota completa o filtrada (TODOS, ACTIVOS, INACTIVOS)
 * desde el endpoint protegido de administración.
 */
export async function obtenerFlotaAdmin(filtro: FiltroFlota = 'TODOS'): Promise<CamionFlotaResponse[]> {
  const { data } = await clienteApi.get<CamionFlotaResponse[]>('/api/admin/flota', {
    params: { filtro },
  });
  return data;
}

/**
 * Obtiene el resumen consolidado de la flota (total, activos, inactivos, disponibles, en tránsito).
 */
export async function obtenerResumenFlotaAdmin(): Promise<FlotaResumenResponse> {
  const { data } = await clienteApi.get<FlotaResumenResponse>('/api/admin/flota/resumen');
  return data;
}
