import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

/**
 * Pantalla del mapa con los camiones en curso.
 * Por ahora es un marcador de posición: se implementa en la etapa del mapa,
 * una vez que el backend exponga las posiciones de los viajes activos.
 */
export default function MapaScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.texto}>
          Mapa
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.texto}>
          Acá van a verse los camiones en curso.
        </ThemedText>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  texto: {
    textAlign: 'center',
  },
});
