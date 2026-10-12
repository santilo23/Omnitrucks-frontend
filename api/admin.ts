import { clienteApi } from './cliente';
import type {
  AsignarViajeAdminRequest,
  CamionFlotaResponse,
  CrearChoferRequest,
  FiltroFlota,
  FlotaResumenResponse,
  UsuarioResponse,
  ViajeMonitoreoAdminResponse,
} from '@/types';

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

/**
 * Registra y da de alta un nuevo chofer en el sistema con su contraseña de acceso.
 */
export async function crearChoferAdmin(datos: CrearChoferRequest): Promise<UsuarioResponse> {
  const { data } = await clienteApi.post<UsuarioResponse>('/api/admin/choferes', datos);
  return data;
}

/**
 * Obtiene el listado de todos los choferes activos registrados en el sistema.
 */
export async function listarChoferesAdmin(): Promise<UsuarioResponse[]> {
  const { data } = await clienteApi.get<UsuarioResponse[]>('/api/admin/choferes');
  return data;
}

/**
 * Asigna un nuevo viaje a un camión y chofer, con opción de iniciar la simulación en ruta inmediatamente.
 */
export async function asignarViajeAdmin(
  datos: AsignarViajeAdminRequest
): Promise<ViajeMonitoreoAdminResponse> {
  const { data } = await clienteApi.post<ViajeMonitoreoAdminResponse>('/api/admin/viajes', datos);
  return data;
}

/**
 * Obtiene el monitoreo en vivo de todos los viajes activos, incluyendo el chofer asignado,
 * su ubicación GPS actual y el código de seguimiento para el cliente.
 */
export async function obtenerViajesActivosAdmin(): Promise<ViajeMonitoreoAdminResponse[]> {
  const { data } = await clienteApi.get<ViajeMonitoreoAdminResponse[]>('/api/admin/viajes/activos');
  return data;
}

/**
 * Genera un viaje simulado de prueba con un solo click para verificar el renderizado del mapa
 * y el movimiento automático de camiones.
 */
export async function generarViajeSimuladoDemoAdmin(): Promise<ViajeMonitoreoAdminResponse> {
  const { data } = await clienteApi.post<ViajeMonitoreoAdminResponse>('/api/admin/simulacion/crear-demo');
  return data;
}
