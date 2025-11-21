FROM node:20-alpine

# Installer git et docker CLI
RUN apk add --no-cache git docker-cli docker-cli-compose

WORKDIR /app

# Copier les fichiers du service webhook
COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./

# Créer un utilisateur non-root mais membre du groupe docker
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G docker

USER nodejs

EXPOSE 9000

CMD ["npm", "start"]
