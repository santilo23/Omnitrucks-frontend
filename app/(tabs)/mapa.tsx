import React, { useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { MarcadorCamion } from '@/components/marcador-camion';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, StatusColors } from '@/constants/theme';
import { useUbicacionesActivas } from '@/hooks/use-ubicaciones-activas';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Región inicial centrada en el centro de Argentina (Buenos Aires / Santa Fe / Córdoba) */
const REGION_INICIAL = {
  latitude: -33.8,
  longitude: -60.5,
  latitudeDelta: 6.0,
  longitudeDelta: 6.0,
};

export default function MapaScreen() {
  const mapRef = useRef<MapView>(null);
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');

  const { ubicaciones, cargando, actualizando, hayError, reintentar } =
    useUbicacionesActivas({ intervaloMs: 5000 });

  const hasFittedInitial = useRef(false);

  // Ajustar cámara para encuadrar todos los camiones activos al cargar por primera vez
  useEffect(() => {
    if (!hasFittedInitial.current && ubicaciones.length > 0 && mapRef.current && Platform.OS !== 'web') {
      hasFittedInitial.current = true;
      const coordenadas = ubicaciones.map((u) => ({
        latitude: u.posicion.latitud,
        longitude: u.posicion.longitud,
      }));

      mapRef.current.fitToCoordinates(coordenadas, {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }
  }, [ubicaciones]);

  return (
    <ThemedView style={styles.container}>
      {/* Mapa interactivo nativo (iOS / Android) */}
      {Platform.OS !== 'web' ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={REGION_INICIAL}
          showsUserLocation
          showsMyLocationButton
          showsCompass>
          {ubicaciones.map((ubicacion) => (
            <MarcadorCamion
              key={ubicacion.viajeId}
              ubicacion={ubicacion}
            />
          ))}
        </MapView>
      ) : (
        /* Fallback web si se abre en navegador */
        <View style={styles.webFallback}>
          <MaterialIcons name="map" size={48} color={tint} />
          <ThemedText type="subtitle" style={styles.webTitulo}>
            Vista de mapa nativa
          </ThemedText>
          <ThemedText style={[styles.webDescripcion, { color: textSecondary }]}>
            Los mapas de react-native-maps se visualizan en la app móvil en tu iPhone / Android con Expo Go.
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.two }}>
            {ubicaciones.length} camiones activos reportando coordenadas.
          </ThemedText>
        </View>
      )}

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

        {/* Alerta flotante cuando no hay viajes activos */}
        {!cargando && !hayError && ubicaciones.length === 0 && (
          <View style={[styles.alertaVacia, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialIcons name="local-shipping" size={22} color={textSecondary} />
            <ThemedText style={[styles.textoVacio, { color: textSecondary }]}>
              No hay viajes en curso en este momento.
            </ThemedText>
          </View>
        )}

        {/* Alerta de error */}
        {hayError && (
          <View style={[styles.alertaError, { borderColor: border }]}>
            <MaterialIcons name="error-outline" size={20} color={StatusColors.error} />
            <ThemedText style={styles.textoError}>
              No se pudo conectar al backend. Verificá que esté levantado.
            </ThemedText>
          </View>
        )}
      </SafeAreaView>
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
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  webTitulo: {
    marginTop: Spacing.two,
  },
  webDescripcion: {
    textAlign: 'center',
    maxWidth: 320,
    fontSize: 13,
  },
});
