FROM node:20-alpine

# Installer git et docker CLI
RUN apk add --no-cache git docker-cli docker-cli-compose

WORKDIR /app

# Copier les fichiers du service webhook
COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./

# Note: Ce service doit s'exécuter en root pour accéder au socket Docker
# L'accès au socket Docker (/var/run/docker.sock) nécessite des privilèges élevés

EXPOSE 9000

CMD ["npm", "start"]
