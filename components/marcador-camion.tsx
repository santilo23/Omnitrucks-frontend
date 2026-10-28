import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { StatusColors } from '@/constants/theme';
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

  // Manejo de tracksViewChanges en iOS para evitar que los marcadores personalizados desaparezcan al re-renderizar
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [posicion.latitud, posicion.longitud, rotation, colorEstado]);

  return (
    <Marker
      coordinate={{
        latitude: posicion.latitud,
        longitude: posicion.longitud,
      }}
      title={`Camión ${patente}`}
      description={`Destino: ${destinoNombre} | ${posicion.velocidadKmh?.toFixed(0) ?? 0} km/h`}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
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
});
