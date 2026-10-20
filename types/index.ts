/**
 * Tipos de datos que reflejan los DTOs de OmniTrucks Backend.
 */

export type EstadoViaje =
  | 'PROGRAMADO'
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface PosicionResponse {
  id: number;
  latitud: number;
  longitud: number;
  velocidadKmh: number | null;
  rumboGrados: number | null;
  precisionM: number | null;
  registradoEn: string;
  recibidoEn: string;
}

export interface UbicacionActivaResponse {
  viajeId: number;
  patente: string;
  estado: EstadoViaje;
  destinoNombre: string;
  posicion: PosicionResponse;
}

export interface PuntoGeografico {
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface CamionResumen {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
}

export interface PersonaResumen {
  id: number;
  nombreCompleto: string;
  email: string;
}

export interface ViajeResponse {
  id: number;
  estado: EstadoViaje;
  camion: CamionResumen;
  chofer: PersonaResumen;
  cliente: PersonaResumen | null;
  origen: PuntoGeografico;
  destino: PuntoGeografico;
  descripcionCarga: string | null;
  salidaProgramada: string | null;
  salidaReal: string | null;
  llegadaEstimada: string | null;
  llegadaReal: string | null;
  createdAt: string;
}

export type RolUsuario = 'ADMIN' | 'CHOFER' | 'CLIENTE';

export interface UsuarioAutenticado {
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  debeCambiarPassword?: boolean;
}

export interface UsuarioResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  rol: RolUsuario;
  activo: boolean;
  debeCambiarPassword?: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  debeCambiarPassword?: boolean;
}

export type EstadoOperativoCamion = 'DISPONIBLE' | 'EN_TRANSITO' | 'INACTIVO';

export type FiltroFlota = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

export interface CamionFlotaResponse {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  capacidadKg: number | null;
  activo: boolean;
  estadoOperativo: EstadoOperativoCamion;
  createdAt: string;
}

export interface FlotaResumenResponse {
  total: number;
  activos: number;
  inactivos: number;
  disponibles: number;
  enTransito: number;
}

export interface PuntoPublico {
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface VehiculoPublico {
  patente: string;
  marca: string;
  modelo: string;
}

export interface ChoferPublico {
  nombre: string;
}

export interface UbicacionPublica {
  latitud: number;
  longitud: number;
  registradoEn: string;
}

export interface SeguimientoClienteResponse {
  codigoSeguimiento: string;
  estado: EstadoViaje;
  descripcionCarga: string | null;
  origen: PuntoPublico;
  destino: PuntoPublico;
  vehiculo: VehiculoPublico;
  chofer: ChoferPublico;
  ubicacionActual: UbicacionPublica | null;
  salidaProgramada: string | null;
  salidaReal: string | null;
  llegadaEstimada: string | null;
  llegadaReal: string | null;
}

export interface EnvioClienteResumenResponse {
  codigoSeguimiento: string;
  estado: EstadoViaje;
  descripcionCarga: string | null;
  origenNombre: string;
  destinoNombre: string;
  salidaProgramada: string | null;
  llegadaEstimada: string | null;
}

export interface UbicacionSeguimientoResponse {
  codigoSeguimiento: string;
  estado: EstadoViaje;
  latitud: number;
  longitud: number;
  velocidadKmh: number | null;
  rumboGrados: number | null;
  registradoEn: string;
}

export interface VehiculoChoferResponse {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  capacidadKg: number | null;
}

export interface PuntoRuta {
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface PosicionChoferResponse {
  latitud: number;
  longitud: number;
  velocidadKmh: number | null;
  rumboGrados: number | null;
  registradoEn: string;
}

export interface CoordenadaChoferResponse {
  latitud: number;
  longitud: number;
  registradoEn: string;
}

export interface RutaChoferResponse {
  viajeId: number;
  codigoSeguimiento: string;
  estado: EstadoViaje;
  vehiculo: VehiculoChoferResponse;
  origen: PuntoRuta;
  destino: PuntoRuta;
  descripcionCarga: string | null;
  salidaProgramada: string | null;
  salidaReal: string | null;
  llegadaEstimada: string | null;
  ultimaUbicacion: PosicionChoferResponse | null;
  recorrido: CoordenadaChoferResponse[];
}

export interface ViajeChoferResumenResponse {
  viajeId: number;
  codigoSeguimiento: string;
  estado: EstadoViaje;
  patenteCamion: string;
  modeloCamion: string;
  origenNombre: string;
  destinoNombre: string;
  salidaProgramada: string | null;
  llegadaEstimada: string | null;
}

export interface CrearChoferRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

export interface AsignarViajeAdminRequest {
  camionId: number;
  choferId: number;
  clienteId?: number | null;
  origenNombre: string;
  origenLat: number;
  origenLon: number;
  destinoNombre: string;
  destinoLat: number;
  destinoLon: number;
  descripcionCarga?: string | null;
  codigoSeguimiento?: string | null;
  iniciarInmediatamente: boolean;
}

export interface ViajeMonitoreoAdminResponse {
  viajeId: number;
  codigoSeguimiento: string;
  estado: EstadoViaje;
  choferId: number | null;
  choferNombre: string;
  choferEmail: string;
  camionId: number | null;
  camionPatente: string;
  camionModelo: string;
  origenNombre: string;
  destinoNombre: string;
  descripcionCarga: string | null;
  salidaProgramada: string | null;
  salidaReal: string | null;
  latitudActual: number;
  longitudActual: number;
  velocidadKmh: number;
  rumboGrados: number;
  ultimaActualizacion: string;
}

export interface CrearClienteRequest {
  nombre: string;
  apellido: string;
  email: string;
  passwordProvisoria: string;
}

export interface CrearCamionRequest {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidadKg: number;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  nuevaPassword: string;
}

