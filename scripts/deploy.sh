#!/bin/bash

# Script de déploiement initial
# À exécuter sur le serveur Ubuntu pour le premier déploiement

set -e

echo "🚀 Déploiement de Image Annotation Platform"
echo ""

# 1. Vérifier que les prérequis sont installés
echo "🔍 Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé !"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé !"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé !"
    exit 1
fi

echo "✅ Tous les prérequis sont installés"
echo ""

# 2. Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env introuvable !"
    echo "Copiez .env.example vers .env et configurez les variables"
    exit 1
fi

echo "✅ Fichier .env trouvé"
echo ""

# 3. Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# 4. Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p nginx/ssl
mkdir -p certbot/conf
mkdir -p certbot/www

# 5. Build et démarrage des services (sans SSL d'abord)
echo "🏗️  Build des images Docker..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d postgres backend frontend webhook

# 6. Attendre que la base de données soit prête
echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 10

# 7. Initialiser la base de données si nécessaire
echo "🗄️  Initialisation de la base de données..."
# Ajouter ici vos scripts d'initialisation de BDD si nécessaire
# docker-compose exec -T postgres psql -U $DB_USER -d $DB_NAME < ./scripts/init-db.sql

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez votre domaine pour pointer vers ce serveur"
echo "2. Exécutez './scripts/init-ssl.sh' pour configurer SSL/HTTPS"
echo "3. Configurez le webhook GitHub (voir DEPLOYMENT.md)"
echo ""
echo "🌐 L'application est accessible sur http://$(curl -s ifconfig.me)"
echo "   (HTTPS sera disponible après l'exécution de init-ssl.sh)"
