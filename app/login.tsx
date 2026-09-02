import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, StatusColors } from '@/constants/theme';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [verPassword, setVerPassword] = useState(false);
  const [validado, setValidado] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  function manejarIngreso() {
    const nuevos = validar(email, password);
    setErrores(nuevos);
    setValidado(Object.keys(nuevos).length === 0);
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
            <Subtitulo>Ingresá con tu cuenta para seguir tus envíos.</Subtitulo>
          </View>

          <View style={styles.formulario}>
            <Campo
              etiqueta="Correo electrónico"
              valor={email}
              onChange={(texto) => {
                setEmail(texto);
                setValidado(false);
              }}
              error={errores.email}
              placeholder="nombre@empresa.com"
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
                setValidado(false);
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

            <BotonPrimario onPress={manejarIngreso}>Ingresar</BotonPrimario>

            {validado && (
              <View style={styles.aviso}>
                <ThemedText style={styles.avisoTexto}>
                  Los datos son válidos, pero todavía no hay un servidor que verifique las
                  credenciales. La autenticación real se conecta cuando el backend exponga
                  el endpoint de login.
                </ThemedText>
              </View>
            )}
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

function BotonPrimario({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const fondo = useThemeColor({}, 'background');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: tint },
        pressed && styles.botonPresionado,
      ]}>
      <ThemedText type="defaultSemiBold" style={{ color: fondo }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
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
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  botonPresionado: {
    opacity: 0.7,
  },
  aviso: {
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: StatusColors.pending,
    padding: Spacing.three,
  },
  avisoTexto: {
    fontSize: 14,
  },
});
