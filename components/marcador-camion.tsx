import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, StatusColors } from '@/constants/theme';
import type { UbicacionActivaResponse } from '@/types';

interface MarcadorCamionProps {
  ubicacion: UbicacionActivaResponse;
  onPress?: () => void;
}

export const MarcadorCamion = React.memo(function MarcadorCamion({
  ubicacion,
  onPress,
}: MarcadorCamionProps) {
  const { posicion, patente, estado, destinoNombre } = ubicacion;
  const enCurso = estado === 'EN_CURSO';
  const colorEstado = enCurso ? StatusColors.ok : '#E0A800';

  const rotation = posicion.rumboGrados ?? 0;

  return (
    <Marker
      coordinate={{
        latitude: posicion.latitud,
        longitude: posicion.longitud,
      }}
      title={`Camión ${patente}`}
      description={`Destino: ${destinoNombre} | ${posicion.velocidadKmh?.toFixed(0) ?? 0} km/h`}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}>
      {/* Vista personalizada del marcador */}
      <View style={styles.contenedor}>
        <View style={[styles.badge, { backgroundColor: colorEstado }]}>
          <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
            <MaterialIcons name="navigation" size={18} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.etiquetaPatente}>
          <ThemedText style={styles.textoPatente}>{patente}</ThemedText>
        </View>
      </View>

      {/* Tarjeta emergente con detalle al tocar el camión */}
      <Callout tooltip style={styles.calloutContainer}>
        <View style={styles.calloutContent}>
          <ThemedText type="defaultSemiBold" style={styles.calloutTitulo}>
            Camión {patente}
          </ThemedText>
          <ThemedText style={styles.calloutTexto}>
            Estado: {enCurso ? 'En curso' : 'Pausado'}
          </ThemedText>
          <ThemedText style={styles.calloutTexto}>
            Destino: {destinoNombre}
          </ThemedText>
          <ThemedText style={styles.calloutTexto}>
            Velocidad: {posicion.velocidadKmh?.toFixed(1) ?? '0'} km/h
          </ThemedText>
          {posicion.rumboGrados != null && (
            <ThemedText style={styles.calloutTexto}>
              Rumbo: {posicion.rumboGrados.toFixed(0)}°
            </ThemedText>
          )}
        </View>
      </Callout>
    </Marker>
  );
});

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  etiquetaPatente: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  textoPatente: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  calloutContainer: {
    width: 200,
  },
  calloutContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calloutTitulo: {
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 4,
  },
  calloutTexto: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
});
