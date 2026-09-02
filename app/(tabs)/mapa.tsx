import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Pantalla del mapa con los camiones en curso.
 * Por ahora es un marcador de posición: se implementa en la etapa del mapa,
 * una vez que el backend exponga las posiciones de los viajes activos.
 */
export default function MapaScreen() {
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contenido}>
          <ThemedText type="subtitle">Mapa</ThemedText>
          <ThemedText style={[styles.texto, { color: textSecondary }]}>
            Acá van a verse los camiones en curso.
          </ThemedText>
        </View>
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
  },
  contenido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  texto: {
    textAlign: 'center',
  },
});
