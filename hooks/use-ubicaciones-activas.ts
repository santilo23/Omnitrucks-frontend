import { useQuery } from '@tanstack/react-query';
import { obtenerUbicacionesActivas } from '@/api/posiciones';
import type { UbicacionActivaResponse } from '@/types';

interface UseUbicacionesActivasOptions {
  /** Intervalo en milisegundos para refrescar la posición de los camiones. Por defecto 5000ms. */
  intervaloMs?: number;
  /** Si la consulta está habilitada. */
  enabled?: boolean;
}

/**
 * Hook para consultar en tiempo real las posiciones de los camiones que están en ruta.
 * Emplea React Query con refetchInterval para refresco automático continuo.
 */
export function useUbicacionesActivas({
  intervaloMs = 5000,
  enabled = true,
}: UseUbicacionesActivasOptions = {}) {
  const query = useQuery<UbicacionActivaResponse[], Error>({
    queryKey: ['ubicaciones-activas'],
    queryFn: obtenerUbicacionesActivas,
    refetchInterval: intervaloMs,
    enabled,
  });

  return {
    ubicaciones: query.data ?? [],
    cargando: query.isLoading,
    actualizando: query.isFetching,
    error: query.error,
    hayError: query.isError,
    reintentar: query.refetch,
  };
}
