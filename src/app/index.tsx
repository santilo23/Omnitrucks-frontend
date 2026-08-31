import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { env } from '@/config/env';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBackendStatus, type BackendStatus } from '@/hooks/use-backend-status';

const ESTADOS: Record<BackendStatus, { color: string; etiqueta: string }> = {
  verificando: { color: '#B0B4BA', etiqueta: 'Verificando…' },
  conectado: { color: '#2E9E5B', etiqueta: 'Conectado' },
  'sin-conexion': { color: '#D93F3F', etiqueta: 'Sin conexión' },
};

export default function InicioScreen() {
  const { status, verificar } = useBackendStatus();
  const estado = ESTADOS[status];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title" style={styles.titulo}>
            OmniTrucks
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitulo}>
            Seguimiento de flota en tiempo real
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.tarjeta}>
          <View style={styles.filaEstado}>
            <ThemedText type="smallBold">Backend</ThemedText>
            <View style={styles.estado}>
              <View style={[styles.punto, { backgroundColor: estado.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {estado.etiqueta}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="code" themeColor="textSecondary">
            {env.apiUrl}
          </ThemedText>

          <Pressable
            onPress={verificar}
            disabled={status === 'verificando'}
            style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}>
            <ThemedText type="smallBold">Reintentar</ThemedText>
          </Pressable>
        </ThemedView>

        {status === 'sin-conexion' && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.ayuda}>
            Revisá que el backend esté levantado, que la IP del archivo .env sea la de tu
            computadora y que el teléfono esté en la misma red WiFi.
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
  titulo: {
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
  },
  tarjeta: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  boton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8E8E93',
  },
  botonPresionado: {
    opacity: 0.6,
  },
  ayuda: {
    textAlign: 'center',
  },
});
