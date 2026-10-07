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
