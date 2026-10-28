import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function BotonVolverHeader({ tintColor }: { tintColor?: string }) {
  const router = useRouter();
  const color = tintColor || '#0284c7';

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.botonVolver}>
      <MaterialIcons name="arrow-back-ios" size={18} color={color} />
      <ThemedText style={[styles.textoVolver, { color }]}>Volver</ThemedText>
    </Pressable>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? '#38bdf8' : '#0284c7';
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 4000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerBackTitle: 'Volver',
              headerTintColor: tint,
              headerLeft: (props) => <BotonVolverHeader tintColor={props.tintColor} />,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
            <Stack.Screen name="admin/flota" options={{ title: 'Gestión de Flota' }} />
            <Stack.Screen name="cliente/seguimiento" options={{ title: 'Seguimiento de Envío' }} />
            <Stack.Screen name="chofer/ruta" options={{ title: 'Mi Ruta Asignada' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  textoVolver: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: -2,
  },
});
