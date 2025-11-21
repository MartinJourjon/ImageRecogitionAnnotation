FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Changer les permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

# Exposer le port 3000
EXPOSE 3000

CMD ["npm", "start"]
