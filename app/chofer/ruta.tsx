import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  obtenerMisViajesChofer,
  obtenerRutaActivaChofer,
  obtenerRutaPorViajeId,
} from '@/api/chofer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, StatusColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { EstadoViaje, ViajeChoferResumenResponse } from '@/types';

export default function ChoferRutaScreen() {
  const router = useRouter();
  const { usuario, isLoading: isAuthLoading } = useAuth();

  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState<number | null>(null);

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  // Consulta de la lista de todos los viajes asignados a este chofer
  const {
    data: misViajes = [],
    isLoading: isViajesLoading,
    isRefetching: isViajesRefetching,
    refetch: refetchMisViajes,
  } = useQuery({
    queryKey: ['chofer-mis-viajes'],
    queryFn: obtenerMisViajesChofer,
    enabled: !!usuario && (usuario.rol === 'CHOFER' || usuario.rol === 'ADMIN'),
  });

  // Consulta de la ruta (activa o seleccionada)
  const {
    data: ruta,
    isLoading: isRutaLoading,
    isRefetching: isRutaRefetching,
    refetch: refetchRuta,
  } = useQuery({
    queryKey: ['chofer-ruta-detalle', viajeSeleccionadoId ?? 'activa'],
    queryFn: () => {
      if (viajeSeleccionadoId != null) {
        return obtenerRutaPorViajeId(viajeSeleccionadoId);
      }
      return obtenerRutaActivaChofer();
    },
    enabled: !!usuario && (usuario.rol === 'CHOFER' || usuario.rol === 'ADMIN'),
    refetchInterval: 5000,
  });

  const onRefrescar = async () => {
    await Promise.all([refetchMisViajes(), refetchRuta()]);
  };

  if (isAuthLoading) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // Guardia RBAC: Restringido a Choferes (y Administradores para soporte operativo)
  if (!usuario || (usuario.rol !== 'CHOFER' && usuario.rol !== 'ADMIN')) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <View style={[styles.tarjetaAlerta, { backgroundColor: card, borderColor: border }]}>
          <MaterialIcons name="lock" size={36} color="#DC2626" style={{ alignSelf: 'center' }} />
          <ThemedText type="subtitle" style={styles.textoCentro}>
            Acceso Exclusivo para Choferes
          </ThemedText>
          <ThemedText style={[styles.descripcion, { color: textSecondary }]}>
            Esta sección contiene la hoja de ruta y telemetría operativa asignada al conductor.
          </ThemedText>
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={({ pressed }) => [
              styles.botonRegresar,
              { backgroundColor: tint },
              pressed && styles.botonPresionado,
            ]}>
            <ThemedText style={{ color: background, fontWeight: '600' }}>
              Volver al inicio
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const renderBadgeEstado = (estado: EstadoViaje) => {
    let color: string = StatusColors.ok;
    let bg = '#05966922';

    if (estado === 'PROGRAMADO') {
      color = '#0284c7';
      bg = '#0284c722';
    } else if (estado === 'PAUSADO') {
      color = '#d97706';
      bg = '#d9770622';
    } else if (estado === 'FINALIZADO') {
      color = '#64748b';
      bg = '#64748b22';
    } else if (estado === 'CANCELADO') {
      color = '#dc2626';
      bg = '#dc262622';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <ThemedText style={[styles.badgeTexto, { color }]}>{estado}</ThemedText>
      </View>
    );
  };

  const renderItemViaje = ({ item }: { item: ViajeChoferResumenResponse }) => {
    const seleccionado =
      (viajeSeleccionadoId === null && item.estado === 'EN_CURSO') ||
      viajeSeleccionadoId === item.viajeId;

    return (
      <Pressable
        onPress={() => setViajeSeleccionadoId(item.viajeId)}
        style={({ pressed }) => [
          styles.itemViaje,
          { backgroundColor: card, borderColor: seleccionado ? '#059669' : border },
          seleccionado && { borderWidth: 2 },
          pressed && styles.botonPresionado,
        ]}>
        <View style={styles.filaItemHeader}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
            {item.patenteCamion}
          </ThemedText>
          {renderBadgeEstado(item.estado)}
        </View>

        <ThemedText style={{ fontSize: 12, marginTop: 2 }}>
          {item.origenNombre} → {item.destinoNombre}
        </ThemedText>

        <ThemedText style={[styles.labelCodigo, { color: textSecondary }]}>
          Código: {item.codigoSeguimiento}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isViajesRefetching || isRutaRefetching}
            onRefresh={onRefrescar}
            tintColor={tint}
          />
        }>
        {/* Cabecera del Conductor */}
        <View style={[styles.tarjetaChofer, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.avatarChofer}>
            <MaterialIcons name="person" size={28} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{usuario.nombreCompleto}</ThemedText>
            <ThemedText style={{ color: textSecondary, fontSize: 13 }}>{usuario.email}</ThemedText>
            <ThemedText style={{ color: '#059669', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
              ROL: CONDUCTOR PROFESIONAL
            </ThemedText>
          </View>
        </View>

        {/* Historial o lista de viajes asignados al chofer */}
        <View style={styles.seccion}>
          <View style={styles.filaSeccionTitulo}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
              Mis Viajes Asignados ({misViajes.length})
            </ThemedText>
            {viajeSeleccionadoId !== null && (
              <Pressable onPress={() => setViajeSeleccionadoId(null)}>
                <ThemedText style={{ color: '#059669', fontSize: 12, fontWeight: '600' }}>
                  Ver Viaje Activo
                </ThemedText>
              </Pressable>
            )}
          </View>

          {isViajesLoading ? (
            <ActivityIndicator size="small" color={tint} style={{ marginVertical: Spacing.two }} />
          ) : misViajes.length === 0 ? (
            <View style={[styles.tarjetaVacia, { backgroundColor: card, borderColor: border }]}>
              <ThemedText style={{ color: textSecondary, textAlign: 'center' }}>
                No tienes viajes registrados en la plataforma.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              horizontal
              data={misViajes}
              keyExtractor={(item) => item.viajeId.toString()}
              renderItem={renderItemViaje}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaHorizontal}
            />
          )}
        </View>

        {/* Detalle de la Ruta Asignada */}
        {isRutaLoading ? (
          <ActivityIndicator size="large" color={tint} style={{ marginVertical: Spacing.four }} />
        ) : !ruta ? (
          <View style={[styles.tarjetaVacia, { backgroundColor: card, borderColor: border }]}>
            <MaterialIcons name="local-shipping" size={36} color={textSecondary} />
            <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
              Sin viaje activo asignado
            </ThemedText>
            <ThemedText style={{ color: textSecondary, textAlign: 'center', fontSize: 13 }}>
              No tenés ningún viaje en curso en este momento. Seleccioná un viaje del listado superior o contactá a operaciones.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.contenedorDetalle}>
            {/* Tarjeta del Camión Asignado */}
            <View style={[styles.tarjetaDetalle, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.filaCabeceraDetalle}>
                <View>
                  <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                    VEHÍCULO ASIGNADO
                  </ThemedText>
                  <ThemedText type="title" style={{ fontSize: 22 }}>
                    {ruta.vehiculo.patente}
                  </ThemedText>
                  <ThemedText style={{ color: textSecondary, fontSize: 14 }}>
                    {ruta.vehiculo.marca} {ruta.vehiculo.modelo}
                    {ruta.vehiculo.anio ? ` • Año ${ruta.vehiculo.anio}` : ''}
                  </ThemedText>
                </View>
                {renderBadgeEstado(ruta.estado)}
              </View>

              {ruta.descripcionCarga && (
                <View style={[styles.cajaItem, { backgroundColor: background, borderColor: border }]}>
                  <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                    DESCRIPCIÓN DE LA CARGA
                  </ThemedText>
                  <ThemedText style={{ fontSize: 14 }}>{ruta.descripcionCarga}</ThemedText>
                </View>
              )}

              <View style={styles.filaMetadatos}>
                <View style={styles.columnaMetadato}>
                  <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                    CÓDIGO DE SEGUIMIENTO
                  </ThemedText>
                  <ThemedText style={{ fontWeight: '600', fontSize: 13 }}>
                    {ruta.codigoSeguimiento}
                  </ThemedText>
                </View>
                {ruta.vehiculo.capacidadKg != null && (
                  <View style={styles.columnaMetadato}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      CAPACIDAD DE CARGA
                    </ThemedText>
                    <ThemedText style={{ fontWeight: '600', fontSize: 13 }}>
                      {ruta.vehiculo.capacidadKg} kg
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Itinerario */}
              <View style={[styles.cajaItinerario, { backgroundColor: background, borderColor: border }]}>
                <View style={styles.puntoRuta}>
                  <MaterialIcons name="radio-button-checked" size={16} color="#15803d" />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      ORIGEN
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">{ruta.origen.nombre}</ThemedText>
                  </View>
                </View>

                <View style={styles.lineaConectora} />

                <View style={styles.puntoRuta}>
                  <MaterialIcons name="location-on" size={18} color="#ef4444" />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      DESTINO FINAL
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">{ruta.destino.nombre}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Telemetría y posición en vivo */}
              <View style={[styles.cajaTelemetria, { borderColor: border }]}>
                <View style={styles.filaTelemetriaTitulo}>
                  <View style={styles.puntoEnVivo} />
                  <ThemedText type="defaultSemiBold">Telemetría de Ruta en Vivo</ThemedText>
                </View>

                {ruta.ultimaUbicacion ? (
                  <View style={styles.filaDatosTelemetria}>
                    <View style={styles.datoCol}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        VELOCIDAD
                      </ThemedText>
                      <ThemedText type="title" style={{ color: '#059669', fontSize: 20 }}>
                        {ruta.ultimaUbicacion.velocidadKmh != null
                          ? `${Math.round(ruta.ultimaUbicacion.velocidadKmh)} km/h`
                          : '0 km/h'}
                      </ThemedText>
                    </View>

                    <View style={styles.datoCol}>
                      <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                        PUNTOS REGISTRADOS
                      </ThemedText>
                      <ThemedText type="title" style={{ fontSize: 20 }}>
                        {ruta.recorrido?.length ?? 0}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
                    El vehículo aún no ha registrado posiciones en la ruta.
                  </ThemedText>
                )}
              </View>

              {/* Botón de acceso directo al Mapa */}
              <Pressable
                onPress={() => router.push('/(tabs)/mapa')}
                style={({ pressed }) => [
                  styles.botonMapa,
                  { backgroundColor: '#059669' },
                  pressed && styles.botonPresionado,
                ]}>
                <MaterialIcons name="map" size={20} color="#FFFFFF" />
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                  Ver en Mapa Interactivo
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  tarjetaChofer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarChofer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#05966922',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seccion: {
    gap: Spacing.two,
  },
  filaSeccionTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listaHorizontal: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  itemViaje: {
    width: 220,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  filaItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCodigo: {
    fontSize: 10,
    marginTop: 4,
  },
  contenedorDetalle: {
    gap: Spacing.three,
  },
  tarjetaDetalle: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  filaCabeceraDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labelPequeno: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  cajaItem: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  filaMetadatos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  columnaMetadato: {
    flex: 1,
  },
  cajaItinerario: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  puntoRuta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lineaConectora: {
    width: 2,
    height: 16,
    backgroundColor: '#94A3B8',
    marginLeft: 7,
    marginVertical: 2,
  },
  cajaTelemetria: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  filaTelemetriaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  puntoEnVivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  filaDatosTelemetria: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  datoCol: {
    flex: 1,
  },
  botonMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  tarjetaVacia: {
    padding: Spacing.five,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  tarjetaAlerta: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.five,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: Spacing.three,
  },
  textoCentro: {
    textAlign: 'center',
  },
  descripcion: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  botonRegresar: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  botonPresionado: {
    opacity: 0.7,
  },
});
