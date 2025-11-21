# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Arguments de build pour les variables d'environnement
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build l'application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier la build depuis le stage précédent
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
