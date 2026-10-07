import React from 'react';
import { MapaFlota } from '@/components/mapa-flota/index';

/**
 * Pantalla de mapa de OmniTrucks.
 * Delega en MapaFlota (con implementación nativa en móvil y fallback limpio en web).
 */
export default function MapaScreen() {
  return <MapaFlota />;
}
