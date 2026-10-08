import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { env } from '@/config/env';
import { Fonts, Spacing, StatusColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBackendStatus, type BackendStatus } from '@/hooks/use-backend-status';
import { useThemeColor } from '@/hooks/use-theme-color';

const ESTADOS: Record<BackendStatus, { color: string; etiqueta: string }> = {
  verificando: { color: StatusColors.pending, etiqueta: 'Verificando…' },
  conectado: { color: StatusColors.ok, etiqueta: 'Conectado' },
  'sin-conexion': { color: StatusColors.error, etiqueta: 'Sin conexión' },
};

export default function InicioScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();
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

        {usuario ? (
          <View style={[styles.tarjetaUsuario, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.filaUsuario}>
              <View style={[styles.avatarChico, { backgroundColor: tint }]}>
                <ThemedText style={{ color: background, fontWeight: 'bold', fontSize: 16 }}>
                  {usuario.nombreCompleto.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.infoUsuarioTexto}>
                <ThemedText type="defaultSemiBold">{usuario.nombreCompleto}</ThemedText>
                <ThemedText style={{ color: textSecondary, fontSize: 13 }}>{usuario.email}</ThemedText>
              </View>
              <View style={[styles.badgeMini, { backgroundColor: tint + '22' }]}>
                <ThemedText style={[styles.badgeMiniTexto, { color: tint }]}>
                  {usuario.rol}
                </ThemedText>
              </View>
            </View>

            <View style={styles.filaAccionesUsuario}>
              <Pressable
                onPress={() => router.push('/(tabs)/mapa')}
                style={({ pressed }) => [
                  styles.botonUsuario,
                  { backgroundColor: tint },
                  pressed && styles.botonPresionado,
                ]}>
                <ThemedText style={{ color: background, fontWeight: '600', fontSize: 13 }}>
                  Ver flota
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  styles.botonUsuario,
                  { borderColor: border, borderWidth: StyleSheet.hairlineWidth },
                  pressed && styles.botonPresionado,
                ]}>
                <ThemedText style={{ fontSize: 13 }}>Salir</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
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
        )}

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
  tarjetaUsuario: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  filaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarChico: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoUsuarioTexto: {
    flex: 1,
    gap: 2,
  },
  badgeMini: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeMiniTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  filaAccionesUsuario: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botonUsuario: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
