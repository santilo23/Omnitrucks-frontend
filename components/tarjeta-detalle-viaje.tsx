import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, StatusColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { UbicacionActivaResponse, ViajeResponse } from '@/types';

interface TarjetaDetalleViajeProps {
  ubicacion: UbicacionActivaResponse;
  viaje: ViajeResponse | null;
  puntosRecorridos: number;
  onCerrar: () => void;
  onCentrar: () => void;
}

export function TarjetaDetalleViaje({
  ubicacion,
  viaje,
  puntosRecorridos,
  onCerrar,
  onCentrar,
}: TarjetaDetalleViajeProps) {
  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');

  const { patente, estado, posicion } = ubicacion;
  const enCurso = estado === 'EN_CURSO';

  return (
    <View style={[styles.contenedor, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Cabecera con datos del camión y botón cerrar */}
      <View style={styles.cabecera}>
        <View style={styles.filaCamion}>
          <View style={styles.iconoCamion}>
            <MaterialIcons name="local-shipping" size={20} color={tint} />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.patente}>
              {patente} {viaje ? `• ${viaje.camion.marca} ${viaje.camion.modelo}` : ''}
            </ThemedText>
            <View style={styles.filaEstado}>
              <View
                style={[
                  styles.puntoEstado,
                  { backgroundColor: enCurso ? StatusColors.ok : '#E0A800' },
                ]}
              />
              <ThemedText style={[styles.textoEstado, { color: textSecondary }]}>
                {enCurso ? 'En curso' : 'Pausado'} • {posicion.velocidadKmh?.toFixed(0) ?? 0} km/h
              </ThemedText>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onCerrar}
          accessibilityLabel="Cerrar detalle"
          style={({ pressed }) => [styles.botonCerrar, pressed && styles.presionado]}>
          <MaterialIcons name="close" size={20} color={textSecondary} />
        </Pressable>
      </View>

      {/* Origen y Destino */}
      <View style={styles.recorridoFila}>
        <View style={styles.indicadorRuta}>
          <View style={[styles.puntoRuta, { backgroundColor: '#16A34A' }]} />
          <View style={[styles.lineaRuta, { backgroundColor: border }]} />
          <View style={[styles.puntoRuta, { backgroundColor: '#DC2626' }]} />
        </View>
        <View style={styles.textosRuta}>
          <ThemedText style={styles.puntoNombre}>
            {viaje?.origen.nombre ?? 'Origen'}
          </ThemedText>
          <ThemedText style={styles.puntoNombre}>
            {viaje?.destino.nombre ?? ubicacion.destinoNombre}
          </ThemedText>
        </View>
      </View>

      {/* Métricas e información adicional */}
      <View style={[styles.gridMetricas, { borderColor: border }]}>
        <View style={styles.metrica}>
          <ThemedText style={[styles.metricaLabel, { color: textSecondary }]}>Chofer</ThemedText>
          <ThemedText style={styles.metricaValor}>
            {viaje?.chofer.nombreCompleto ?? 'Asignado'}
          </ThemedText>
        </View>

        <View style={styles.metrica}>
          <ThemedText style={[styles.metricaLabel, { color: textSecondary }]}>Puntos traza</ThemedText>
          <ThemedText style={styles.metricaValor}>
            {puntosRecorridos} reportados
          </ThemedText>
        </View>

        <View style={styles.metrica}>
          <ThemedText style={[styles.metricaLabel, { color: textSecondary }]}>Rumbo</ThemedText>
          <ThemedText style={styles.metricaValor}>
            {posicion.rumboGrados?.toFixed(0) ?? '—'}°
          </ThemedText>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.acciones}>
        <Pressable
          onPress={onCentrar}
          style={({ pressed }) => [
            styles.botonCentrar,
            { backgroundColor: tint },
            pressed && styles.presionado,
          ]}>
          <MaterialIcons name="my-location" size={16} color="#FFFFFF" />
          <ThemedText style={styles.textoBotonCentrar}>Centrar en camión</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    gap: Spacing.two,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaCamion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconoCamion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patente: {
    fontSize: 15,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoEstado: {
    fontSize: 12,
  },
  botonCerrar: {
    padding: 6,
    borderRadius: 16,
  },
  presionado: {
    opacity: 0.7,
  },
  recorridoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  indicadorRuta: {
    alignItems: 'center',
    width: 14,
  },
  puntoRuta: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lineaRuta: {
    width: 2,
    height: 16,
    marginVertical: 2,
  },
  textosRuta: {
    flex: 1,
    justifyContent: 'space-between',
    height: 42,
  },
  puntoNombre: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    marginTop: 2,
  },
  metrica: {
    flex: 1,
    alignItems: 'center',
  },
  metricaLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricaValor: {
    fontSize: 12,
    fontWeight: '700',
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  botonCentrar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  textoBotonCentrar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
