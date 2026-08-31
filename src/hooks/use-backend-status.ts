import { useCallback, useEffect, useState } from 'react';

import { env } from '@/config/env';

export type BackendStatus = 'verificando' | 'conectado' | 'sin-conexion';

const TIMEOUT_MS = 5000;

/**
 * Consulta el endpoint de salud del backend para saber si el teléfono llega
 * a la API. Es el primer diagnóstico a mirar cuando la app no trae datos:
 * distingue un problema de red (IP, WiFi, firewall) de un problema de la app.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>('verificando');

  const verificar = useCallback(async () => {
    setStatus('verificando');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const respuesta = await fetch(`${env.apiUrl}/actuator/health`, {
        signal: controller.signal,
      });
      setStatus(respuesta.ok ? 'conectado' : 'sin-conexion');
    } catch {
      setStatus('sin-conexion');
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  return { status, verificar };
}
