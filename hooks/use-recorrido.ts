import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerRecorrido } from '@/api/posiciones';
import type { PosicionResponse } from '@/types';

interface UseRecorridoOptions {
  viajeId: number | null;
  /** Intervalo de refresco en ms. Por defecto 5000ms para acompañar al simulador. */
  intervaloMs?: number;
}

/**
 * Hook para consultar y seguir la traza cronológica (coordenadas) de un viaje específico.
 */
export function useRecorrido({ viajeId, intervaloMs = 5000 }: UseRecorridoOptions) {
  const query = useQuery<PosicionResponse[], Error>({
    queryKey: ['recorrido', viajeId],
    queryFn: () => obtenerRecorrido(viajeId!),
    enabled: viajeId != null && viajeId > 0,
    refetchInterval: intervaloMs,
  });

  const posiciones = query.data ?? [];

  // Mapeo memoizado a formato requerido por react-native-maps <Polyline>
  const coordenadas = useMemo(
    () =>
      posiciones.map((p) => ({
        latitude: p.latitud,
        longitude: p.longitud,
      })),
    [posiciones]
  );

  return {
    posiciones,
    coordenadas,
    cargando: query.isLoading,
    actualizando: query.isFetching,
    error: query.error,
    reintentar: query.refetch,
  };
}
