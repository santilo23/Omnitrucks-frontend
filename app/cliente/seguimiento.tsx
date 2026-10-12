import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { isAxiosError } from 'axios';

import {
  obtenerMisEnvios,
  obtenerSeguimiento,
  obtenerUbicacionSeguimiento,
} from '@/api/cliente-seguimiento';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  EnvioClienteResumenResponse,
  EstadoViaje,
} from '@/types';

export default function ClienteSeguimientoScreen() {
  const router = useRouter();
  const { usuario, cambiarPassword, isLoading: isAuthLoading } = useAuth();

  const [codigoInput, setCodigoInput] = useState('');
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);

  // Estado para modal de cambio de contraseña
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargandoPassword, setCargandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [exitoPassword, setExitoPassword] = useState<string | null>(null);

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  // Consulta de la lista de envíos asignados al cliente
  const {
    data: misEnvios = [],
    isLoading: isEnviosLoading,
    isRefetching: isEnviosRefetching,
    refetch: refetchMisEnvios,
  } = useQuery({
    queryKey: ['cliente-mis-envios'],
    queryFn: obtenerMisEnvios,
    enabled: !!usuario && (usuario.rol === 'CLIENTE' || usuario.rol === 'ADMIN'),
  });

  // Consulta del detalle del envío por código de seguimiento
  const {
    data: detalleEnvio,
    isLoading: isDetalleLoading,
    isError: isDetalleError,
    error: detalleError,
    refetch: refetchDetalle,
  } = useQuery({
    queryKey: ['cliente-seguimiento', codigoBuscado],
    queryFn: () => (codigoBuscado ? obtenerSeguimiento(codigoBuscado) : Promise.reject()),
    enabled: !!codigoBuscado,
    retry: 1,
  });

  // Consulta periódica de ubicación en vivo si el envío está en tránsito
  const {
    data: ubicacionEnVivo,
    refetch: refetchUbicacion,
  } = useQuery({
    queryKey: ['cliente-ubicacion-vivo', codigoBuscado],
    queryFn: () => (codigoBuscado ? obtenerUbicacionSeguimiento(codigoBuscado) : Promise.reject()),
    enabled: !!codigoBuscado && detalleEnvio?.estado === 'EN_CURSO',
    refetchInterval: 6000,
  });

  const onBuscar = () => {
    const limpio = codigoInput.trim().toUpperCase();
    if (limpio) {
      setCodigoBuscado(limpio);
      // Tras buscar y potencialmente auto-vincular el viaje no asignado, refrescamos mis envíos
      setTimeout(() => {
        refetchMisEnvios();
      }, 1000);
    }
  };

  const onSeleccionarEnvio = (codigo: string) => {
    setCodigoInput(codigo);
    setCodigoBuscado(codigo);
  };

  const manejarCambioPasswordCliente = async () => {
    setErrorPassword(null);
    setExitoPassword(null);

    if (!passwordActual) {
      setErrorPassword('Ingresá tu contraseña actual / provisoria.');
      return;
    }
    if (!nuevaPassword || nuevaPassword.length < 6) {
      setErrorPassword('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las nuevas contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword === passwordActual) {
      setErrorPassword('La nueva contraseña no puede ser idéntica a la anterior.');
      return;
    }

    setCargandoPassword(true);
    try {
      await cambiarPassword(passwordActual, nuevaPassword);
      setExitoPassword('¡Contraseña actualizada con éxito!');
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setModalPasswordVisible(false), 1200);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorPassword('La contraseña actual es incorrecta.');
        } else {
          setErrorPassword(err.response?.data?.detail || 'Error al actualizar la contraseña.');
        }
      } else {
        setErrorPassword('Error inesperado al actualizar la contraseña.');
      }
    } finally {
      setCargandoPassword(false);
    }
  };

  if (isAuthLoading) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // Guardia RBAC: Restringido a clientes (y administradores)
  if (!usuario || (usuario.rol !== 'CLIENTE' && usuario.rol !== 'ADMIN')) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <View style={[styles.tarjetaAlerta, { backgroundColor: card, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.textoCentro}>
            Acceso Exclusivo para Clientes
          </ThemedText>
          <ThemedText style={[styles.descripcion, { color: textSecondary }]}>
            Esta sección está reservada para clientes que consultan sus envíos asignados.
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
    let bg = '#6b728022';
    let text = '#6b7280';
    let label: string = estado;

    if (estado === 'EN_CURSO') {
      bg = '#22c55e22';
      text = '#15803d';
      label = 'EN CURSO';
    } else if (estado === 'PROGRAMADO') {
      bg = '#eab30822';
      text = '#a16207';
      label = 'PROGRAMADO';
    } else if (estado === 'FINALIZADO') {
      bg = '#3b82f622';
      text = '#1d4ed8';
      label = 'ENTREGADO';
    }

    return (
      <View style={[styles.badgeEstado, { backgroundColor: bg }]}>
        <ThemedText style={[styles.badgeEstadoTexto, { color: text }]}>{label}</ThemedText>
      </View>
    );
  };

  const renderItemEnvio = ({ item }: { item: EnvioClienteResumenResponse }) => {
    const seleccionado = codigoBuscado === item.codigoSeguimiento;
    return (
      <Pressable
        onPress={() => onSeleccionarEnvio(item.codigoSeguimiento)}
        style={({ pressed }) => [
          styles.tarjetaResumenEnvio,
          {
            backgroundColor: card,
            borderColor: seleccionado ? tint : border,
            borderWidth: seleccionado ? 2 : StyleSheet.hairlineWidth,
          },
          pressed && styles.botonPresionado,
        ]}>
        <View style={styles.filaEncabezadoResumen}>
          <View style={styles.badgeCodigoMini}>
            <ThemedText style={styles.badgeCodigoMiniTexto}>{item.codigoSeguimiento}</ThemedText>
          </View>
          {renderBadgeEstado(item.estado)}
        </View>

        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.cargaTexto}>
          {item.descripcionCarga ?? 'Mercadería en tránsito'}
        </ThemedText>

        <View style={styles.filaRuta}>
          <MaterialIcons name="trip-origin" size={14} color="#15803d" />
          <ThemedText style={[styles.rutaPuntoTexto, { color: textSecondary }]} numberOfLines={1}>
            {item.origenNombre}
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={14} color={textSecondary} />
          <MaterialIcons name="place" size={14} color="#ef4444" />
          <ThemedText style={[styles.rutaPuntoTexto, { color: textSecondary }]} numberOfLines={1}>
            {item.destinoNombre}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isEnviosRefetching}
            onRefresh={() => {
              refetchMisEnvios();
              if (codigoBuscado) {
                refetchDetalle();
                refetchUbicacion();
              }
            }}
            tintColor={tint}
          />
        }>
        {/* Banner de clave provisoria pendiente */}
        {usuario?.debeCambiarPassword && (
          <View style={[styles.bannerProvisoria, { backgroundColor: '#d9770618', borderColor: '#d97706' }]}>
            <MaterialIcons name="lock-clock" size={20} color="#d97706" />
            <ThemedText style={{ color: '#d97706', flex: 1, fontSize: 13, fontWeight: '600' }}>
              Iniciaste sesión con una clave provisoria. Por favor, actualizala por tu seguridad.
            </ThemedText>
            <Pressable
              onPress={() => setModalPasswordVisible(true)}
              style={({ pressed }) => [
                styles.botonAccionBanner,
                pressed && styles.botonPresionado,
              ]}>
              <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Cambiar</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Encabezado del Cliente y Acceso a Cambio de Contraseña */}
        <View style={[styles.filaHeaderUsuario, { backgroundColor: card, borderColor: border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
              {usuario?.nombreCompleto}
            </ThemedText>
            <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
              {usuario?.email}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              setErrorPassword(null);
              setExitoPassword(null);
              setModalPasswordVisible(true);
            }}
            style={({ pressed }) => [
              styles.botonCambiarClave,
              { borderColor: border },
              pressed && styles.botonPresionado,
            ]}>
            <MaterialIcons name="lock-outline" size={16} color={tint} />
            <ThemedText style={{ color: tint, fontSize: 12, fontWeight: '600' }}>
              Cambiar Clave
            </ThemedText>
          </Pressable>
        </View>

        {/* Cabecera y buscador por código de seguimiento */}
        <View style={[styles.tarjetaBuscador, { backgroundColor: card, borderColor: border }]}>
          <ThemedText type="defaultSemiBold">Rastreo de Envío por Código</ThemedText>
          <ThemedText style={[styles.subtituloBuscador, { color: textSecondary }]}>
            Ingresá el código único proveído por la empresa para ver el estado y ubicación del camión asignado.
          </ThemedText>

          <View style={styles.filaInputBuscador}>
            <TextInput
              value={codigoInput}
              onChangeText={setCodigoInput}
              placeholder="Ej. TRK-ALFA001"
              placeholderTextColor={textSecondary}
              autoCapitalize="characters"
              style={[
                styles.inputCodigo,
                { color: tint, borderColor: border, backgroundColor: background },
              ]}
            />
            <Pressable
              onPress={onBuscar}
              disabled={isDetalleLoading}
              style={({ pressed }) => [
                styles.botonBuscar,
                { backgroundColor: tint },
                pressed && styles.botonPresionado,
              ]}>
              {isDetalleLoading ? (
                <ActivityIndicator size="small" color={background} />
              ) : (
                <ThemedText style={{ color: background, fontWeight: '700' }}>Rastrear</ThemedText>
              )}
            </Pressable>
          </View>

          {isDetalleError && (
            <View style={styles.cajaError}>
              <MaterialIcons name="error-outline" size={18} color="#ef4444" />
              <ThemedText style={styles.textoError}>
                {(detalleError as any)?.response?.status === 403
                  ? 'No tenés autorización para consultar este código de envío.'
                  : 'No se encontró ningún envío asociado al código ingresado.'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Sección: Mis Envíos Asignados */}
        <View style={styles.seccionContenedor}>
          <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
            Mis Envíos Asignados ({misEnvios.length})
          </ThemedText>

          {isEnviosLoading ? (
            <ActivityIndicator size="small" color={tint} style={{ marginVertical: Spacing.two }} />
          ) : misEnvios.length === 0 ? (
            <View style={[styles.tarjetaVacia, { backgroundColor: card, borderColor: border }]}>
              <ThemedText style={{ color: textSecondary, textAlign: 'center' }}>
                No tenés envíos asignados en este momento.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              horizontal
              data={misEnvios}
              keyExtractor={(item) => item.codigoSeguimiento}
              renderItem={renderItemEnvio}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaEnviosHorizontal}
            />
          )}
        </View>

        {/* Detalle del Envío y Mapa del Camión Asignado */}
        {detalleEnvio && (
          <View style={[styles.tarjetaDetalle, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.encabezadoDetalle}>
              <View>
                <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                  CÓDIGO DE SEGUIMIENTO
                </ThemedText>
                <ThemedText type="title" style={styles.codigoTitulo}>
                  {detalleEnvio.codigoSeguimiento}
                </ThemedText>
              </View>
              {renderBadgeEstado(detalleEnvio.estado)}
            </View>

            {detalleEnvio.descripcionCarga && (
              <View style={styles.cajaInfoItem}>
                <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                  DESCRIPCIÓN DE LA CARGA
                </ThemedText>
                <ThemedText style={styles.valorItem}>{detalleEnvio.descripcionCarga}</ThemedText>
              </View>
            )}

            {/* Vehículo Asignado y Chofer (Solo datos públicos sin Over-fetching) */}
            <View style={styles.filaFilaInfo}>
              <View style={[styles.columnaInfo, { borderColor: border }]}>
                <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                  VEHÍCULO ASIGNADO
                </ThemedText>
                <View style={styles.patenteBadge}>
                  <ThemedText style={styles.patenteTexto}>{detalleEnvio.vehiculo.patente}</ThemedText>
                </View>
                <ThemedText style={[styles.vehiculoModelo, { color: textSecondary }]}>
                  {detalleEnvio.vehiculo.marca} {detalleEnvio.vehiculo.modelo}
                </ThemedText>
              </View>

              <View style={[styles.columnaInfo, { borderColor: border }]}>
                <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                  CONDUCTOR
                </ThemedText>
                <ThemedText style={styles.valorItem}>
                  {detalleEnvio.chofer?.nombre ?? 'Chofer asignado'}
                </ThemedText>
              </View>
            </View>

            {/* Itinerario y Trayecto */}
            <View style={[styles.cajaTrayecto, { backgroundColor: background, borderColor: border }]}>
              <View style={styles.puntoTrayecto}>
                <MaterialIcons name="radio-button-checked" size={16} color="#15803d" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                    ORIGEN
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{detalleEnvio.origen.nombre}</ThemedText>
                </View>
              </View>

              <View style={styles.lineaConectora} />

              <View style={styles.puntoTrayecto}>
                <MaterialIcons name="location-on" size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                    DESTINO
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{detalleEnvio.destino.nombre}</ThemedText>
                </View>
              </View>
            </View>

            {/* Posición en vivo exclusiva del camión asignado */}
            <View style={[styles.cajaUbicacionEnVivo, { borderColor: border }]}>
              <View style={styles.filaUbicacionTitulo}>
                <View style={styles.puntoVivoPulsante} />
                <ThemedText type="defaultSemiBold">Ubicación en Tiempo Real</ThemedText>
              </View>

              {ubicacionEnVivo || detalleEnvio.ubicacionActual ? (
                <View style={styles.datosUbicacion}>
                  <ThemedText style={[styles.coordenadasTexto, { color: textSecondary }]}>
                    Latitud:{' '}
                    {(ubicacionEnVivo?.latitud ?? detalleEnvio.ubicacionActual?.latitud)?.toFixed(4)}
                    {'  '}|  Longitud:{' '}
                    {(ubicacionEnVivo?.longitud ?? detalleEnvio.ubicacionActual?.longitud)?.toFixed(4)}
                  </ThemedText>

                  {ubicacionEnVivo?.velocidadKmh != null && (
                    <ThemedText style={{ fontSize: 13, color: '#15803d', fontWeight: '600' }}>
                      Velocidad actual: {Math.round(ubicacionEnVivo.velocidadKmh)} km/h
                    </ThemedText>
                  )}
                </View>
              ) : (
                <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
                  El vehículo aún no ha iniciado la transmisión de posiciones en ruta.
                </ThemedText>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE CAMBIO DE CONTRASEÑA */}
      <Modal visible={modalPasswordVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Cambiar Contraseña</ThemedText>
              <Pressable onPress={() => setModalPasswordVisible(false)}>
                <MaterialIcons name="close" size={24} color={textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalDescripcion, { color: textSecondary }]}>
              Ingresá tu contraseña provisoria o actual, y definí tu nueva contraseña definitiva.
            </ThemedText>

            {errorPassword && (
              <View style={[styles.mensajeAlerta, { backgroundColor: '#ef444422' }]}>
                <ThemedText style={{ color: '#dc2626', fontSize: 13 }}>
                  {errorPassword}
                </ThemedText>
              </View>
            )}

            {exitoPassword && (
              <View style={[styles.mensajeAlerta, { backgroundColor: '#22c55e22' }]}>
                <ThemedText style={{ color: '#15803d', fontSize: 13 }}>
                  {exitoPassword}
                </ThemedText>
              </View>
            )}

            <ScrollView contentContainerStyle={{ gap: Spacing.two }}>
              <ThemedText style={styles.labelInput}>Contraseña actual / provisoria</ThemedText>
              <TextInput
                value={passwordActual}
                onChangeText={setPasswordActual}
                secureTextEntry
                placeholder="••••••"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Nueva contraseña (mínimo 6 caracteres)</ThemedText>
              <TextInput
                value={nuevaPassword}
                onChangeText={setNuevaPassword}
                secureTextEntry
                placeholder="Nueva clave"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Confirmar nueva contraseña</ThemedText>
              <TextInput
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                secureTextEntry
                placeholder="Repetir nueva clave"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <Pressable
                onPress={manejarCambioPasswordCliente}
                disabled={cargandoPassword}
                style={({ pressed }) => [
                  styles.botonModalSubmit,
                  { backgroundColor: tint },
                  pressed && styles.botonPresionado,
                ]}>
                {cargandoPassword ? (
                  <ActivityIndicator color={background} />
                ) : (
                  <ThemedText style={{ color: background, fontWeight: '700' }}>
                    Guardar Nueva Contraseña
                  </ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: Spacing.four,
  },
  tarjetaAlerta: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.four,
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
  },
  botonRegresar: {
    width: '100%',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  tarjetaBuscador: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  subtituloBuscador: {
    fontSize: 13,
    marginBottom: Spacing.one,
  },
  filaInputBuscador: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inputCodigo: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontWeight: '700',
    letterSpacing: 1,
  },
  botonBuscar: {
    paddingHorizontal: Spacing.four,
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cajaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#ef444415',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  textoError: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  seccionContenedor: {
    gap: Spacing.two,
  },
  seccionTitulo: {
    fontSize: 15,
  },
  listaEnviosHorizontal: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  tarjetaResumenEnvio: {
    width: 250,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  tarjetaVacia: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filaEncabezadoResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCodigoMini: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCodigoMiniTexto: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  cargaTexto: {
    fontSize: 14,
  },
  filaRuta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rutaPuntoTexto: {
    fontSize: 12,
    maxWidth: 80,
  },
  tarjetaDetalle: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  encabezadoDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labelPequeno: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  codigoTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284c7',
  },
  badgeEstado: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeEstadoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  cajaInfoItem: {
    gap: 2,
  },
  valorItem: {
    fontSize: 15,
    fontWeight: '600',
  },
  filaFilaInfo: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  columnaInfo: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    gap: 4,
  },
  patenteBadge: {
    backgroundColor: '#0f172a',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  patenteTexto: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 13,
  },
  vehiculoModelo: {
    fontSize: 12,
  },
  cajaTrayecto: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  puntoTrayecto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lineaConectora: {
    width: 2,
    height: 16,
    backgroundColor: '#94a3b8',
    marginLeft: 7,
  },
  cajaUbicacionEnVivo: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  filaUbicacionTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  puntoVivoPulsante: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  datosUbicacion: {
    gap: 4,
  },
  coordenadasTexto: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  botonPresionado: {
    opacity: 0.7,
  },
  bannerProvisoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  botonAccionBanner: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filaHeaderUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  botonCambiarClave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContenido: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDescripcion: {
    fontSize: 13,
  },
  mensajeAlerta: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  labelInput: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  botonModalSubmit: {
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
