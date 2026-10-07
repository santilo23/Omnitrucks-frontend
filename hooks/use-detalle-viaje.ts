import { useQuery } from '@tanstack/react-query';
import { obtenerViaje } from '@/api/viajes';
import type { ViajeResponse } from '@/types';

/**
 * Hook para consultar los datos completos de un viaje.
 */
export function useDetalleViaje(viajeId: number | null) {
  const query = useQuery<ViajeResponse, Error>({
    queryKey: ['viaje', viajeId],
    queryFn: () => obtenerViaje(viajeId!),
    enabled: viajeId != null && viajeId > 0,
    staleTime: 10000,
  });

  return {
    viaje: query.data ?? null,
    cargando: query.isLoading,
    error: query.error,
    reintentar: query.refetch,
  };
}
