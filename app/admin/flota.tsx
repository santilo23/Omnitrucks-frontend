import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  asignarViajeAdmin,
  crearChoferAdmin,
  crearClienteAdmin,
  finalizarViajeAdmin,
  generarViajeSimuladoDemoAdmin,
  listarChoferesAdmin,
  listarClientesAdmin,
  obtenerFlotaAdmin,
  obtenerResumenFlotaAdmin,
  obtenerViajesActivosAdmin,
} from '@/api/admin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  AsignarViajeAdminRequest,
  CrearChoferRequest,
  CrearClienteRequest,
  EstadoOperativoCamion,
  FiltroFlota,
} from '@/types';

type PestanaAdmin = 'EN_RUTA' | 'CAMIONES' | 'CHOFERES' | 'CLIENTES';

const RUTAS_PREDEFINIDAS = [
  {
    nombre: 'Buenos Aires → Rosario',
    origen: { nombre: 'Buenos Aires (Puerto)', lat: -34.6037, lon: -58.3816 },
    destino: { nombre: 'Rosario (Centro Logístico)', lat: -32.9468, lon: -60.6393 },
    carga: 'Pallets de mercadería en seco',
  },
  {
    nombre: 'Rosario → Córdoba',
    origen: { nombre: 'Rosario (Parque Industrial)', lat: -32.9468, lon: -60.6393 },
    destino: { nombre: 'Córdoba (Terminal Cargas)', lat: -31.4201, lon: -64.1888 },
    carga: 'Insumos industriales y autopartes',
  },
  {
    nombre: 'Buenos Aires → Mar del Plata',
    origen: { nombre: 'Buenos Aires (Mercado Central)', lat: -34.6037, lon: -58.3816 },
    destino: { nombre: 'Mar del Plata (Parque Industrial)', lat: -38.0055, lon: -57.5562 },
    carga: 'Alimentos refrigerados en tránsito',
  },
  {
    nombre: 'Mendoza → San Juan',
    origen: { nombre: 'Mendoza (Zona Franca)', lat: -32.8895, lon: -68.8458 },
    destino: { nombre: 'San Juan (Centro Cargas)', lat: -31.5375, lon: -68.5364 },
    carga: 'Vinos y productos de exportación',
  },
];

