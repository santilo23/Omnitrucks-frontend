# ==============================================================================
# ETAPA 1: BUILD (Compilación estática de React Native / Expo Web)
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# 1. Copiar manifiestos de dependencias
COPY package*.json ./
RUN npm install

# 2. Copiar código fuente
COPY . .

# 3. Exportar bundle estático para Web
ARG EXPO_PUBLIC_API_URL=http://localhost:8080
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
RUN npx expo export --platform web

# ==============================================================================
# ETAPA 2: RUNTIME (Servidor Nginx Alpine ultraligero y seguro)
# ==============================================================================
FROM nginx:alpine AS runtime

# Actualizar paquetes de Alpine a las versiones con parches de seguridad más recientes
RUN apk update && apk upgrade --no-cache

# Copiar bundle web generado en la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración Nginx para Single Page Application (SPA / Expo Router)
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
