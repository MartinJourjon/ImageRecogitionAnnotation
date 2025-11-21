#!/bin/bash

# Script pour nettoyer et reconstruire le service webhook

echo "🧹 Nettoyage du service webhook..."

# Arrêter tous les services
echo "Arrêt des services..."
docker-compose down

# Supprimer le container webhook s'il existe
echo "Suppression du container webhook..."
docker rm -f image-annotation-webhook 2>/dev/null || echo "Container déjà supprimé"

# Supprimer l'image webhook
echo "Suppression de l'image webhook..."
docker rmi imagerecogitionannotation-webhook 2>/dev/null || echo "Image déjà supprimée"

# Rebuild l'image webhook
echo "Rebuild de l'image webhook..."
docker-compose build --no-cache webhook

# Redémarrer tous les services
echo "Redémarrage des services..."
docker-compose up -d

echo ""
echo "✅ Nettoyage terminé !"
docker-compose ps
