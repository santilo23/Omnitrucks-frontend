import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { isAxiosError } from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, StatusColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

type Errores = {
  email?: string;
  password?: string;
};

function validar(email: string, password: string): Errores {
  const errores: Errores = {};

  if (!email.trim()) {
    errores.email = 'Ingresá tu correo.';
  } else if (!EMAIL_RE.test(email.trim())) {
    errores.email = 'El correo no tiene un formato válido.';
  }

  if (!password) {
    errores.password = 'Ingresá tu contraseña.';
  } else if (password.length < PASSWORD_MIN) {
    errores.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  }

  return errores;
}

export default function LoginScreen() {
  const router = useRouter();
  const { usuario, login, logout, cambiarPassword, isLoading: cargandoSesion } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Formulario Cambio de Contraseña (obligatorio si debeCambiarPassword = true)
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargandoCambio, setCargandoCambio] = useState(false);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);
  const [exitoCambio, setExitoCambio] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

  async function manejarIngreso() {
    const nuevos = validar(email, password);
    setErrores(nuevos);
    setErrorServidor(null);

    if (Object.keys(nuevos).length > 0) {
      return;
    }

    setCargando(true);
    try {
      const usuarioLogueado = await login({ email: email.trim(), password });
      setPasswordActual(password);

      if (usuarioLogueado.debeCambiarPassword) {
        // Permanece en login para forzar el cambio de clave provisoria
        return;
      }

      if (usuarioLogueado.rol === 'CLIENTE') {
        router.replace('/cliente/seguimiento' as any);
      } else if (usuarioLogueado.rol === 'CHOFER') {
        router.replace('/chofer/ruta' as any);
      } else {
        router.replace('/(tabs)/mapa');
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorServidor('Correo o contraseña incorrectos.');
        } else if (err.response?.status === 403) {
          setErrorServidor('Esta cuenta se encuentra inactiva. Contactá al administrador.');
        } else if (!err.response) {
          setErrorServidor('No se pudo conectar al servidor. Verificá la red y el estado del backend.');
        } else {
          setErrorServidor(err.response?.data?.detail || 'Ocurrió un error al intentar iniciar sesión.');
        }
      } else {
        setErrorServidor('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  async function manejarCambioPassword() {
    setErrorCambio(null);
    setExitoCambio(null);

    if (!passwordActual) {
      setErrorCambio('Ingresá tu contraseña actual / provisoria.');
      return;
    }
    if (!nuevaPassword || nuevaPassword.length < PASSWORD_MIN) {
      setErrorCambio(`La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorCambio('Las nuevas contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword === passwordActual) {
      setErrorCambio('La nueva contraseña no puede ser idéntica a la provisoria.');
      return;
    }

    setCargandoCambio(true);
    try {
      await cambiarPassword(passwordActual, nuevaPassword);
      setExitoCambio('¡Contraseña actualizada con éxito! Redirigiendo...');
      setTimeout(() => {
        if (usuario?.rol === 'CLIENTE') {
          router.replace('/cliente/seguimiento' as any);
        } else if (usuario?.rol === 'CHOFER') {
          router.replace('/chofer/ruta' as any);
        } else {
          router.replace('/(tabs)/mapa');
        }
      }, 1200);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorCambio('La contraseña actual es incorrecta.');
        } else {
          setErrorCambio(err.response?.data?.detail || 'No se pudo actualizar la contraseña.');
        }
      } else {
        setErrorCambio('Ocurrió un error inesperado al actualizar la contraseña.');
      }
    } finally {
      setCargandoCambio(false);
    }
  }

  function rellenarCredenciales(nuevoEmail: string, nuevoPass: string) {
    setEmail(nuevoEmail);
    setPassword(nuevoPass);
    setErrores({});
    setErrorServidor(null);
  }

  if (cargandoSesion) {
    return (
      <ThemedView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  // Si el usuario tiene sesión activa pero DEBE cambiar su clave provisoria
  if (usuario && usuario.debeCambiarPassword) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.encabezado}>
            <ThemedText type="title">Actualizar Contraseña</ThemedText>
            <Subtitulo>
              Has iniciado sesión con una clave provisoria asignada por el administrador. Por seguridad, debés definir tu nueva clave antes de acceder.
            </Subtitulo>
          </View>

          <View style={[styles.alertaProvisoria, { borderColor: '#d97706', backgroundColor: '#d9770618' }]}>
            <IconSymbol size={22} name="lock.fill" color="#d97706" />
            <ThemedText style={{ color: '#d97706', flex: 1, fontSize: 13, fontWeight: '600' }}>
              Clave provisoria detectada para {usuario.email}. Este paso es obligatorio.
            </ThemedText>
          </View>

          {errorCambio && (
            <View style={styles.errorBanner}>
              <IconSymbol size={20} name="exclamationmark.circle.fill" color={StatusColors.error} />
              <ThemedText style={styles.errorBannerTexto}>{errorCambio}</ThemedText>
            </View>
          )}

          {exitoCambio && (
            <View style={[styles.errorBanner, { backgroundColor: '#22c55e1a', borderColor: '#22c55e' }]}>
              <IconSymbol size={20} name="checkmark.circle.fill" color="#22c55e" />
              <ThemedText style={[styles.errorBannerTexto, { color: '#15803d' }]}>{exitoCambio}</ThemedText>
            </View>
          )}

          <View style={styles.formulario}>
            <Campo
              etiqueta="Contraseña provisoria / actual"
              valor={passwordActual}
              onChange={(texto) => {
                setPasswordActual(texto);
                setErrorCambio(null);
              }}
              placeholder="••••••"
              secureTextEntry
              autoCapitalize="none"
            />

            <Campo
              etiqueta="Nueva contraseña definitiva"
              valor={nuevaPassword}
              onChange={(texto) => {
                setNuevaPassword(texto);
                setErrorCambio(null);
              }}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
            />

            <Campo
              etiqueta="Confirmar nueva contraseña"
              valor={confirmarPassword}
              onChange={(texto) => {
                setConfirmarPassword(texto);
                setErrorCambio(null);
              }}
              placeholder="Repetí tu nueva contraseña"
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              onPress={manejarCambioPassword}
              disabled={cargandoCambio}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: '#0891b2' },
                (pressed || cargandoCambio) && styles.botonPresionado,
              ]}>
              {cargandoCambio ? (
                <ActivityIndicator color={background} />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
                  Guardar Nueva Contraseña
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={logout}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boton,
                styles.botonSecundario,
                { borderColor: border },
                pressed && styles.botonPresionado,
              ]}>
              <ThemedText type="defaultSemiBold">Cancelar y Cerrar sesión</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Si el usuario ya tiene sesión activa y clave permanente
  if (usuario) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.sesionActivaContenedor}>
          <View style={[styles.tarjetaSesion, { backgroundColor: card, borderColor: border }]}>
            <View style={[styles.avatar, { backgroundColor: tint }]}>
              <ThemedText style={{ color: background, fontSize: 24, fontWeight: 'bold' }}>
                {usuario.nombreCompleto.charAt(0).toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.infoUsuario}>
              <ThemedText type="subtitle">{usuario.nombreCompleto}</ThemedText>
              <ThemedText style={{ color: textSecondary }}>{usuario.email}</ThemedText>
              <View style={[styles.badgeRol, { backgroundColor: tint + '22' }]}>
                <ThemedText style={[styles.badgeRolTexto, { color: tint }]}>
                  ROL: {usuario.rol}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.accionesSesion}>
            {usuario.rol === 'CLIENTE' && (
              <Pressable
                onPress={() => router.replace('/cliente/seguimiento' as any)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.boton,
                  { backgroundColor: '#0284c7' },
                  pressed && styles.botonPresionado,
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: background }}>
                  Ir a Mis Envíos y Seguimiento
                </ThemedText>
              </Pressable>
            )}

            {usuario.rol === 'CHOFER' && (
              <Pressable
                onPress={() => router.replace('/chofer/ruta' as any)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.boton,
                  { backgroundColor: '#059669' },
                  pressed && styles.botonPresionado,
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: background }}>
                  Ir a Mi Ruta Asignada
                </ThemedText>
              </Pressable>
            )}

            {usuario.rol === 'ADMIN' && (
              <Pressable
                onPress={() => router.replace('/admin/flota' as any)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.boton,
                  { backgroundColor: '#7c3aed' },
                  pressed && styles.botonPresionado,
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: background }}>
                  Ir al Panel de Flota y Operaciones
                </ThemedText>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.replace('/(tabs)/mapa')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: tint },
                pressed && styles.botonPresionado,
              ]}>
              <ThemedText type="defaultSemiBold" style={{ color: background }}>
                Ir al mapa en vivo
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={logout}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boton,
                styles.botonSecundario,
                { borderColor: border },
                pressed && styles.botonPresionado,
              ]}>
              <ThemedText type="defaultSemiBold">Cerrar sesión</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.encabezado}>
            <ThemedText type="title">Iniciar sesión</ThemedText>
            <Subtitulo>Ingresá con tu cuenta para acceder a la flota y viajes.</Subtitulo>
          </View>

          {/* Chips de prueba rápida para desarrollo */}
          <View style={styles.contenedorChips}>
            <ThemedText style={[styles.chipsTitulo, { color: textSecondary }]}>
              Credenciales de prueba:
            </ThemedText>
            <View style={styles.filaChips}>
              <Pressable
                onPress={() => rellenarCredenciales('chofer@omnitrucks.com', 'chofer123')}
                style={[styles.chip, { borderColor: border }]}>
                <ThemedText style={styles.chipTexto}>Chofer (Juan Pérez)</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => rellenarCredenciales('admin@omnitrucks.com', 'admin123')}
                style={[styles.chip, { borderColor: border }]}>
                <ThemedText style={styles.chipTexto}>Admin (Martín)</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => rellenarCredenciales('cliente@omnitrucks.com', 'cliente123')}
                style={[styles.chip, { borderColor: border }]}>
                <ThemedText style={styles.chipTexto}>Cliente (Acme S.A.)</ThemedText>
              </Pressable>
            </View>
          </View>

          {errorServidor && (
            <View style={styles.errorBanner}>
              <IconSymbol size={20} name="exclamationmark.circle.fill" color={StatusColors.error} />
              <ThemedText style={styles.errorBannerTexto}>{errorServidor}</ThemedText>
            </View>
          )}

          <View style={styles.formulario}>
            <Campo
              etiqueta="Correo electrónico"
              valor={email}
              onChange={(texto) => {
                setEmail(texto);
                setErrorServidor(null);
              }}
              error={errores.email}
              placeholder="chofer@omnitrucks.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Campo
              ref={passwordRef}
              etiqueta="Contraseña"
              valor={password}
              onChange={(texto) => {
                setPassword(texto);
                setErrorServidor(null);
              }}
              error={errores.password}
              placeholder="••••••"
              secureTextEntry={!verPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={manejarIngreso}
              accesorio={
                <Pressable
                  onPress={() => setVerPassword((v) => !v)}
                  hitSlop={Spacing.two}
                  accessibilityRole="button"
                  accessibilityLabel={
                    verPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'
                  }>
                  <IconoOjo visible={verPassword} />
                </Pressable>
              }
            />

            <Pressable
              onPress={manejarIngreso}
              disabled={cargando}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: tint },
                (pressed || cargando) && styles.botonPresionado,
              ]}>
              {cargando ? (
                <ActivityIndicator color={background} />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: background }}>
                  Ingresar
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  const color = useThemeColor({}, 'textSecondary');
  return <ThemedText style={{ color }}>{children}</ThemedText>;
}

function IconoOjo({ visible }: { visible: boolean }) {
  const color = useThemeColor({}, 'textSecondary');
  return <IconSymbol size={22} name={visible ? 'eye.slash.fill' : 'eye.fill'} color={color} />;
}

type CampoProps = Omit<React.ComponentProps<typeof TextInput>, 'onChange' | 'value'> & {
  etiqueta: string;
  valor: string;
  onChange: (texto: string) => void;
  error?: string;
  accesorio?: React.ReactNode;
  ref?: React.Ref<TextInput>;
};

const Campo = ({ ref, etiqueta, valor, onChange, error, accesorio, ...rest }: CampoProps) => {
  const texto = useThemeColor({}, 'text');
  const textoSecundario = useThemeColor({}, 'textSecondary');
  const borde = useThemeColor({}, 'border');
  const fondo = useThemeColor({}, 'card');

  return (
    <View style={styles.campo}>
      <ThemedText type="defaultSemiBold">{etiqueta}</ThemedText>

      <View
        style={[
          styles.entradaContenedor,
          { backgroundColor: fondo, borderColor: error ? StatusColors.error : borde },
        ]}>
        <TextInput
          ref={ref}
          value={valor}
          onChangeText={onChange}
          placeholderTextColor={textoSecundario}
          style={[styles.entrada, { color: texto }]}
          accessibilityLabel={etiqueta}
          {...rest}
        />
        {accesorio}
      </View>

      {error && (
        <ThemedText style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  encabezado: {
    gap: Spacing.two,
  },
  formulario: {
    gap: Spacing.four,
  },
  campo: {
    gap: Spacing.two,
  },
  entradaContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entrada: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: StatusColors.error,
    fontSize: 14,
  },
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 48,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#ff44441a',
    borderColor: StatusColors.error,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  errorBannerTexto: {
    flex: 1,
    color: StatusColors.error,
    fontSize: 14,
  },
  contenedorChips: {
    gap: Spacing.one,
  },
  chipsTitulo: {
    fontSize: 13,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipTexto: {
    fontSize: 13,
  },
  sesionActivaContenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  tarjetaSesion: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoUsuario: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  badgeRol: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 12,
  },
  badgeRolTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  accionesSesion: {
    gap: Spacing.three,
  },
  alertaProvisoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
