#!/bin/bash

# Script pour tester si le serveur est prêt pour SSL

echo "🔍 Test de préparation SSL"
echo "=============================="
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Fichier .env introuvable !"
    exit 1
fi

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ DOMAIN et EMAIL doivent être définis dans .env"
    exit 1
fi

echo "📋 Domaine : $DOMAIN"
echo "📧 Email   : $EMAIL"
echo ""

# 1. Vérifier DNS
echo "1️⃣  Vérification DNS"
echo "--------------------"
SERVER_IP=$(curl -4 -s ifconfig.me)
DNS_IP=$(dig +short $DOMAIN | tail -n1)

echo "IP serveur : $SERVER_IP"
echo "IP DNS     : $DNS_IP"

if [ "$SERVER_IP" != "$DNS_IP" ]; then
    echo "❌ Le DNS ne pointe pas vers ce serveur !"
    echo "   Attendez la propagation DNS (5-30 minutes)"
    exit 1
else
    echo "✅ DNS correctement configuré"
fi
echo ""

# 2. Tester l'accessibilité HTTP depuis le serveur
echo "2️⃣  Test HTTP local"
echo "--------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ HTTP local accessible (Code: $HTTP_CODE)"
else
    echo "❌ HTTP local non accessible (Code: $HTTP_CODE)"
    exit 1
fi
echo ""

# 3. Tester l'accessibilité depuis Internet (via le domaine)
echo "3️⃣  Test HTTP externe"
echo "--------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ HTTP externe accessible (Code: $HTTP_CODE)"
else
    echo "⚠️  HTTP externe retourne : $HTTP_CODE"
    echo "   Vérifiez le port forwarding sur votre box"
fi
echo ""

# 4. Tester le endpoint .well-known
echo "4️⃣  Test endpoint Let's Encrypt"
echo "--------------------------------"

# Créer un fichier de test
TEST_FILE="test-$(date +%s).txt"
mkdir -p certbot/www/.well-known/acme-challenge/
echo "test" > certbot/www/.well-known/acme-challenge/$TEST_FILE

# Tester l'accès
sleep 2
CHALLENGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/.well-known/acme-challenge/$TEST_FILE)

if [ "$CHALLENGE_CODE" == "200" ]; then
    echo "✅ Endpoint .well-known accessible (Code: $CHALLENGE_CODE)"
else
    echo "❌ Endpoint .well-known non accessible (Code: $CHALLENGE_CODE)"
    echo "   Let's Encrypt ne pourra pas valider votre domaine"

    # Vérifier la config nginx
    echo ""
    echo "Configuration Nginx pour .well-known :"
    docker-compose exec nginx cat /etc/nginx/conf.d/app-initial.conf | grep -A2 "well-known"
fi

# Nettoyer
rm -f certbot/www/.well-known/acme-challenge/$TEST_FILE
echo ""

# 5. Tester certbot en mode dry-run
echo "5️⃣  Test certbot (simulation)"
echo "-----------------------------"
echo "Lancement de certbot en mode test..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --dry-run \
    -d $DOMAIN

CERTBOT_EXIT=$?

echo ""
if [ $CERTBOT_EXIT -eq 0 ]; then
    echo "✅ Test certbot réussi !"
    echo ""
    echo "=============================="
    echo "✅ Votre serveur est prêt pour SSL !"
    echo "=============================="
    echo ""
    echo "Vous pouvez maintenant lancer :"
    echo "  ./scripts/init-ssl.sh"
else
    echo "❌ Test certbot échoué"
    echo ""
    echo "Vérifiez :"
    echo "  1. Le port 80 est ouvert sur votre box"
    echo "  2. Le DNS pointe bien vers votre serveur"
    echo "  3. Nginx tourne correctement"
    echo ""
    echo "Logs certbot :"
    docker-compose logs certbot | tail -20
fi
