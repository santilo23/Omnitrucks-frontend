# OmniTrucks — App móvil

Aplicación móvil de **OmniTrucks**, el sistema de seguimiento en tiempo real de camiones que trasladan mercadería entre provincias.

Construida con React Native y Expo. Se prueba en iOS a través de **Expo Go**.

La API que consume esta app vive en un repositorio separado: [Omnitrucks-backend](https://github.com/santilo23/Omnitrucks-backend) (Java + Spring Boot).

---

## ¿Qué hace?

Según quién inicie sesión, la app muestra una experiencia distinta:

| Rol | Qué ve |
|---|---|
| `ADMIN` | La flota completa y todos los viajes en curso sobre el mapa. |
| `CHOFER` | Su viaje asignado, con la opción de iniciarlo y transmitir su ubicación. |
| `CLIENTE` | El seguimiento en el mapa de los envíos que le corresponden. |

La pantalla principal es un mapa con la posición de cada camión activo, que se actualiza sola mientras el viaje está en curso.

---

## Stack

| Componente | Tecnología |
|---|---|
| Framework | React Native 0.86 con Expo SDK 57 |
| Lenguaje | TypeScript |
| Navegación | Expo Router (basada en archivos) |
| Estado del servidor | TanStack Query (React Query) |
| Cliente HTTP | Axios |
| Mapas | react-native-maps (Apple Maps en iOS) |
| Ubicación | expo-location |
| Almacenamiento seguro | expo-secure-store |

---

## Requisitos previos

- **Node.js 20 o superior** — verificar con `node --version`
- **Expo Go** instalado en el iPhone (App Store)
- El **backend corriendo** y accesible desde el teléfono
- La computadora y el teléfono **conectados a la misma red WiFi**

---

## Cómo levantar el proyecto

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar la dirección del backend**

Copiar `.env.example` a `.env` y poner la IP de la computadora en la red local:

```
EXPO_PUBLIC_API_URL=http://192.168.0.15:8080
```

Para averiguar esa IP en Windows:

```bash
ipconfig
```

Buscar el valor de *Dirección IPv4* del adaptador WiFi.

**3. Arrancar el servidor de desarrollo**

```bash
npx expo start
```

**4. Abrir la app**

Escanear el código QR con la cámara del iPhone. Se abre en Expo Go.

---

## ⚠️ El backend no responde desde el teléfono

Es el problema más frecuente al configurar el entorno por primera vez. `localhost` **no funciona**: desde el iPhone apunta al propio teléfono, no a la computadora. Repasar estos cuatro puntos:

1. **Usar la IP de red local**, no `localhost` ni `127.0.0.1`.
2. **El backend tiene que escuchar en toda la red.** En `application-dev.yaml`, `server.address` debe ser `0.0.0.0`.
3. **El Firewall de Windows tiene que permitir el puerto 8080** en redes privadas. Suele ser la causa real cuando todo lo demás parece correcto.
4. **CORS habilitado en el backend** para el origen del servidor de desarrollo de Expo.

Para verificar rápido si el teléfono llega al backend, abrir `http://TU_IP:8080/actuator/health` en Safari desde el iPhone. Si eso no responde, el problema es de red, no de la app.

---

## Estructura del proyecto

```
src/
├── app/             Pantallas (rutas de Expo Router, basadas en archivos)
│   ├── _layout.tsx  Layout raíz: tema y navegación por pestañas
│   ├── index.tsx    Inicio
│   └── mapa.tsx     Mapa de los camiones en curso
├── api/             Cliente Axios e interceptores; una función por endpoint
├── components/      Componentes reutilizables
├── config/          Lectura de las variables de entorno
├── constants/       Tema: colores, espaciados y tipografías
├── context/         Contexto de autenticación
├── hooks/           Hooks de datos y de seguimiento en vivo
└── types/           Interfaces TypeScript espejo de los DTOs del backend
```

El alias `@/` apunta a `src/`, así que los imports se escriben `@/components/themed-text`
en lugar de rutas relativas.

---

## Convenciones del proyecto

- **Los datos del servidor se manejan con React Query**, no con `useEffect` + `useState`. El refresco periódico del mapa sale del `refetchInterval`.
- **El token JWT se guarda en `expo-secure-store`**, nunca en AsyncStorage: es una credencial.
- **Los tipos de `src/types/` reflejan exactamente los DTOs del backend.** Si cambia un contrato de la API, se actualizan acá primero.
- **La URL del backend nunca se escribe a mano en el código.** Se lee siempre de la configuración.

---

## Limitaciones de Expo Go

Expo Go alcanza para casi todo el desarrollo, pero hay funcionalidades que requieren un *development build* generado con EAS:

| Funcionalidad | ¿Anda en Expo Go? |
|---|---|
| Mapas (`react-native-maps`) | Sí |
| Ubicación en primer plano | Sí |
| Ubicación en segundo plano | No — requiere development build |
| Notificaciones push | No — requiere development build |

Por eso el modo chofer se implementa primero en primer plano (con la app abierta) y el seguimiento en segundo plano queda para más adelante, junto con el build de EAS.

---

## Roadmap

- [x] Proyecto Expo funcionando en el dispositivo con Expo Go
- [ ] Pantalla de login
- [ ] Listado de camiones y viajes desde la API
- [ ] Mapa con seguimiento en vivo
- [ ] Detalle de viaje con recorrido y datos del envío
- [ ] Modo chofer: transmisión de la ubicación real
- [ ] Actualización en tiempo real por WebSocket
- [ ] Notificaciones y build de producción con EAS

---

## Autor

Santiago — Universidad de Mendoza
