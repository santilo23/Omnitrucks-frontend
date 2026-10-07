import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { MarcadorCamion } from '@/components/marcador-camion';
import { MarcadorParada } from '@/components/marcador-parada';
import { TarjetaDetalleViaje } from '@/components/tarjeta-detalle-viaje';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, StatusColors } from '@/constants/theme';
import { useUbicacionesActivas } from '@/hooks/use-ubicaciones-activas';
import { useRecorrido } from '@/hooks/use-recorrido';
import { useDetalleViaje } from '@/hooks/use-detalle-viaje';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Región inicial centrada en el centro de Argentina (Buenos Aires / Santa Fe / Córdoba) */
const REGION_INICIAL = {
  latitude: -33.8,
  longitude: -60.5,
  latitudeDelta: 6.0,
  longitudeDelta: 6.0,
};

export function MapaFlota() {
  const mapRef = useRef<MapView>(null);
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');

  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState<number | null>(null);

  const { ubicaciones, cargando, actualizando, hayError, reintentar } =
    useUbicacionesActivas({ intervaloMs: 5000 });

  const ubicacionSeleccionada = ubicaciones.find(
    (u) => u.viajeId === viajeSeleccionadoId
  );

  const { coordenadas: trazaCoordenadas, posiciones: listaPosiciones } = useRecorrido({
    viajeId: viajeSeleccionadoId,
    intervaloMs: 5000,
  });

  const { viaje: detalleViaje } = useDetalleViaje(viajeSeleccionadoId);

  const hasFittedInitial = useRef(false);

  useEffect(() => {
    if (
      !hasFittedInitial.current &&
      !viajeSeleccionadoId &&
      ubicaciones.length > 0 &&
      mapRef.current
    ) {
      hasFittedInitial.current = true;
      const coords = ubicaciones.map((u) => ({
        latitude: u.posicion.latitud,
        longitude: u.posicion.longitud,
      }));

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 90, right: 60, bottom: 90, left: 60 },
        animated: true,
      });
    }
  }, [ubicaciones, viajeSeleccionadoId]);

  const centrarEnCamion = useCallback(() => {
    if (ubicacionSeleccionada && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: ubicacionSeleccionada.posicion.latitud,
          longitude: ubicacionSeleccionada.posicion.longitud,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        },
        700
      );
    }
  }, [ubicacionSeleccionada]);

  const seleccionarCamion = useCallback((viajeId: number) => {
    setViajeSeleccionadoId(viajeId);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={REGION_INICIAL}
        showsUserLocation
        showsMyLocationButton
        showsCompass>
        {/* Trazado (Polyline) del viaje seleccionado */}
        {viajeSeleccionadoId != null && trazaCoordenadas.length > 1 && (
          <Polyline
            coordinates={trazaCoordenadas}
            strokeColor="#0284C7"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marcadores de origen y destino del viaje seleccionado */}
        {detalleViaje && (
          <>
            <MarcadorParada punto={detalleViaje.origen} tipo="origen" />
            <MarcadorParada punto={detalleViaje.destino} tipo="destino" />
          </>
        )}

        {/* Marcadores de todos los camiones activos */}
        {ubicaciones.map((ubicacion) => (
          <MarcadorCamion
            key={ubicacion.viajeId}
            ubicacion={ubicacion}
            onPress={() => seleccionarCamion(ubicacion.viajeId)}
          />
        ))}
      </MapView>

      {/* Barra superior flotante con estado de la flota */}
      <SafeAreaView style={styles.overlayTop} edges={['top']}>
        <View style={[styles.barraSuperior, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.infoFlota}>
            <View
              style={[
                styles.indicadorEnVivo,
                { backgroundColor: hayError ? StatusColors.error : StatusColors.ok },
              ]}
            />
            <View>
              <ThemedText type="defaultSemiBold" style={styles.tituloFlota}>
                {hayError
                  ? 'Sin conexión'
                  : cargando
                  ? 'Conectando…'
                  : `${ubicaciones.length} ${
                      ubicaciones.length === 1 ? 'camión activo' : 'camiones activos'
                    }`}
              </ThemedText>
              <ThemedText style={[styles.subtituloFlota, { color: textSecondary }]}>
                {actualizando ? 'Actualizando posición…' : 'En vivo (cada 5s)'}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => reintentar()}
            disabled={actualizando}
            accessibilityLabel="Refrescar flota"
            style={({ pressed }) => [
              styles.botonRefrescar,
              { borderColor: border },
              pressed && styles.botonPresionado,
            ]}>
            {actualizando ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <MaterialIcons name="refresh" size={20} color={tint} />
            )}
          </Pressable>
        </View>

        {!cargando && !hayError && ubicaciones.length === 0 && (
          <View style={[styles.alertaVacia, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialIcons name="local-shipping" size={22} color={textSecondary} />
            <ThemedText style={[styles.textoVacio, { color: textSecondary }]}>
              No hay viajes en curso en este momento.
            </ThemedText>
          </View>
        )}

        {hayError && (
          <View style={[styles.alertaError, { borderColor: border }]}>
            <MaterialIcons name="error-outline" size={20} color={StatusColors.error} />
            <ThemedText style={styles.textoError}>
              No se pudo conectar al backend. Verificá que esté levantado.
            </ThemedText>
          </View>
        )}
      </SafeAreaView>

      {/* Tarjeta flotante inferior con detalle del viaje seleccionado */}
      {ubicacionSeleccionada && (
        <SafeAreaView style={styles.overlayBottom} edges={['bottom']}>
          <TarjetaDetalleViaje
            ubicacion={ubicacionSeleccionada}
            viaje={detalleViaje}
            puntosRecorridos={listaPosiciones.length}
            onCerrar={() => setViajeSeleccionadoId(null)}
            onCentrar={centrarEnCamion}
          />
        </SafeAreaView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoFlota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  indicadorEnVivo: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tituloFlota: {
    fontSize: 14,
  },
  subtituloFlota: {
    fontSize: 11,
  },
  botonRefrescar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  alertaVacia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textoVacio: {
    fontSize: 12,
    flex: 1,
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
  },
  textoError: {
    fontSize: 12,
    color: StatusColors.error,
    flex: 1,
  },
});
