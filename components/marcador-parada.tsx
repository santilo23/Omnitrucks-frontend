import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { PuntoGeografico } from '@/types';

interface MarcadorParadaProps {
  punto: PuntoGeografico;
  tipo: 'origen' | 'destino';
}

export const MarcadorParada = React.memo(function MarcadorParada({
  punto,
  tipo,
}: MarcadorParadaProps) {
  const esOrigen = tipo === 'origen';
  const colorFondo = esOrigen ? '#16A34A' : '#DC2626';
  const iconoNombre = esOrigen ? 'trip-origin' : 'flag';
  const etiqueta = esOrigen ? 'Origen' : 'Destino';

  return (
    <Marker
      coordinate={{
        latitude: punto.latitud,
        longitude: punto.longitud,
      }}
      title={`${etiqueta}: ${punto.nombre}`}
      anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.contenedor}>
        <View style={[styles.circulo, { backgroundColor: colorFondo }]}>
          <MaterialIcons name={iconoNombre} size={16} color="#FFFFFF" />
        </View>
        <View style={styles.etiqueta}>
          <ThemedText style={styles.textoEtiqueta}>{punto.nombre}</ThemedText>
        </View>
      </View>

      <Callout tooltip style={styles.calloutContainer}>
        <View style={styles.calloutContent}>
          <ThemedText type="defaultSemiBold" style={{ color: colorFondo, fontSize: 13 }}>
            {etiqueta}
          </ThemedText>
          <ThemedText style={styles.calloutTexto}>{punto.nombre}</ThemedText>
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
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  etiqueta: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  textoEtiqueta: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  calloutContainer: {
    width: 160,
  },
  calloutContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: Spacing.two,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calloutTexto: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
});
