import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MapaFlota } from '@/components/mapa-flota/index';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Pantalla de mapa de OmniTrucks.
 * REGLA DE NEGOCIO: Requiere autenticación obligatoria para visualizar cualquier dato de la flota.
 */
export default function MapaScreen() {
  const router = useRouter();
  const { usuario, isLoading } = useAuth();

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // Si no hay sesión iniciada, bloquea la vista del mapa y exige login
  if (!usuario) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <View style={[styles.tarjetaBloqueo, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.iconoContenedor, { backgroundColor: tint + '22' }]}>
            <IconSymbol size={36} name="lock.fill" color={tint} />
          </View>

          <ThemedText type="subtitle" style={styles.textoCentro}>
            Inicio de sesión obligatorio
          </ThemedText>

          <ThemedText style={[styles.descripcion, { color: textSecondary }]}>
            Para visualizar el mapa y realizar el seguimiento en tiempo real de los envíos,
            debes iniciar sesión con tu cuenta.
          </ThemedText>

          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.boton,
              { backgroundColor: tint },
              pressed && styles.botonPresionado,
            ]}>
            <ThemedText type="defaultSemiBold" style={{ color: background }}>
              Iniciar sesión
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // Usuario autenticado: renderiza el mapa en vivo
  return <MapaFlota />;
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
  tarjetaBloqueo: {
    width: '100%',
    maxWidth: 380,
    padding: Spacing.five,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconoContenedor: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  textoCentro: {
    textAlign: 'center',
  },
  descripcion: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  boton: {
    marginTop: Spacing.two,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 48,
  },
  botonPresionado: {
    opacity: 0.7,
  },
});
