# Etapa 1: Build (Construcción)
FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor (Nginx) para evitar el 403
FROM nginx:stable-alpine
# Copiamos la web generada arriba a Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos la configuración de Nginx para manejar rutas de React
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
