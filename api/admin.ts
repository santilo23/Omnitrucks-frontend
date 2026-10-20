import { clienteApi } from './cliente';
import type {
  AsignarViajeAdminRequest,
  CamionFlotaResponse,
  CrearCamionRequest,
  CrearChoferRequest,
  CrearClienteRequest,
  FiltroFlota,
  FlotaResumenResponse,
  UsuarioResponse,
  ViajeMonitoreoAdminResponse,
} from '@/types';

/**
 * Registra y da de alta un nuevo camión en la flota desde el panel de administración.
 */
export async function crearCamionAdmin(datos: CrearCamionRequest): Promise<CamionFlotaResponse> {
  const { data } = await clienteApi.post<CamionFlotaResponse>('/api/camiones', datos);
  return data;
}

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
 * Registra y da de alta un nuevo cliente en el sistema con clave provisoria.
 */
export async function crearClienteAdmin(datos: CrearClienteRequest): Promise<UsuarioResponse> {
  const { data } = await clienteApi.post<UsuarioResponse>('/api/admin/clientes', datos);
  return data;
}

/**
 * Obtiene el listado de todos los clientes registrados en el sistema.
 */
export async function listarClientesAdmin(): Promise<UsuarioResponse[]> {
  const { data } = await clienteApi.get<UsuarioResponse[]>('/api/admin/clientes');
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

/**
 * Finaliza un viaje activo en curso, liberando el camión y el chofer para nuevas asignaciones.
 */
export async function finalizarViajeAdmin(viajeId: number): Promise<void> {
  await clienteApi.post(`/api/admin/viajes/${viajeId}/finalizar`);
}

