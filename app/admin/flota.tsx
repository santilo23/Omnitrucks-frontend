import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { obtenerFlotaAdmin, obtenerResumenFlotaAdmin } from '@/api/admin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { CamionFlotaResponse, EstadoOperativoCamion, FiltroFlota } from '@/types';

const FILTROS: { key: FiltroFlota; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'ACTIVOS', label: 'Activos' },
  { key: 'INACTIVOS', label: 'Inactivos' },
];

export default function AdminFlotaScreen() {
  const router = useRouter();
  const { usuario, isLoading: isAuthLoading } = useAuth();
  const [filtro, setFiltro] = useState<FiltroFlota>('TODOS');

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  // Consulta de métricas del panel
  const {
    data: resumen,
    isLoading: isResumenLoading,
    refetch: refetchResumen,
  } = useQuery({
    queryKey: ['admin-flota-resumen'],
    queryFn: obtenerResumenFlotaAdmin,
    enabled: usuario?.rol === 'ADMIN',
  });

  // Consulta de la flota filtrada
  const {
    data: camiones = [],
    isLoading: isCamionesLoading,
    isRefetching,
    refetch: refetchCamiones,
  } = useQuery({
    queryKey: ['admin-flota', filtro],
    queryFn: () => obtenerFlotaAdmin(filtro),
    enabled: usuario?.rol === 'ADMIN',
  });

  const onRefresh = async () => {
    await Promise.all([refetchResumen(), refetchCamiones()]);
  };

  if (isAuthLoading) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // Control de Acceso RBAC: Restringido únicamente a administradores
  if (!usuario || usuario.rol !== 'ADMIN') {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <View style={[styles.tarjetaAlerta, { backgroundColor: card, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.textoCentro}>
            Acceso Denegado
          </ThemedText>
          <ThemedText style={[styles.descripcion, { color: textSecondary }]}>
            El Panel de Administración de Flota es exclusivo para usuarios con rol ADMINISTRADOR.
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

  const renderCamionItem = ({ item }: { item: CamionFlotaResponse }) => (
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
            Año: <ThemedText style={styles.detalleValor}>{item.anio ?? 'N/D'}</ThemedText>
          </ThemedText>
          <ThemedText style={[styles.detalleSeparador, { color: textSecondary }]}>•</ThemedText>
          <ThemedText style={[styles.detalleLabel, { color: textSecondary }]}>
            Capacidad:{' '}
            <ThemedText style={styles.detalleValor}>
              {item.capacidadKg ? `${item.capacidadKg.toLocaleString()} kg` : 'N/D'}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Resumen de Flota en Cabecera */}
      <View style={styles.resumenContainer}>
        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: textSecondary }]}>TOTAL</ThemedText>
          <ThemedText type="title" style={styles.metricaNumero}>
            {isResumenLoading ? '…' : (resumen?.total ?? 0)}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#15803d' }]}>DISPONIBLES</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#15803d' }]}>
            {isResumenLoading ? '…' : (resumen?.disponibles ?? 0)}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#1d4ed8' }]}>EN TRÁNSITO</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#1d4ed8' }]}>
            {isResumenLoading ? '…' : (resumen?.enTransito ?? 0)}
          </ThemedText>
        </View>

        <View style={[styles.metricaCard, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.metricaTitulo, { color: '#ef4444' }]}>INACTIVOS</ThemedText>
          <ThemedText type="title" style={[styles.metricaNumero, { color: '#ef4444' }]}>
            {isResumenLoading ? '…' : (resumen?.inactivos ?? 0)}
          </ThemedText>
        </View>
      </View>

      {/* Selector de Filtros */}
      <View style={styles.filtrosContainer}>
        {FILTROS.map((f) => {
          const activo = filtro === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFiltro(f.key)}
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
                {f.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Listado de Camiones */}
      {isCamionesLoading ? (
        <View style={[styles.container, styles.centrado]}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      ) : (
        <FlatList
          data={camiones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCamionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={tint} />
          }
          ListEmptyComponent={
            <View style={styles.centradoVacio}>
              <ThemedText style={{ color: textSecondary }}>
                No se encontraron camiones registrados para el criterio seleccionado.
              </ThemedText>
            </View>
          }
        />
      )}
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
  centradoVacio: {
    padding: Spacing.five,
    alignItems: 'center',
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
  resumenContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  metricaCard: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  metricaTitulo: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricaNumero: {
    fontSize: 18,
    marginTop: 2,
  },
  filtrosContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  filtroChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
  },
  filtroChipTexto: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  tarjetaCamion: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  filaCamionEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patenteBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  patenteTexto: {
    color: '#f8fafc',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 14,
  },
  badgeOperativo: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOperativoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoCamion: {
    gap: 4,
  },
  modeloTexto: {
    fontSize: 16,
  },
  detallesFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  detalleLabel: {
    fontSize: 13,
  },
  detalleValor: {
    fontWeight: '600',
  },
  detalleSeparador: {
    fontSize: 12,
  },
  botonPresionado: {
    opacity: 0.7,
  },
});
