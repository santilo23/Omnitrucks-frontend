/**
 * Configuración leída de variables de entorno.
 *
 * Expo reemplaza las variables con prefijo `EXPO_PUBLIC_` en tiempo de build,
 * por eso hay que escribir `process.env.EXPO_PUBLIC_API_URL` completo y no se
 * puede acceder de forma dinámica.
 *
 * Después de editar el archivo `.env` hay que reiniciar el servidor de Expo
 * para que el cambio tome efecto.
 */

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  console.warn(
    'Falta EXPO_PUBLIC_API_URL. Copiá .env.example como .env y poné la IP de tu computadora.'
  );
}

export const env = {
  /** URL base del backend, sin barra final. */
  apiUrl: (apiUrl ?? 'http://localhost:8080').replace(/\/$/, ''),
};
