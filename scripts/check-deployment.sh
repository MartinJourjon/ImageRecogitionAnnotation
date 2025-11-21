#!/bin/bash

# Script de vérification du déploiement

echo "🔍 Vérification du déploiement"
echo "=============================="
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Fichier .env introuvable !"
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    echo "⚠️  Variable DOMAIN non définie dans .env"
    echo "Entrez votre domaine :"
    read DOMAIN
fi

echo "📋 Domaine testé : $DOMAIN"
echo ""

# 1. Vérifier l'IP du serveur
echo "1️⃣  IP du serveur"
SERVER_IP=$(curl -s ifconfig.me)
echo "   IP publique du serveur : $SERVER_IP"
echo ""

# 2. Vérifier la résolution DNS
echo "2️⃣  Résolution DNS"
DNS_IP=$(dig +short $DOMAIN | tail -n1)
if [ -z "$DNS_IP" ]; then
    echo "   ❌ Le domaine $DOMAIN ne résout vers aucune IP"
else
    echo "   IP du domaine : $DNS_IP"
    if [ "$SERVER_IP" == "$DNS_IP" ]; then
        echo "   ✅ DNS correctement configuré !"
    else
        echo "   ❌ Le domaine pointe vers $DNS_IP mais le serveur est sur $SERVER_IP"
        echo "   ⚠️  Attendez la propagation DNS (peut prendre jusqu'à 48h)"
    fi
fi
echo ""

# 3. Vérifier les services Docker
echo "3️⃣  Services Docker"
docker-compose ps --services --filter "status=running" | while read service; do
    echo "   ✅ $service"
done
echo ""

# 4. Vérifier le port 80 (HTTP)
echo "4️⃣  Test du port 80 (HTTP)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$DOMAIN 2>/dev/null)
if [ "$HTTP_STATUS" == "301" ] || [ "$HTTP_STATUS" == "200" ]; then
    echo "   ✅ Port 80 accessible (Status: $HTTP_STATUS)"
else
    echo "   ❌ Port 80 non accessible (Status: $HTTP_STATUS)"
    echo "   ⚠️  Vérifiez le port forwarding sur votre box"
fi
echo ""

# 5. Vérifier le port 443 (HTTPS)
echo "5️⃣  Test du port 443 (HTTPS)"
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN 2>/dev/null)
    if [ "$HTTPS_STATUS" == "200" ]; then
        echo "   ✅ HTTPS accessible (Status: $HTTPS_STATUS)"
    else
        echo "   ❌ HTTPS non accessible (Status: $HTTPS_STATUS)"
    fi

    # Vérifier le certificat SSL
    echo ""
    echo "6️⃣  Certificat SSL"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in certbot/conf/live/$DOMAIN/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        echo "   ✅ Certificat SSL présent"
        echo "   📅 Expire le : $CERT_EXPIRY"
    else
        echo "   ❌ Erreur lors de la lecture du certificat"
    fi
else
    echo "   ⚠️  Certificat SSL non configuré"
    echo "   💡 Exécutez : ./scripts/init-ssl.sh"
fi
echo ""

# 7. Vérifier l'API
echo "7️⃣  Test de l'API"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost/api/health 2>/dev/null)
if [ "$API_STATUS" == "200" ]; then
    echo "   ✅ API accessible (Status: $API_STATUS)"
else
    echo "   ❌ API non accessible (Status: $API_STATUS)"
fi
echo ""

# 8. Vérifier le webhook
echo "8️⃣  Test du webhook"
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost/webhook 2>/dev/null)
if [ "$WEBHOOK_STATUS" == "401" ] || [ "$WEBHOOK_STATUS" == "200" ]; then
    echo "   ✅ Webhook accessible (Status: $WEBHOOK_STATUS - normal sans signature)"
else
    echo "   ❌ Webhook non accessible (Status: $WEBHOOK_STATUS)"
fi
echo ""

# Résumé
echo "=============================="
echo "📊 Résumé"
echo "=============================="
if [ "$SERVER_IP" == "$DNS_IP" ] && [ "$HTTP_STATUS" == "301" -o "$HTTP_STATUS" == "200" ]; then
    echo "✅ Votre déploiement est opérationnel !"
    echo ""
    echo "🌐 URLs :"
    echo "   - Application : https://$DOMAIN"
    echo "   - API : https://$DOMAIN/api/health"
    echo "   - Webhook : https://$DOMAIN/webhook"
    echo ""
    echo "📝 Prochaines étapes :"
    echo "   1. Configurez le webhook GitHub avec l'URL : https://$DOMAIN/webhook"
    echo "   2. Testez un push sur la branche main"
else
    echo "⚠️  Il reste des problèmes à résoudre :"
    [ "$SERVER_IP" != "$DNS_IP" ] && echo "   - Configurez le DNS pour pointer vers $SERVER_IP"
    [ "$HTTP_STATUS" != "301" -a "$HTTP_STATUS" != "200" ] && echo "   - Ouvrez les ports 80/443 sur votre box"
fi
echo ""
