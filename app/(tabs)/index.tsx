import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { env } from '@/config/env';
import { Fonts, Spacing, StatusColors } from '@/constants/theme';
import { useBackendStatus, type BackendStatus } from '@/hooks/use-backend-status';
import { useThemeColor } from '@/hooks/use-theme-color';

const ESTADOS: Record<BackendStatus, { color: string; etiqueta: string }> = {
  verificando: { color: StatusColors.pending, etiqueta: 'Verificando…' },
  conectado: { color: StatusColors.ok, etiqueta: 'Conectado' },
  'sin-conexion': { color: StatusColors.error, etiqueta: 'Sin conexión' },
};

export default function InicioScreen() {
  const router = useRouter();
  const { status, verificar } = useBackendStatus();
  const estado = ESTADOS[status];

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.titulo}>
            OmniTrucks
          </ThemedText>
          <ThemedText style={[styles.subtitulo, { color: textSecondary }]}>
            Seguimiento de flota en tiempo real
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push('/login')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.botonPrimario,
            { backgroundColor: tint },
            pressed && styles.botonPresionado,
          ]}>
          <ThemedText type="defaultSemiBold" style={{ color: background }}>
            Iniciar sesión
          </ThemedText>
        </Pressable>

        <View style={[styles.tarjeta, { backgroundColor: card }]}>
          <View style={styles.filaEstado}>
            <ThemedText type="defaultSemiBold">Backend</ThemedText>
            <View style={styles.estado}>
              <View style={[styles.punto, { backgroundColor: estado.color }]} />
              <ThemedText style={{ color: textSecondary }}>{estado.etiqueta}</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.url, { color: textSecondary }]}>{env.apiUrl}</ThemedText>

          <Pressable
            onPress={verificar}
            disabled={status === 'verificando'}
            style={({ pressed }) => [
              styles.boton,
              { borderColor: border },
              pressed && styles.botonPresionado,
            ]}>
            <ThemedText type="defaultSemiBold">Reintentar</ThemedText>
          </Pressable>
        </View>

        {status === 'sin-conexion' && (
          <ThemedText style={[styles.ayuda, { color: textSecondary }]}>
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
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
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
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
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
  url: {
    fontFamily: Fonts?.mono,
    fontSize: 13,
  },
  boton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  botonPrimario: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  botonPresionado: {
    opacity: 0.6,
  },
  ayuda: {
    textAlign: 'center',
    fontSize: 14,
  },
});