export default function AdminFlotaScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario, isLoading: isAuthLoading } = useAuth();

  const [pestanaActiva, setPestanaActiva] = useState<PestanaAdmin>('EN_RUTA');
  const [filtroCamiones, setFiltroCamiones] = useState<FiltroFlota>('TODOS');

  // Modales
  const [modalChoferVisible, setModalChoferVisible] = useState(false);
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [modalViajeVisible, setModalViajeVisible] = useState(false);

  // Formulario Chofer
  const [nombreChofer, setNombreChofer] = useState('');
  const [apellidoChofer, setApellidoChofer] = useState('');
  const [emailChofer, setEmailChofer] = useState('');
  const [passwordChofer, setPasswordChofer] = useState('');
  const [mensajeChofer, setMensajeChofer] = useState<{ texto: string; error: boolean } | null>(null);

  // Formulario Cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [apellidoCliente, setApellidoCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [passwordProvisoriaCliente, setPasswordProvisoriaCliente] = useState('');
  const [mensajeCliente, setMensajeCliente] = useState<{ texto: string; error: boolean } | null>(null);

  // Formulario Asignar Viaje
  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState<number | null>(null);
  const [choferSeleccionadoId, setChoferSeleccionadoId] = useState<number | null>(null);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<number | null>(null);
  const [rutaIndex, setRutaIndex] = useState(0);
  const [descripcionCarga, setDescripcionCarga] = useState(RUTAS_PREDEFINIDAS[0].carga);
  const [iniciarInmediatamente, setIniciarInmediatamente] = useState(true);
  const [mensajeViaje, setMensajeViaje] = useState<{ texto: string; error: boolean } | null>(null);

  // Notificación de simulación
  const [notificacionSimulacion, setNotificacionSimulacion] = useState<string | null>(null);

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  // Consultas TanStack Query
  const { data: resumen, refetch: refetchResumen } = useQuery({
    queryKey: ['admin-flota-resumen'],
    queryFn: obtenerResumenFlotaAdmin,
    enabled: usuario?.rol === 'ADMIN',
  });

  const { data: viajesActivos = [], isLoading: isViajesLoading, refetch: refetchViajes } = useQuery({
    queryKey: ['admin-viajes-activos'],
    queryFn: obtenerViajesActivosAdmin,
    enabled: usuario?.rol === 'ADMIN',
    refetchInterval: 5000, // Refresco en vivo cada 5s para ver los camiones moviéndose
  });

  const { data: camiones = [], refetch: refetchCamiones } = useQuery({
    queryKey: ['admin-flota', filtroCamiones],
    queryFn: () => obtenerFlotaAdmin(filtroCamiones),
    enabled: usuario?.rol === 'ADMIN',
  });

  const { data: choferes = [], refetch: refetchChoferes } = useQuery({
    queryKey: ['admin-choferes'],
    queryFn: listarChoferesAdmin,
    enabled: usuario?.rol === 'ADMIN',
  });

  const { data: clientes = [], refetch: refetchClientes } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: listarClientesAdmin,
    enabled: usuario?.rol === 'ADMIN',
  });

  // Choferes y Camiones disponibles (no asignados actualmente a un viaje activo en ruta)
  const choferesEnRutaIds = new Set(viajesActivos.map((v) => v.choferId).filter((id): id is number => id !== null));
  const camionesEnRutaIds = new Set(viajesActivos.map((v) => v.camionId).filter((id): id is number => id !== null));

  const camionesDisponibles = camiones.filter((c) => c.activo && !camionesEnRutaIds.has(c.id));
  const choferesDisponibles = choferes.filter((ch) => !choferesEnRutaIds.has(ch.id));

  // Mutación: Crear Chofer
  const crearChoferMutation = useMutation({
    mutationFn: (datos: CrearChoferRequest) => crearChoferAdmin(datos),
    onSuccess: (nuevo) => {
      setMensajeChofer({
        texto: `¡Chofer ${nuevo.nombreCompleto} creado con éxito! Ya puede iniciar sesión con ${nuevo.email}`,
        error: false,
      });
      setNombreChofer('');
      setApellidoChofer('');
      setEmailChofer('');
      setPasswordChofer('');
      queryClient.invalidateQueries({ queryKey: ['admin-choferes'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al dar de alta el chofer.';
      setMensajeChofer({ texto: msg, error: true });
    },
  });

  // Mutación: Crear Cliente con Clave Provisoria
  const crearClienteMutation = useMutation({
    mutationFn: (datos: CrearClienteRequest) => crearClienteAdmin(datos),
    onSuccess: (nuevo) => {
      setMensajeCliente({
        texto: `¡Cliente ${nuevo.nombreCompleto} creado con éxito! Clave provisoria asignada. Deberá cambiarla al iniciar sesión.`,
        error: false,
      });
      setNombreCliente('');
      setApellidoCliente('');
      setEmailCliente('');
      setPasswordProvisoriaCliente('');
      queryClient.invalidateQueries({ queryKey: ['admin-clientes'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al dar de alta el cliente.';
      setMensajeCliente({ texto: msg, error: true });
    },
  });

  // Mutación: Asignar Viaje
  const asignarViajeMutation = useMutation({
    mutationFn: (datos: AsignarViajeAdminRequest) => asignarViajeAdmin(datos),
    onSuccess: (viaje) => {
      setMensajeViaje({
        texto: `¡Viaje asignado con éxito! Código de seguimiento para cliente: ${viaje.codigoSeguimiento}`,
        error: false,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-viajes-activos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota-resumen'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al asignar el viaje.';
      setMensajeViaje({ texto: msg, error: true });
    },
  });

  // Mutación: Simulación 1-click
  const simularDemoMutation = useMutation({
    mutationFn: generarViajeSimuladoDemoAdmin,
    onSuccess: (viaje) => {
      setNotificacionSimulacion(
        `Camión simulado en ruta. Chofer: ${viaje.choferNombre}. Código cliente: ${viaje.codigoSeguimiento}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-viajes-activos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota-resumen'] });
      setPestanaActiva('EN_RUTA');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo iniciar la simulación.');
    },
  });

  // Mutación: Finalizar Viaje
  const finalizarViajeMutation = useMutation({
    mutationFn: (viajeId: number) => finalizarViajeAdmin(viajeId),
    onSuccess: () => {
      setNotificacionSimulacion('Viaje finalizado exitosamente. El camión y chofer han quedado disponibles.');
      queryClient.invalidateQueries({ queryKey: ['admin-viajes-activos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flota-resumen'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo finalizar el viaje.');
    },
  });

  const handleFinalizarViaje = (viajeId: number, choferNombre: string, camionPatente: string) => {
    Alert.alert(
      'Finalizar Viaje',
      `¿Deseas finalizar el viaje del chofer ${choferNombre} (Camión ${camionPatente})? El camión y el chofer quedarán disponibles para nuevos viajes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => finalizarViajeMutation.mutate(viajeId),
        },
      ]
    );
  };

  const onRefresh = async () => {
    await Promise.all([
      refetchResumen(),
      refetchViajes(),
      refetchCamiones(),
      refetchChoferes(),
      refetchClientes(),
    ]);
  };

  const handleCrearChofer = () => {
    if (!nombreChofer.trim() || !apellidoChofer.trim() || !emailChofer.trim() || !passwordChofer.trim()) {
      setMensajeChofer({ texto: 'Por favor completá todos los campos.', error: true });
      return;
    }
    crearChoferMutation.mutate({
      nombre: nombreChofer.trim(),
      apellido: apellidoChofer.trim(),
      email: emailChofer.trim(),
      password: passwordChofer,
    });
  };

  const handleCrearCliente = () => {
    if (!nombreCliente.trim() || !apellidoCliente.trim() || !emailCliente.trim() || !passwordProvisoriaCliente.trim()) {
      setMensajeCliente({ texto: 'Por favor completá todos los campos.', error: true });
      return;
    }
    crearClienteMutation.mutate({
      nombre: nombreCliente.trim(),
      apellido: apellidoCliente.trim(),
      email: emailCliente.trim(),
      passwordProvisoria: passwordProvisoriaCliente,
    });
  };

  const handleAsignarViaje = () => {
    if (!camionSeleccionadoId || !choferSeleccionadoId) {
      setMensajeViaje({ texto: 'Debes seleccionar un camión y un chofer.', error: true });
      return;
    }
    if (camionesEnRutaIds.has(camionSeleccionadoId)) {
      setMensajeViaje({ texto: 'El camión seleccionado ya se encuentra en viaje activo.', error: true });
      return;
    }
    if (choferesEnRutaIds.has(choferSeleccionadoId)) {
      setMensajeViaje({ texto: 'El chofer seleccionado ya tiene un viaje activo en curso.', error: true });
      return;
    }
    const ruta = RUTAS_PREDEFINIDAS[rutaIndex];
    asignarViajeMutation.mutate({
      camionId: camionSeleccionadoId,
      choferId: choferSeleccionadoId,
      clienteId: clienteSeleccionadoId ?? undefined,
      origenNombre: ruta.origen.nombre,
      origenLat: ruta.origen.lat,
      origenLon: ruta.origen.lon,
      destinoNombre: ruta.destino.nombre,
      destinoLat: ruta.destino.lat,
      destinoLon: ruta.destino.lon,
      descripcionCarga: descripcionCarga.trim() || ruta.carga,
      iniciarInmediatamente,
    });
  };

  if (isAuthLoading) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // RBAC Guard
  if (!usuario || usuario.rol !== 'ADMIN') {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <View style={[styles.tarjetaAlerta, { backgroundColor: card, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.textoCentro}>
            Acceso Denegado
          </ThemedText>
          <ThemedText style={[styles.descripcion, { color: textSecondary }]}>
            El Panel de Operaciones es exclusivo para usuarios con rol ADMINISTRADOR.
          </ThemedText>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
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

  const renderBadgeEstado = (estado: EstadoOperativoCamion) => {
    let bg = '#6b728022';
    let text = '#6b7280';
    let label = 'INACTIVO';

    if (estado === 'DISPONIBLE') {
      bg = '#22c55e22';
      text = '#15803d';
      label = 'DISPONIBLE';
    } else if (estado === 'EN_TRANSITO') {
      bg = '#3b82f622';
      text = '#1d4ed8';
      label = 'EN TRÁNSITO';
    }

    return (
      <View style={[styles.badgeOperativo, { backgroundColor: bg }]}>
        <ThemedText style={[styles.badgeOperativoTexto, { color: text }]}>{label}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* 1. Métricas Consolidadas de la Flota */}
      <View style={styles.resumenContainer}>
        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: textSecondary }]}>TOTAL</ThemedText>
          <ThemedText type="title" style={styles.metricaNumero}>
            {resumen?.total ?? 0}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#15803d' }]}>DISPONIBLES</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#15803d' }]}>
            {resumen?.disponibles ?? 0}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#1d4ed8' }]}>EN TRÁNSITO</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#1d4ed8' }]}>
            {resumen?.enTransito ?? 0}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#ef4444' }]}>INACTIVOS</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#ef4444' }]}>
            {resumen?.inactivos ?? 0}
          </ThemedText>
        </View>
      </View>

      {/* 2. Barra de Acciones Rápidas del Administrador */}
      <View style={styles.barraAcciones}>
        <Pressable
          onPress={() => simularDemoMutation.mutate()}
          disabled={simularDemoMutation.isPending}
          style={({ pressed }) => [
            styles.botonAccion,
            { backgroundColor: '#0284c7' },
            pressed && styles.botonPresionado,
          ]}>
          {simularDemoMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="bolt" size={18} color="#FFFFFF" />
          )}
          <ThemedText style={styles.botonAccionTexto}>Simular Camión en Vivo</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            setMensajeViaje(null);
            setModalViajeVisible(true);
          }}
          style={({ pressed }) => [
            styles.botonAccion,
            { backgroundColor: '#059669' },
            pressed && styles.botonPresionado,
          ]}>
          <MaterialIcons name="add-road" size={18} color="#FFFFFF" />
          <ThemedText style={styles.botonAccionTexto}>Asignar Viaje</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            setMensajeChofer(null);
            setModalChoferVisible(true);
          }}
          style={({ pressed }) => [
            styles.botonAccion,
            { backgroundColor: '#7c3aed' },
            pressed && styles.botonPresionado,
          ]}>
          <MaterialIcons name="person-add" size={18} color="#FFFFFF" />
          <ThemedText style={styles.botonAccionTexto}>Agregar Chofer</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            setMensajeCliente(null);
            setModalClienteVisible(true);
          }}
          style={({ pressed }) => [
            styles.botonAccion,
            { backgroundColor: '#0891b2' },
            pressed && styles.botonPresionado,
          ]}>
          <MaterialIcons name="badge" size={18} color="#FFFFFF" />
          <ThemedText style={styles.botonAccionTexto}>Agregar Cliente</ThemedText>
        </Pressable>
      </View>

      {/* Banner de notificación cuando se simula un viaje */}
      {notificacionSimulacion && (
        <View style={[styles.bannerSimulacion, { backgroundColor: '#0284c722', borderColor: '#0284c7' }]}>
          <MaterialIcons name="check-circle" size={20} color="#0284c7" />
          <ThemedText style={{ color: '#0284c7', fontSize: 13, flex: 1, fontWeight: '600' }}>
            {notificacionSimulacion}
          </ThemedText>
          <Pressable onPress={() => setNotificacionSimulacion(null)}>
            <MaterialIcons name="close" size={18} color="#0284c7" />
          </Pressable>
        </View>
      )}

      {/* 3. Pestañas de Navegación del Panel */}
      <View style={[styles.pestanasContainer, { borderBottomColor: border }]}>
        <Pressable
          onPress={() => setPestanaActiva('EN_RUTA')}
          style={[styles.pestana, pestanaActiva === 'EN_RUTA' && { borderBottomColor: tint, borderBottomWidth: 3 }]}>
          <MaterialIcons
            name="navigation"
            size={18}
            color={pestanaActiva === 'EN_RUTA' ? tint : textSecondary}
          />
          <ThemedText
            style={[
              styles.pestanaTexto,
              { color: pestanaActiva === 'EN_RUTA' ? tint : textSecondary, fontWeight: pestanaActiva === 'EN_RUTA' ? '700' : '500' },
            ]}>
            En Ruta ({viajesActivos.length})
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setPestanaActiva('CAMIONES')}
          style={[styles.pestana, pestanaActiva === 'CAMIONES' && { borderBottomColor: tint, borderBottomWidth: 3 }]}>
          <MaterialIcons
            name="local-shipping"
            size={18}
            color={pestanaActiva === 'CAMIONES' ? tint : textSecondary}
          />
          <ThemedText
            style={[
              styles.pestanaTexto,
              { color: pestanaActiva === 'CAMIONES' ? tint : textSecondary, fontWeight: pestanaActiva === 'CAMIONES' ? '700' : '500' },
            ]}>
            Camiones
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setPestanaActiva('CHOFERES')}
          style={[styles.pestana, pestanaActiva === 'CHOFERES' && { borderBottomColor: tint, borderBottomWidth: 3 }]}>
          <MaterialIcons
            name="people"
            size={18}
            color={pestanaActiva === 'CHOFERES' ? tint : textSecondary}
          />
          <ThemedText
            style={[
              styles.pestanaTexto,
              { color: pestanaActiva === 'CHOFERES' ? tint : textSecondary, fontWeight: pestanaActiva === 'CHOFERES' ? '700' : '500' },
            ]}>
            Choferes ({choferes.length})
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setPestanaActiva('CLIENTES')}
          style={[styles.pestana, pestanaActiva === 'CLIENTES' && { borderBottomColor: tint, borderBottomWidth: 3 }]}>
          <MaterialIcons
            name="business"
            size={18}
            color={pestanaActiva === 'CLIENTES' ? tint : textSecondary}
          />
          <ThemedText
            style={[
              styles.pestanaTexto,
              { color: pestanaActiva === 'CLIENTES' ? tint : textSecondary, fontWeight: pestanaActiva === 'CLIENTES' ? '700' : '500' },
            ]}>
            Clientes ({clientes.length})
          </ThemedText>
        </Pressable>
      </View>

      {/* 4. Contenido según pestaña */}
      {pestanaActiva === 'EN_RUTA' && (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isViajesLoading} onRefresh={onRefresh} tintColor={tint} />}>
          {viajesActivos.length === 0 ? (
            <View style={[styles.tarjetaVacia, { backgroundColor: card, borderColor: border }]}>
              <MaterialIcons name="local-shipping" size={40} color={textSecondary} />
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                No hay choferes conduciendo en este momento
              </ThemedText>
              <ThemedText style={{ color: textSecondary, textAlign: 'center', fontSize: 13 }}>
                {'Presioná "Simular Camión en Vivo" o "Asignar Viaje" para poner camiones en ruta.'}
              </ThemedText>
            </View>
          ) : (
            viajesActivos.map((viaje) => (
              <View
                key={viaje.viajeId}
                style={[styles.tarjetaViajeActivo, { backgroundColor: card, borderColor: border }]}>
                {/* Código de Seguimiento para el Cliente destacado */}
                <View style={[styles.cajaCodigoCliente, { backgroundColor: '#0284c718', borderColor: '#0284c7' }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.labelCodigoCliente}>
                      CÓDIGO DE SEGUIMIENTO PARA EL CLIENTE
                    </ThemedText>
                    <ThemedText type="title" style={styles.codigoClienteTexto}>
                      {viaje.codigoSeguimiento}
                    </ThemedText>
                  </View>
                  <View style={styles.badgeSimulando}>
                    <View style={styles.puntoPulsante} />
                    <ThemedText style={styles.textoSimulando}>En Vivo</ThemedText>
                  </View>
                </View>

                {/* Chofer y Camión */}
                <View style={styles.filaChoferCamion}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.labelPequeno, { color: textSecondary }]}>
                      CONDUCTOR ASIGNADO
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                      {viaje.choferNombre}
                    </ThemedText>
                    <ThemedText style={{ color: textSecondary, fontSize: 12 }}>
                      {viaje.choferEmail}
                    </ThemedText>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.patenteBadge}>
                      <ThemedText style={styles.patenteTexto}>{viaje.camionPatente}</ThemedText>
                    </View>
                    <ThemedText style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                      {viaje.camionModelo}
                    </ThemedText>
                  </View>
                </View>

                {/* Itinerario y Telemetría */}
                <View style={[styles.itinerarioCaja, { backgroundColor: background, borderColor: border }]}>
                  <View style={styles.filaItinerario}>
                    <MaterialIcons name="radio-button-checked" size={14} color="#15803d" />
                    <ThemedText style={{ fontSize: 13, flex: 1 }}>
                      {viaje.origenNombre} → <ThemedText type="defaultSemiBold">{viaje.destinoNombre}</ThemedText>
                    </ThemedText>
                  </View>

                  <View style={styles.filaTelemetria}>
                    <ThemedText style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>
                      Velocidad: {Math.round(viaje.velocidadKmh)} km/h
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: textSecondary }}>
                      GPS: {viaje.latitudActual.toFixed(4)}, {viaje.longitudActual.toFixed(4)}
                    </ThemedText>
                  </View>
                </View>

                {/* Acciones del Viaje: Ver en Mapa y Finalizar */}
                <View style={styles.filaAccionesTarjeta}>
                  <Pressable
                    onPress={() => router.push('/(tabs)/mapa')}
                    style={({ pressed }) => [
                      styles.botonVerMapa,
                      { borderColor: tint },
                      pressed && styles.botonPresionado,
                    ]}>
                    <MaterialIcons name="map" size={16} color={tint} />
                    <ThemedText style={{ color: tint, fontWeight: '600', fontSize: 13 }}>
                      Ver en Mapa
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    disabled={finalizarViajeMutation.isPending}
                    onPress={() => handleFinalizarViaje(viaje.viajeId, viaje.choferNombre, viaje.camionPatente)}
                    style={({ pressed }) => [
                      styles.botonFinalizarViaje,
                      pressed && styles.botonPresionado,
                    ]}>
                    <MaterialIcons name="flag" size={16} color="#dc2626" />
                    <ThemedText style={{ color: '#dc2626', fontWeight: '600', fontSize: 13 }}>
                      Finalizar Viaje
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {pestanaActiva === 'CAMIONES' && (
        <View style={{ flex: 1 }}>
          {/* Selector de Filtros de Camiones */}
          <View style={styles.filtrosContainer}>
            {(['TODOS', 'ACTIVOS', 'INACTIVOS'] as FiltroFlota[]).map((f) => {
              const activo = filtroCamiones === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFiltroCamiones(f)}
                  style={({ pressed }) => [
                    styles.filtroChip,
                    {
                      backgroundColor: activo ? tint : card,
                      borderColor: activo ? tint : border,
                    },
                    pressed && styles.botonPresionado,
                  ]}>
                  <ThemedText
                    style={[
                      styles.filtroChipTexto,
                      { color: activo ? background : textSecondary, fontWeight: activo ? '700' : '500' },
                    ]}>
                    {f}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={camiones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.tarjetaCamion, { backgroundColor: card, borderColor: border }]}>
                <View style={styles.filaCamionEncabezado}>
                  <View style={styles.patenteBadge}>
                    <ThemedText style={styles.patenteTexto}>{item.patente}</ThemedText>
                  </View>
                  {renderBadgeEstado(item.estadoOperativo)}
                </View>

                <View style={styles.infoCamion}>
                  <ThemedText type="defaultSemiBold" style={styles.modeloTexto}>
                    {item.marca} {item.modelo}
                  </ThemedText>
                  <View style={styles.detallesFila}>
                    <ThemedText style={[styles.detalleLabel, { color: textSecondary }]}>
                      Año: {item.anio ?? 'N/D'}
                    </ThemedText>
                    <ThemedText style={[styles.detalleSeparador, { color: textSecondary }]}>•</ThemedText>
                    <ThemedText style={[styles.detalleLabel, { color: textSecondary }]}>
                      Capacidad: {item.capacidadKg ? `${item.capacidadKg.toLocaleString()} kg` : 'N/D'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={tint} />}
          />
        </View>
      )}

      {pestanaActiva === 'CHOFERES' && (
        <FlatList
          data={choferes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.tarjetaChoferItem, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.avatarChoferMini}>
                <MaterialIcons name="person" size={24} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                  {item.nombreCompleto}
                </ThemedText>
                <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
                  {item.email}
                </ThemedText>
                <ThemedText style={{ color: '#059669', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                  Cuenta activa para iniciar sesión
                </ThemedText>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={tint} />}
        />
      )}

      {pestanaActiva === 'CLIENTES' && (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={[styles.tarjetaVacia, { backgroundColor: card, borderColor: border }]}>
              <MaterialIcons name="business" size={40} color={textSecondary} />
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                No hay clientes registrados
              </ThemedText>
              <ThemedText style={{ color: textSecondary, textAlign: 'center', fontSize: 13 }}>
                {'Presioná "Agregar Cliente" para dar de alta clientes con clave provisoria.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.tarjetaChoferItem, { backgroundColor: card, borderColor: border }]}>
              <View style={[styles.avatarChoferMini, { backgroundColor: '#0891b222' }]}>
                <MaterialIcons name="business" size={24} color="#0891b2" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                  {item.nombreCompleto}
                </ThemedText>
                <ThemedText style={{ color: textSecondary, fontSize: 13 }}>
                  {item.email}
                </ThemedText>
                {item.debeCambiarPassword ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MaterialIcons name="lock-clock" size={14} color="#d97706" />
                    <ThemedText style={{ color: '#d97706', fontSize: 11, fontWeight: '700' }}>
                      Clave provisoria asignada (debe cambiarla al ingresar)
                    </ThemedText>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MaterialIcons name="check-circle" size={14} color="#059669" />
                    <ThemedText style={{ color: '#059669', fontSize: 11, fontWeight: '600' }}>
                      Contraseña definitiva establecida
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={tint} />}
        />
      )}

      {/* MODAL 1: ALTA DE CHOFER CON CLAVE */}
      <Modal visible={modalChoferVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Agregar Nuevo Chofer</ThemedText>
              <Pressable onPress={() => setModalChoferVisible(false)}>
                <MaterialIcons name="close" size={24} color={textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalDescripcion, { color: textSecondary }]}>
              Ingresá los datos del conductor y definí su contraseña de acceso.
            </ThemedText>

            {mensajeChofer && (
              <View
                style={[
                  styles.mensajeAlerta,
                  { backgroundColor: mensajeChofer.error ? '#ef444422' : '#22c55e22' },
                ]}>
                <ThemedText style={{ color: mensajeChofer.error ? '#dc2626' : '#15803d', fontSize: 13 }}>
                  {mensajeChofer.texto}
                </ThemedText>
              </View>
            )}

            <ScrollView contentContainerStyle={{ gap: Spacing.two }}>
              <ThemedText style={styles.labelInput}>Nombre</ThemedText>
              <TextInput
                value={nombreChofer}
                onChangeText={setNombreChofer}
                placeholder="Ej. Juan"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Apellido</ThemedText>
              <TextInput
                value={apellidoChofer}
                onChangeText={setApellidoChofer}
                placeholder="Ej. Pérez"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Email (usuario para login)</ThemedText>
              <TextInput
                value={emailChofer}
                onChangeText={setEmailChofer}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="juan.perez@omnitrucks.com"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Contraseña de acceso</ThemedText>
              <TextInput
                value={passwordChofer}
                onChangeText={setPasswordChofer}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <Pressable
                onPress={handleCrearChofer}
                disabled={crearChoferMutation.isPending}
                style={({ pressed }) => [
                  styles.botonModalSubmit,
                  { backgroundColor: '#7c3aed' },
                  pressed && styles.botonPresionado,
                ]}>
                {crearChoferMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    Guardar y Habilitar Chofer
                  </ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ASIGNAR VIAJE A CHOFER */}
      <Modal visible={modalViajeVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Asignar Viaje a Chofer</ThemedText>
              <Pressable onPress={() => setModalViajeVisible(false)}>
                <MaterialIcons name="close" size={24} color={textSecondary} />
              </Pressable>
            </View>

            {mensajeViaje && (
              <View
                style={[
                  styles.mensajeAlerta,
                  { backgroundColor: mensajeViaje.error ? '#ef444422' : '#22c55e22' },
                ]}>
                <ThemedText style={{ color: mensajeViaje.error ? '#dc2626' : '#15803d', fontSize: 13 }}>
                  {mensajeViaje.texto}
                </ThemedText>
              </View>
            )}

            <ScrollView contentContainerStyle={{ gap: Spacing.two }}>
              {/* Selector de Camión */}
              <ThemedText style={styles.labelInput}>1. Seleccionar Camión (Disponibles)</ThemedText>
              {camionesDisponibles.length === 0 ? (
                <ThemedText style={{ color: textSecondary, fontSize: 12, marginVertical: 4 }}>
                  No hay camiones disponibles en este momento (todos están en viaje activo).
                </ThemedText>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {camionesDisponibles.map((c) => {
                    const sel = camionSeleccionadoId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCamionSeleccionadoId(c.id)}
                        style={[
                          styles.chipSelector,
                          { borderColor: sel ? '#059669' : border, backgroundColor: sel ? '#05966922' : background },
                        ]}>
                        <ThemedText style={{ fontWeight: sel ? '700' : '500', fontSize: 12 }}>
                          {c.patente} ({c.marca})
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Selector de Chofer */}
              <ThemedText style={styles.labelInput}>2. Seleccionar Chofer (Disponibles)</ThemedText>
              {choferesDisponibles.length === 0 ? (
                <ThemedText style={{ color: textSecondary, fontSize: 12, marginVertical: 4 }}>
                  No hay choferes disponibles en este momento (todos están en viaje activo).
                </ThemedText>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {choferesDisponibles.map((ch) => {
                    const sel = choferSeleccionadoId === ch.id;
                    return (
                      <Pressable
                        key={ch.id}
                        onPress={() => setChoferSeleccionadoId(ch.id)}
                        style={[
                          styles.chipSelector,
                          { borderColor: sel ? '#7c3aed' : border, backgroundColor: sel ? '#7c3aed22' : background },
                        ]}>
                        <ThemedText style={{ fontWeight: sel ? '700' : '500', fontSize: 12 }}>
                          {ch.nombreCompleto}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Selector de Ruta */}
              <ThemedText style={styles.labelInput}>3. Seleccionar Itinerario</ThemedText>
              {RUTAS_PREDEFINIDAS.map((r, idx) => {
                const sel = rutaIndex === idx;
                return (
                  <Pressable
                    key={r.nombre}
                    onPress={() => {
                      setRutaIndex(idx);
                      setDescripcionCarga(r.carga);
                    }}
                    style={[
                      styles.rutaItemCard,
                      { borderColor: sel ? tint : border, backgroundColor: sel ? tint + '18' : background },
                    ]}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                      {r.nombre}
                    </ThemedText>
                    <ThemedText style={{ color: textSecondary, fontSize: 11 }}>
                      {r.carga}
                    </ThemedText>
                  </Pressable>
                );
              })}

              <ThemedText style={styles.labelInput}>Descripción de la Carga</ThemedText>
              <TextInput
                value={descripcionCarga}
                onChangeText={setDescripcionCarga}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              {/* Selector de Cliente (Opcional) */}
              <ThemedText style={styles.labelInput}>4. Asignar a Cliente (Opcional)</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <Pressable
                  onPress={() => setClienteSeleccionadoId(null)}
                  style={[
                    styles.chipSelector,
                    {
                      borderColor: clienteSeleccionadoId === null ? '#0891b2' : border,
                      backgroundColor: clienteSeleccionadoId === null ? '#0891b222' : background,
                    },
                  ]}>
                  <ThemedText style={{ fontWeight: clienteSeleccionadoId === null ? '700' : '500', fontSize: 12 }}>
                    Sin asignar (vincular con código)
                  </ThemedText>
                </Pressable>
                {clientes.map((cl) => {
                  const sel = clienteSeleccionadoId === cl.id;
                  return (
                    <Pressable
                      key={cl.id}
                      onPress={() => setClienteSeleccionadoId(cl.id)}
                      style={[
                        styles.chipSelector,
                        { borderColor: sel ? '#0891b2' : border, backgroundColor: sel ? '#0891b222' : background },
                      ]}>
                      <ThemedText style={{ fontWeight: sel ? '700' : '500', fontSize: 12 }}>
                        {cl.nombreCompleto}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                onPress={() => setIniciarInmediatamente(!iniciarInmediatamente)}
                style={styles.checkFila}>
                <MaterialIcons
                  name={iniciarInmediatamente ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color="#059669"
                />
                <ThemedText style={{ fontSize: 13, flex: 1 }}>
                  Iniciar simulación en ruta inmediatamente (estado EN_CURSO)
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleAsignarViaje}
                disabled={asignarViajeMutation.isPending}
                style={({ pressed }) => [
                  styles.botonModalSubmit,
                  { backgroundColor: '#059669' },
                  pressed && styles.botonPresionado,
                ]}>
                {asignarViajeMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    Confirmar y Asignar Viaje
                  </ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ALTA DE CLIENTE CON CLAVE PROVISORIA */}
      <Modal visible={modalClienteVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Agregar Nuevo Cliente</ThemedText>
              <Pressable onPress={() => setModalClienteVisible(false)}>
                <MaterialIcons name="close" size={24} color={textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalDescripcion, { color: textSecondary }]}>
              Ingresá los datos del cliente y asignale una clave provisoria. Al iniciar sesión por primera vez, el sistema le solicitará cambiarla obligatoriamente.
            </ThemedText>

            {mensajeCliente && (
              <View
                style={[
                  styles.mensajeAlerta,
                  { backgroundColor: mensajeCliente.error ? '#ef444422' : '#22c55e22' },
                ]}>
                <ThemedText style={{ color: mensajeCliente.error ? '#dc2626' : '#15803d', fontSize: 13 }}>
                  {mensajeCliente.texto}
                </ThemedText>
              </View>
            )}

            <ScrollView contentContainerStyle={{ gap: Spacing.two }}>
              <ThemedText style={styles.labelInput}>Nombre / Empresa</ThemedText>
              <TextInput
                value={nombreCliente}
                onChangeText={setNombreCliente}
                placeholder="Ej. Distribuidora Central"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Apellido / Sucursal</ThemedText>
              <TextInput
                value={apellidoCliente}
                onChangeText={setApellidoCliente}
                placeholder="Ej. S.A. o Buenos Aires"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Email (usuario para login)</ThemedText>
              <TextInput
                value={emailCliente}
                onChangeText={setEmailCliente}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="contacto@cliente.com"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <ThemedText style={styles.labelInput}>Clave provisoria</ThemedText>
              <TextInput
                value={passwordProvisoriaCliente}
                onChangeText={setPasswordProvisoriaCliente}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={textSecondary}
                style={[styles.input, { borderColor: border, color: tint }]}
              />

              <Pressable
                onPress={handleCrearCliente}
                disabled={crearClienteMutation.isPending}
                style={({ pressed }) => [
                  styles.botonModalSubmit,
                  { backgroundColor: '#0891b2' },
                  pressed && styles.botonPresionado,
                ]}>
                {crearClienteMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    Guardar Cliente con Clave Provisoria
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
  resumenContainer: {
    flexDirection: 'row',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metricaCard: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  metricaTitulo: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricaNumero: {
    fontSize: 18,
    marginTop: 2,
  },
  barraAcciones: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
  },
  botonAccionTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  botonPresionado: {
    opacity: 0.75,
  },
  bannerSimulacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pestanasContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
  },
  pestana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pestanaTexto: {
    fontSize: 13,
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tarjetaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  tarjetaViajeActivo: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  cajaCodigoCliente: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelCodigoCliente: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  codigoClienteTexto: {
    fontSize: 20,
    color: '#0284c7',
    letterSpacing: 1,
  },
  badgeSimulando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  puntoPulsante: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
  },
  textoSimulando: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  filaChoferCamion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patenteBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  patenteTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  itinerarioCaja: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  filaItinerario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filaTelemetria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  filaAccionesTarjeta: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  botonVerMapa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
  },
  botonFinalizarViaje: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#dc262615',
  },
  filtrosContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filtroChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filtroChipTexto: {
    fontSize: 12,
  },
  tarjetaCamion: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  filaCamionEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeOperativo: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOperativoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoCamion: {
    gap: 2,
  },
  modeloTexto: {
    fontSize: 15,
  },
  detallesFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalleLabel: {
    fontSize: 12,
  },
  detalleSeparador: {
    fontSize: 12,
  },
  tarjetaChoferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarChoferMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContenido: {
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  modalDescripcion: {
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  mensajeAlerta: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
  },
  labelInput: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  chipSelector: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Spacing.one,
    borderWidth: 1,
    marginRight: 6,
  },
  rutaItemCard: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    gap: 2,
  },
  checkFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  botonModalSubmit: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
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
  },
  botonRegresar: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  labelPequeno: {
    fontSize: 10,
    fontWeight: '700',
  },
});
