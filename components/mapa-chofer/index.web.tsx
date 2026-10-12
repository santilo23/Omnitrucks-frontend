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
import { useRutaChofer } from '@/hooks/use-ruta-chofer';
import { useThemeColor } from '@/hooks/use-theme-color';

interface MapaChoferProps {
  viajeId?: number | null;
}

/**
 * Componente MapaChofer para entorno Web.
 * Muestra la información en tiempo real, destino final y telemetría del camión asignado al chofer.
 */
export function MapaChofer({ viajeId }: MapaChoferProps) {
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  const { ruta, cargando, actualizando, error, refetch } = useRutaChofer({
    viajeId,
    intervaloMs: 5000,
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Barra superior con estado en vivo */}
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

          <Pressable
            onPress={() => refetch()}
            disabled={actualizando}
            accessibilityLabel="Refrescar ruta"
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
          {/* Banner informativo de Expo Go / satelital */}
          <View style={[styles.bannerInfo, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialIcons name="navigation" size={28} color="#059669" />
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="defaultSemiBold">Vista Satelital en Dispositivo Móvil</ThemedText>
              <ThemedText style={[styles.bannerTexto, { color: textSecondary }]}>
                Para visualizar la traza Polyline en mapa nativo y giro en tiempo real con brújula, abrí la app en Expo Go.
              </ThemedText>
            </View>
          </View>

          {cargando && !ruta ? (
            <ActivityIndicator size="large" color={tint} style={{ marginTop: Spacing.four }} />
          ) : !ruta ? (
            <View style={[styles.tarjetaVacia, { backgroundColor: cardBg, borderColor: border }]}>
              <MaterialIcons name="local-shipping" size={40} color={textSecondary} />
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                No tienes ningún viaje activo asignado
              </ThemedText>
              <ThemedText style={{ color: textSecondary, textAlign: 'center', fontSize: 13 }}>
                Cuando el administrador programe una nueva ruta para tu usuario, aparecerá automáticamente aquí.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contenidoViaje}>
              {/* Tarjeta de Vehículo Asignado */}
              <View style={[styles.tarjeta, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.tarjetaHeader}>
                  <View style={styles.vehiculoIcono}>
                    <MaterialIcons name="local-shipping" size={24} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      VEHÍCULO ASIGNADO
                    </ThemedText>
                    <ThemedText type="title" style={{ fontSize: 20 }}>
                      {ruta.vehiculo.patente}
                    </ThemedText>
                    <ThemedText style={{ color: textSecondary, fontSize: 14 }}>
                      {ruta.vehiculo.marca} {ruta.vehiculo.modelo}
                      {ruta.vehiculo.anio ? ` (${ruta.vehiculo.anio})` : ''}
                    </ThemedText>
                  </View>
                  <View style={[styles.badgeEstado, { backgroundColor: '#05966922' }]}>
                    <ThemedText style={[styles.badgeEstadoTexto, { color: '#059669' }]}>
                      {ruta.estado}
                    </ThemedText>
                  </View>
                </View>

                {ruta.descripcionCarga && (
                  <View style={[styles.cajaCarga, { backgroundColor: background, borderColor: border }]}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      CARGA
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14 }}>{ruta.descripcionCarga}</ThemedText>
                  </View>
                )}
              </View>

              {/* Itinerario: Origen -> Destino Final */}
              <View style={[styles.tarjeta, { backgroundColor: cardBg, borderColor: border }]}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 15, marginBottom: Spacing.two }}>
                  Itinerario Asignado
                </ThemedText>

                <View style={styles.itinerarioContenedor}>
                  <View style={styles.itinerarioPunto}>
                    <MaterialIcons name="radio-button-checked" size={18} color="#15803d" />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        ORIGEN
                      </ThemedText>
                      <ThemedText type="defaultSemiBold">{ruta.origen.nombre}</ThemedText>
                      <ThemedText style={[styles.coordsTexto, { color: textSecondary }]}>
                        {ruta.origen.latitud.toFixed(4)}, {ruta.origen.longitud.toFixed(4)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.lineaVerticalConectora} />

                  <View style={styles.itinerarioPunto}>
                    <MaterialIcons name="location-on" size={20} color="#ef4444" />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        DESTINO FINAL
                      </ThemedText>
                      <ThemedText type="defaultSemiBold">{ruta.destino.nombre}</ThemedText>
                      <ThemedText style={[styles.coordsTexto, { color: textSecondary }]}>
                        {ruta.destino.latitud.toFixed(4)}, {ruta.destino.longitud.toFixed(4)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Posición en Tiempo Real y Telemetría */}
              <View style={[styles.tarjeta, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.telemetriaHeader}>
                  <View style={styles.puntoVivoPulsante} />
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                    Posición en Vivo
                  </ThemedText>
                </View>

                {ruta.ultimaUbicacion ? (
                  <View style={styles.gridTelemetria}>
                    <View style={[styles.celdaTelemetria, { backgroundColor: background, borderColor: border }]}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        VELOCIDAD
                      </ThemedText>
                      <ThemedText type="title" style={{ color: '#059669', fontSize: 20 }}>
                        {ruta.ultimaUbicacion.velocidadKmh != null
                          ? `${Math.round(ruta.ultimaUbicacion.velocidadKmh)} km/h`
                          : '0 km/h'}
                      </ThemedText>
                    </View>

                    <View style={[styles.celdaTelemetria, { backgroundColor: background, borderColor: border }]}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        RUMBO
                      </ThemedText>
                      <ThemedText type="title" style={{ fontSize: 20 }}>
                        {ruta.ultimaUbicacion.rumboGrados != null
                          ? `${Math.round(ruta.ultimaUbicacion.rumboGrados)}°`
                          : '--'}
                      </ThemedText>
                    </View>

                    <View style={[styles.celdaTelemetriaAncha, { backgroundColor: background, borderColor: border }]}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        COORDENADAS GPS ACTUALES
                      </ThemedText>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'monospace' }}>
                        Lat: {ruta.ultimaUbicacion.latitud.toFixed(5)} | Lon:{' '}
                        {ruta.ultimaUbicacion.longitud.toFixed(5)}
                      </ThemedText>
                      <ThemedText style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>
                        Puntos de recorrido registrados: {ruta.recorrido?.length ?? 0}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
                    El vehículo todavía no ha registrado posiciones de telemetría.
                  </ThemedText>
                )}
              </View>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 15,
  },
  subtituloRuta: {
    fontSize: 12,
  },
  botonRefrescar: {
    padding: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerTexto: {
    fontSize: 12,
    lineHeight: 16,
  },
  tarjetaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  contenidoViaje: {
    gap: Spacing.three,
  },
  tarjeta: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  vehiculoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#05966922',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelPequeno: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeEstadoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  cajaCarga: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.one,
  },
  itinerarioContenedor: {
    gap: Spacing.one,
  },
  itinerarioPunto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  coordsTexto: {
    fontSize: 11,
    marginTop: 1,
  },
  lineaVerticalConectora: {
    width: 2,
    height: 16,
    backgroundColor: '#94A3B8',
    marginLeft: 8,
    marginVertical: 2,
  },
  telemetriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  puntoVivoPulsante: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  gridTelemetria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  celdaTelemetria: {
    flex: 1,
    minWidth: 120,
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  celdaTelemetriaAncha: {
    width: '100%',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
