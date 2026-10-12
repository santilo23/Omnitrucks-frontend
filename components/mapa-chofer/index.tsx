import React, { useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { MarcadorParada } from '@/components/marcador-parada';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, StatusColors } from '@/constants/theme';
import { useRutaChofer } from '@/hooks/use-ruta-chofer';
import { useThemeColor } from '@/hooks/use-theme-color';

const REGION_DEFAULT = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

interface MapaChoferProps {
  viajeId?: number | null;
}

/**
 * Componente nativo de mapa exclusivo para el rol CHOFER.
 * REGLA ESTRICTA: Renderiza únicamente el camión propio asignado, su ruta y destino final.
 * Ningún otro camión o ruta de terceros es consultado ni visualizado.
 */
export function MapaChofer({ viajeId }: MapaChoferProps) {
  const mapRef = useRef<MapView>(null);
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');

  const { ruta, coordenadasTraza, cargando, actualizando, error, refetch } =
    useRutaChofer({ viajeId, intervaloMs: 5000 });

  const hasFittedInitial = useRef(false);

  // Auto-ajustar la cámara a la ruta del chofer (origen, destino y camión)
  useEffect(() => {
    if (!hasFittedInitial.current && ruta && mapRef.current) {
      const puntos: { latitude: number; longitude: number }[] = [
        { latitude: ruta.origen.latitud, longitude: ruta.origen.longitud },
        { latitude: ruta.destino.latitud, longitude: ruta.destino.longitud },
      ];
      if (ruta.ultimaUbicacion) {
        puntos.push({
          latitude: ruta.ultimaUbicacion.latitud,
          longitude: ruta.ultimaUbicacion.longitud,
        });
      }

      hasFittedInitial.current = true;
      mapRef.current.fitToCoordinates(puntos, {
        edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
    }
  }, [ruta]);

  const centrarEnMiCamion = useCallback(() => {
    if (ruta?.ultimaUbicacion && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: ruta.ultimaUbicacion.latitud,
          longitude: ruta.ultimaUbicacion.longitud,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        700
      );
    }
  }, [ruta?.ultimaUbicacion]);

  const rotation = ruta?.ultimaUbicacion?.rumboGrados ?? 0;

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={REGION_DEFAULT}
        showsUserLocation
        showsMyLocationButton
        showsCompass>
        {/* Traza recorrida por el camión del chofer */}
        {coordenadasTraza.length > 1 && (
          <Polyline
            coordinates={coordenadasTraza}
            strokeColor="#059669"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Origen y Destino asignados */}
        {ruta && (
          <>
            <MarcadorParada
              punto={{
                nombre: ruta.origen.nombre,
                latitud: ruta.origen.latitud,
                longitud: ruta.origen.longitud,
              }}
              tipo="origen"
            />
            <MarcadorParada
              punto={{
                nombre: ruta.destino.nombre,
                latitud: ruta.destino.latitud,
                longitud: ruta.destino.longitud,
              }}
              tipo="destino"
            />
          </>
        )}

        {/* Marcador del propio camión en vivo */}
        {ruta?.ultimaUbicacion && (
          <Marker
            coordinate={{
              latitude: ruta.ultimaUbicacion.latitud,
              longitude: ruta.ultimaUbicacion.longitud,
            }}
            title={`Mi Camión: ${ruta.vehiculo.patente}`}
            description={`${ruta.vehiculo.marca} ${ruta.vehiculo.modelo} | ${
              ruta.ultimaUbicacion.velocidadKmh != null
                ? `${Math.round(ruta.ultimaUbicacion.velocidadKmh)} km/h`
                : 'En posición'
            }`}
            anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.marcadorContenedor}>
              <View style={[styles.marcadorBadge, { backgroundColor: StatusColors.ok }]}>
                <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
                  <MaterialIcons name="navigation" size={20} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.marcadorEtiqueta}>
                <ThemedText style={styles.marcadorPatente}>{ruta.vehiculo.patente}</ThemedText>
              </View>
            </View>

            <Callout tooltip style={styles.calloutContainer}>
              <View style={styles.calloutContent}>
                <ThemedText type="defaultSemiBold" style={styles.calloutTitulo}>
                  Mi Vehículo: {ruta.vehiculo.patente}
                </ThemedText>
                <ThemedText style={styles.calloutSubtitulo}>
                  Destino: {ruta.destino.nombre}
                </ThemedText>
                {ruta.ultimaUbicacion.velocidadKmh != null && (
                  <ThemedText style={styles.calloutVelocidad}>
                    {Math.round(ruta.ultimaUbicacion.velocidadKmh)} km/h
                  </ThemedText>
                )}
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Barra superior con estado de la ruta del chofer */}
      <SafeAreaView style={styles.overlayTop} edges={['top']}>
        <View style={[styles.barraSuperior, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.infoRuta}>
            <View
              style={[
                styles.indicadorEnVivo,
                { backgroundColor: error ? StatusColors.error : StatusColors.ok },
              ]}
            />
            <View>
              <ThemedText type="defaultSemiBold" style={styles.tituloRuta}>
                {error
                  ? 'Sin conexión'
                  : cargando
                  ? 'Cargando ruta…'
                  : ruta
                  ? `Mi Camión: ${ruta.vehiculo.patente}`
                  : 'Sin viaje asignado'}
              </ThemedText>
              <ThemedText style={[styles.subtituloRuta, { color: textSecondary }]}>
                {ruta
                  ? `Destino: ${ruta.destino.nombre}`
                  : 'No tienes viajes activos'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.botonesAccion}>
            {ruta?.ultimaUbicacion && (
              <Pressable
                onPress={centrarEnMiCamion}
                accessibilityLabel="Centrar en mi camión"
                style={({ pressed }) => [
                  styles.botonIcono,
                  { borderColor: border },
                  pressed && styles.botonPresionado,
                ]}>
                <MaterialIcons name="my-location" size={20} color={tint} />
              </Pressable>
            )}

            <Pressable
              onPress={() => refetch()}
              disabled={actualizando}
              accessibilityLabel="Refrescar ruta"
              style={({ pressed }) => [
                styles.botonIcono,
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
        </View>

        {!cargando && !error && !ruta && (
          <View style={[styles.alertaVacia, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialIcons name="info-outline" size={22} color={textSecondary} />
            <ThemedText style={[styles.textoVacio, { color: textSecondary }]}>
              No tenés ningún viaje activo asignado en este momento.
            </ThemedText>
          </View>
        )}
      </SafeAreaView>

      {/* Tarjeta flotante inferior con resumen del viaje propio */}
      {ruta && (
        <SafeAreaView style={styles.overlayBottom} edges={['bottom']}>
          <View style={[styles.tarjetaInferior, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.cabeceraInferior}>
              <View>
                <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                  DESTINO ASIGNADO
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                  {ruta.destino.nombre}
                </ThemedText>
              </View>
              <View style={[styles.badgeEstado, { backgroundColor: '#05966922' }]}>
                <ThemedText style={[styles.badgeEstadoTexto, { color: '#059669' }]}>
                  {ruta.estado}
                </ThemedText>
              </View>
            </View>

            <View style={styles.filaVehiculo}>
              <MaterialIcons name="local-shipping" size={18} color={tint} />
              <ThemedText style={{ fontSize: 13 }}>
                {ruta.vehiculo.marca} {ruta.vehiculo.modelo} ({ruta.vehiculo.patente})
              </ThemedText>
              {ruta.descripcionCarga && (
                <ThemedText style={{ fontSize: 13, color: textSecondary }}>
                  • {ruta.descripcionCarga}
                </ThemedText>
              )}
            </View>
          </View>
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
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  infoRuta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  indicadorEnVivo: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tituloRuta: {
    fontSize: 14,
  },
  subtituloRuta: {
    fontSize: 12,
  },
  botonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  botonIcono: {
    padding: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  alertaVacia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textoVacio: {
    fontSize: 13,
    flex: 1,
  },
  marcadorContenedor: {
    alignItems: 'center',
  },
  marcadorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  marcadorEtiqueta: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
  },
  marcadorPatente: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  calloutContainer: {
    width: 180,
  },
  calloutContent: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
  },
  calloutTitulo: {
    fontSize: 12,
    color: '#0F172A',
  },
  calloutSubtitulo: {
    fontSize: 11,
    color: '#64748B',
  },
  calloutVelocidad: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  tarjetaInferior: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cabeceraInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labelPequeno: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeEstadoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  filaVehiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
