import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerRutaActivaChofer, obtenerRutaPorViajeId } from '@/api/chofer';
import type { RutaChoferResponse } from '@/types';

interface UseRutaChoferOptions {
  viajeId?: number | null;
  intervaloMs?: number;
  activado?: boolean;
}

/**
 * Hook reactivo para consultar y seguir la ruta asignada al chofer y su traza en tiempo real.
 * Si viajeId es omitido o nulo, consulta automáticamente el viaje en curso activo.
 */
export function useRutaChofer({
  viajeId,
  intervaloMs = 5000,
  activado = true,
}: UseRutaChoferOptions = {}) {
  const query = useQuery<RutaChoferResponse | null, Error>({
    queryKey: ['ruta-chofer', viajeId ?? 'activa'],
    queryFn: () => {
      if (viajeId != null) {
        return obtenerRutaPorViajeId(viajeId);
      }
      return obtenerRutaActivaChofer();
    },
    enabled: activado,
    refetchInterval: (queryData) => {
      // Si el viaje está en curso, pollea periódicamente cada intervaloMs
      const estado = queryData.state.data?.estado;
      return estado === 'EN_CURSO' ? intervaloMs : false;
    },
  });

  const ruta = query.data ?? null;

  // Coordenadas memoizadas para react-native-maps <Polyline>
  const coordenadasTraza = useMemo(() => {
    if (!ruta || !ruta.recorrido) return [];
    return ruta.recorrido.map((coord) => ({
      latitude: coord.latitud,
      longitude: coord.longitud,
    }));
  }, [ruta]);

  return {
    ruta,
    coordenadasTraza,
    cargando: query.isLoading,
    actualizando: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
