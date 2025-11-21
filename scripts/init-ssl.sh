#!/bin/bash

# Script d'initialisation SSL avec Let's Encrypt
# Ce script doit être exécuté UNE SEULE FOIS lors du premier déploiement

set -e

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Fichier .env introuvable !"
    exit 1
fi

# Vérifier que DOMAIN et EMAIL sont définis
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ DOMAIN et EMAIL doivent être définis dans .env"
    exit 1
fi

echo "🔐 Initialisation SSL pour $DOMAIN"
echo "📧 Email: $EMAIL"
echo ""

# Vérifier que le domaine pointe bien vers le serveur
echo "🔍 Vérification DNS..."
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  ATTENTION: Le domaine $DOMAIN ($DOMAIN_IP) ne pointe pas vers cette machine ($CURRENT_IP)"
    echo "Voulez-vous continuer quand même ? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Renommer app.conf temporairement
echo "📝 Configuration temporaire de Nginx..."
if [ -f nginx/conf.d/app.conf ]; then
    mv nginx/conf.d/app.conf nginx/conf.d/app.conf.backup
fi

# S'assurer que app-initial.conf est actif
if [ ! -f nginx/conf.d/app-initial.conf ]; then
    echo "❌ nginx/conf.d/app-initial.conf introuvable !"
    exit 1
fi

# 2. Démarrer nginx et certbot
echo "🚀 Démarrage des services..."
docker-compose up -d nginx certbot

# 3. Attendre que nginx soit prêt
echo "⏳ Attente du démarrage de nginx..."
sleep 5

# 4. Obtenir le certificat SSL
echo "📜 Demande du certificat SSL..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# 5. Vérifier que le certificat a été créé
if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
    echo "❌ Échec de la création du certificat SSL"
    exit 1
fi

echo "✅ Certificat SSL créé avec succès !"

# 6. Remplacer DOMAIN dans app.conf
echo "📝 Configuration de Nginx avec SSL..."
if [ -f nginx/conf.d/app.conf.backup ]; then
    sed "s/DOMAIN/$DOMAIN/g" nginx/conf.d/app.conf.backup > nginx/conf.d/app.conf
    rm nginx/conf.d/app-initial.conf
else
    echo "❌ app.conf.backup introuvable !"
    exit 1
fi

# 7. Redémarrer nginx avec la nouvelle configuration
echo "🔄 Redémarrage de nginx avec SSL..."
docker-compose restart nginx

echo ""
echo "✅ Configuration SSL terminée !"
echo "🌐 Votre site est maintenant accessible en HTTPS sur https://$DOMAIN"
