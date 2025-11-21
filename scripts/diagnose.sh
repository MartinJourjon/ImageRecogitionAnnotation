#!/bin/bash

# Script de diagnostic complet pour identifier les problèmes de déploiement

echo "=========================================="
echo "🔍 DIAGNOSTIC COMPLET DU DÉPLOIEMENT"
echo "=========================================="
echo ""

# Charger le domaine depuis .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DOMAIN=${DOMAIN:-"votre-domaine.com"}

echo "📋 Domaine testé : $DOMAIN"
echo ""

# 1. Services Docker
echo "=========================================="
echo "1️⃣  SERVICES DOCKER"
echo "=========================================="
docker-compose ps
echo ""

# 2. Ports en écoute
echo "=========================================="
echo "2️⃣  PORTS EN ÉCOUTE"
echo "=========================================="
sudo netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|5432|9001)' || sudo ss -tlnp | grep -E ':(80|443|3000|5432|9001)'
echo ""

# 3. Fichiers de configuration Nginx
echo "=========================================="
echo "3️⃣  FICHIERS NGINX"
echo "=========================================="
echo "Contenu de nginx/conf.d/ :"
ls -la nginx/conf.d/
echo ""
echo "Fichiers dans le container Nginx :"
docker-compose exec nginx ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "❌ Container nginx non accessible"
echo ""

# 4. Test de la configuration Nginx
echo "=========================================="
echo "4️⃣  VALIDATION CONFIG NGINX"
echo "=========================================="
docker-compose exec nginx nginx -t 2>&1 || echo "❌ Erreur de configuration Nginx"
echo ""

# 5. Tests de connectivité depuis le serveur
echo "=========================================="
echo "5️⃣  TESTS DE CONNECTIVITÉ (depuis le serveur)"
echo "=========================================="

echo "Test 1 : http://localhost"
curl -I http://localhost 2>&1 | head -5
echo ""

echo "Test 2 : http://127.0.0.1"
curl -I http://127.0.0.1 2>&1 | head -5
echo ""

echo "Test 3 : http://$(hostname -I | awk '{print $1}')"
curl -I http://$(hostname -I | awk '{print $1}') 2>&1 | head -5
echo ""

echo "Test 4 : http://$DOMAIN"
curl -I http://$DOMAIN 2>&1 | head -5
echo ""

# 6. Test de résolution DNS
echo "=========================================="
echo "6️⃣  RÉSOLUTION DNS"
echo "=========================================="
echo "IP du serveur :"
curl -s ifconfig.me
echo ""
echo "Résolution DNS de $DOMAIN :"
dig +short $DOMAIN
echo ""
nslookup $DOMAIN | grep -A2 "Name:"
echo ""

# 7. Tests des services internes
echo "=========================================="
echo "7️⃣  TESTS DES SERVICES INTERNES"
echo "=========================================="

echo "Test Frontend (direct) :"
curl -I http://localhost 2>&1 | head -3
echo ""

echo "Test API Backend :"
curl -s http://localhost/api/health 2>&1 || echo "❌ API non accessible"
echo ""

echo "Test Webhook :"
curl -I http://localhost/webhook 2>&1 | head -3
echo ""

# 8. Logs des services
echo "=========================================="
echo "8️⃣  LOGS DES SERVICES (20 dernières lignes)"
echo "=========================================="

echo "--- Logs Nginx ---"
docker-compose logs --tail=20 nginx
echo ""

echo "--- Logs Frontend ---"
docker-compose logs --tail=10 frontend
echo ""

echo "--- Logs Backend ---"
docker-compose logs --tail=10 backend
echo ""

# 9. Vérifier les variables d'environnement
echo "=========================================="
echo "9️⃣  VARIABLES D'ENVIRONNEMENT"
echo "=========================================="
echo "DOMAIN=$DOMAIN"
echo "FRONTEND_URL=$FRONTEND_URL"
echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"
echo ""

# 10. Test détaillé avec curl verbose
echo "=========================================="
echo "🔟 TEST DÉTAILLÉ AVEC VERBOSE"
echo "=========================================="
echo "curl -v http://$DOMAIN"
curl -v http://$DOMAIN 2>&1 | head -30
echo ""

# 11. Vérifier les processus Nginx
echo "=========================================="
echo "1️⃣1️⃣  PROCESSUS NGINX"
echo "=========================================="
docker-compose exec nginx ps aux 2>/dev/null || echo "❌ Container nginx non accessible"
echo ""

# Résumé et recommandations
echo "=========================================="
echo "📊 RÉSUMÉ ET RECOMMANDATIONS"
echo "=========================================="

# Vérifier si app.conf existe
if [ -f "nginx/conf.d/app.conf" ]; then
    echo "⚠️  PROBLÈME DÉTECTÉ !"
    echo "   Le fichier nginx/conf.d/app.conf existe."
    echo "   Ce fichier nécessite SSL qui n'est pas encore configuré."
    echo ""
    echo "   SOLUTION :"
    echo "   mv nginx/conf.d/app.conf nginx/conf.d/app.conf.disabled"
    echo "   docker-compose restart nginx"
    echo ""
fi

# Vérifier si nginx tourne
if ! docker-compose ps nginx | grep -q "Up"; then
    echo "❌ Le container Nginx n'est pas actif !"
    echo "   Relancez avec : docker-compose up -d nginx"
    echo ""
fi

# Vérifier la résolution DNS
SERVER_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short $DOMAIN | tail -n1)
if [ "$SERVER_IP" != "$DNS_IP" ]; then
    echo "⚠️  DNS ne pointe pas vers ce serveur !"
    echo "   IP serveur : $SERVER_IP"
    echo "   IP DNS     : $DNS_IP"
    echo ""
fi

echo "=========================================="
echo "✅ Diagnostic terminé !"
echo "=========================================="
echo ""
echo "💡 Prochaines étapes :"
echo "   1. Regardez les erreurs ci-dessus"
echo "   2. Vérifiez particulièrement les logs Nginx"
echo "   3. Si app.conf existe, suivez la solution indiquée"
echo ""
