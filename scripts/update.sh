#!/bin/bash

# Script de mise à jour manuelle
# À exécuter pour mettre à jour l'application manuellement

set -e

echo "🔄 Mise à jour de l'application..."

# 1. Pull les dernières modifications
echo "📥 Git pull..."
git pull origin main

# 2. Rebuild les images
echo "🏗️  Rebuild des images..."
docker-compose build --no-cache

# 3. Redémarrer les services
echo "🔄 Redémarrage des services..."
docker-compose up -d --force-recreate

# 4. Nettoyer les images inutilisées
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo ""
echo "✅ Mise à jour terminée !"
docker-compose ps
