import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, StatusColors } from '@/constants/theme';
import { useUbicacionesActivas } from '@/hooks/use-ubicaciones-activas';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Componente MapaFlota para entorno Web.
 */
export function MapaFlota() {
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');

  const { ubicaciones, cargando, actualizando, hayError, reintentar } =
    useUbicacionesActivas({ intervaloMs: 5000 });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Barra superior */}
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

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Aviso informativo de versión móvil */}
          <View style={[styles.bannerInfo, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialIcons name="phone-iphone" size={28} color={tint} />
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="defaultSemiBold">Vista Satelital en Expo Go</ThemedText>
              <ThemedText style={[styles.bannerTexto, { color: textSecondary }]}>
                Para ver el mapa interactivo nativo (Apple Maps / Google Maps) con la traza Polyline y rotación de camiones, escaneá el QR con tu celular.
              </ThemedText>
            </View>
          </View>

          {/* Listado de camiones en vivo */}
          <ThemedText type="subtitle" style={styles.seccionTitulo}>
            Flota en Ruta ({ubicaciones.length})
          </ThemedText>

          {ubicaciones.map((u) => (
            <View
              key={u.viajeId}
              style={[styles.tarjetaCamion, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.tarjetaCabecera}>
                <View style={styles.tarjetaIcono}>
                  <MaterialIcons name="local-shipping" size={22} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                    {u.patente}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, color: textSecondary }}>
                    Hacia {u.destinoNombre}
                  </ThemedText>
                </View>
                <View style={styles.badgeEstado}>
                  <ThemedText style={styles.badgeTexto}>
                    {u.posicion.velocidadKmh?.toFixed(0) ?? 0} km/h
                  </ThemedText>
                </View>
              </View>

              <View style={styles.coordenadasFila}>
                <ThemedText style={[styles.coordTexto, { color: textSecondary }]}>
                  Lat: {u.posicion.latitud.toFixed(4)} | Lon: {u.posicion.longitud.toFixed(4)}
                </ThemedText>
                {u.posicion.rumboGrados != null && (
                  <ThemedText style={[styles.coordTexto, { color: textSecondary }]}>
                    Rumbo: {u.posicion.rumboGrados.toFixed(0)}°
                  </ThemedText>
                )}
              </View>
            </View>
          ))}

          {!cargando && !hayError && ubicaciones.length === 0 && (
            <View style={[styles.alertaVacia, { backgroundColor: cardBg, borderColor: border }]}>
              <MaterialIcons name="local-shipping" size={24} color={textSecondary} />
              <ThemedText style={{ color: textSecondary, textAlign: 'center' }}>
                No hay viajes en curso en este momento.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
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
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerTexto: {
    fontSize: 12,
    lineHeight: 18,
  },
  seccionTitulo: {
    marginTop: Spacing.two,
  },
  tarjetaCamion: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
  },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tarjetaIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEstado: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTexto: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  coordenadasFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  coordTexto: {
    fontSize: 12,
  },
  alertaVacia: {
    padding: Spacing.four,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
