# Guide de Déploiement - Image Recognition Annotation

Ce guide explique comment déployer l'application sur votre serveur Ubuntu avec Docker/Portainer et configurer le déploiement automatique depuis GitHub.

## Prérequis

### Sur votre serveur Ubuntu :
- Docker et Docker Compose installés
- Git installé
- Un nom de domaine configuré pointant vers votre serveur
- Ports 80 et 443 ouverts (HTTP/HTTPS)
- Note : Le webhook est accessible via Nginx reverse proxy, pas besoin d'ouvrir le port 9001

### Sur votre machine locale :
- Accès Git au repository
- Compte GitHub avec accès au repository

## Architecture de déploiement

```
Internet
    ↓
[Nginx Reverse Proxy] (Port 80/443)
    ├─→ [Frontend] (Vue.js + Vite) → Port 80 interne
    ├─→ [Backend] (Express.js) → Port 3000 interne
    └─→ [Webhook Service] → Port 9000
         ↓
    [PostgreSQL] (Port 5432 interne)
```

## Étape 1 : Préparation du serveur

### 1.1 Cloner le repository

```bash
cd /opt  # ou le répertoire de votre choix
git clone https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
cd VOTRE-REPO
```

### 1.2 Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

**Variables importantes à configurer :**

```env
# Database
DB_NAME=image_annotation
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE  # ⚠️ Changez ceci !

# JWT
JWT_SECRET=VOTRE_SECRET_JWT_SECURISE  # ⚠️ Changez ceci !
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://votre-domaine.com
VITE_API_BASE_URL=https://votre-domaine.com/api

# Webhook
WEBHOOK_SECRET=VOTRE_SECRET_WEBHOOK  # ⚠️ Générez un secret fort !
GITHUB_BRANCH=main

# SSL
DOMAIN=votre-domaine.com
EMAIL=votre-email@example.com
```

**Générer des secrets sécurisés :**

```bash
# Pour JWT_SECRET et WEBHOOK_SECRET
openssl rand -hex 32
```

### 1.3 Vérifier la configuration DNS

Assurez-vous que votre domaine pointe vers l'IP de votre serveur :

```bash
# Vérifier l'IP du serveur
curl ifconfig.me

# Vérifier la résolution DNS
dig +short votre-domaine.com
```

Les deux commandes doivent retourner la même IP.

## Étape 2 : Premier déploiement

### 2.1 Rendre les scripts exécutables

```bash
chmod +x scripts/*.sh
```

### 2.2 Lancer le déploiement initial

```bash
./scripts/deploy.sh
```

Ce script va :
- ✅ Vérifier les prérequis (Docker, Git, etc.)
- ✅ Créer les répertoires nécessaires
- ✅ Build les images Docker
- ✅ Démarrer les services (sans SSL)

### 2.3 Vérifier que tout fonctionne

```bash
# Voir l'état des services
docker-compose ps

# Voir les logs
./scripts/logs.sh

# Tester l'API
curl http://localhost/api/health
```

À ce stade, l'application devrait être accessible en HTTP sur `http://votre-ip`

## Étape 3 : Configuration SSL (HTTPS)

### 3.1 Initialiser Let's Encrypt

```bash
./scripts/init-ssl.sh
```

Ce script va :
- ✅ Vérifier que votre domaine pointe vers le serveur
- ✅ Demander un certificat SSL à Let's Encrypt
- ✅ Configurer Nginx pour HTTPS
- ✅ Redémarrer les services

### 3.2 Vérifier HTTPS

```bash
# Tester HTTPS
curl https://votre-domaine.com/api/health

# Vérifier le certificat
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
```

## Étape 4 : Configuration du Webhook GitHub

### 4.1 Récupérer votre WEBHOOK_SECRET

```bash
grep WEBHOOK_SECRET .env
```

### 4.2 Configurer le webhook sur GitHub

1. Allez sur votre repository GitHub
2. **Settings** → **Webhooks** → **Add webhook**
3. Configurez :
   - **Payload URL** : `https://votre-domaine.com/webhook`
   - **Content type** : `application/json`
   - **Secret** : Le WEBHOOK_SECRET de votre .env
   - **Events** : Sélectionnez "Just the push event"
   - **Active** : ✅ Coché

4. Cliquez sur **Add webhook**

### 4.3 Tester le webhook

Faites un commit et push sur la branche `main` :

```bash
# Sur votre machine locale
git commit --allow-empty -m "Test webhook"
git push origin main
```

Vérifiez les logs du webhook sur le serveur :

```bash
./scripts/logs.sh webhook
```

Vous devriez voir :
```
📨 Webhook reçu de GitHub
✓ Push sur main détecté - déclenchement du redéploiement
🚀 Début du redéploiement...
✅ Redéploiement terminé avec succès !
```

## Étape 5 : Initialisation de la base de données

Si vous avez des scripts SQL d'initialisation :

```bash
# Copier vos scripts SQL dans le dossier scripts/
# Puis exécuter :
docker-compose exec -T postgres psql -U postgres -d image_annotation < scripts/votre-script.sql
```

Ou utiliser une connexion interactive :

```bash
docker-compose exec postgres psql -U postgres -d image_annotation
```

## Utilisation quotidienne

### Voir les logs

```bash
# Tous les services
./scripts/logs.sh

# Un service spécifique
./scripts/logs.sh backend
./scripts/logs.sh frontend
./scripts/logs.sh webhook
./scripts/logs.sh postgres
```

### Mise à jour manuelle

Si vous voulez déployer manuellement :

```bash
./scripts/update.sh
```

### Sauvegarder la base de données

```bash
./scripts/backup-db.sh
```

Les backups sont stockés dans `backups/` et compressés automatiquement.

### Restaurer une sauvegarde

```bash
# Décompresser le backup
gunzip backups/db-backup-YYYYMMDD-HHMMSS.sql.gz

# Restaurer
docker-compose exec -T postgres psql -U postgres -d image_annotation < backups/db-backup-YYYYMMDD-HHMMSS.sql
```

### Redémarrer les services

```bash
# Tous les services
docker-compose restart

# Un service spécifique
docker-compose restart backend
```

### Arrêter l'application

```bash
docker-compose down
```

### Arrêter ET supprimer les volumes (⚠️ ATTENTION : perte de données)

```bash
docker-compose down -v
```

## Gestion avec Portainer

Si vous utilisez Portainer :

1. Accédez à Portainer (généralement `http://votre-ip:9000`)
2. Sélectionnez votre environnement local
3. Allez dans **Stacks**
4. Vous verrez votre stack `imagerecogitionannotation`
5. Vous pouvez :
   - Voir les logs des containers
   - Redémarrer des services
   - Voir les métriques de ressources
   - Accéder aux consoles des containers

## Maintenance

### Renouvellement SSL automatique

Le certificat SSL est renouvelé automatiquement par Certbot tous les 12h. Vérifiez les logs :

```bash
docker-compose logs certbot
```

### Nettoyer les images Docker inutilisées

```bash
docker system prune -a
```

### Mettre à jour Docker et Docker Compose

```bash
# Ubuntu
sudo apt update
sudo apt upgrade docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

## Dépannage

### Erreur 'ContainerConfig' lors du démarrage

Si vous obtenez l'erreur `KeyError: 'ContainerConfig'` lors du démarrage :

```bash
# Solution : nettoyer et reconstruire le service webhook
./scripts/clean-webhook.sh

# Ou manuellement :
docker-compose down
docker rm -f image-annotation-webhook
docker rmi imagerecogitionannotation-webhook
docker-compose build --no-cache webhook
docker-compose up -d
```

Cette erreur se produit quand l'image Docker est dans un état incohérent après des modifications du Dockerfile.

### Le webhook ne fonctionne pas

```bash
# Vérifier que le service webhook tourne
docker-compose ps webhook

# Vérifier les logs
./scripts/logs.sh webhook

# Tester manuellement
curl -X POST https://votre-domaine.com/webhook
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
docker-compose ps postgres

# Voir les logs
./scripts/logs.sh postgres

# Se connecter manuellement
docker-compose exec postgres psql -U postgres -d image_annotation
```

### Erreur 502 Bad Gateway

Cela signifie généralement que le backend ne répond pas :

```bash
# Vérifier le backend
docker-compose ps backend
./scripts/logs.sh backend

# Redémarrer le backend
docker-compose restart backend
```

### Problème de certificat SSL

```bash
# Renouveler manuellement
docker-compose run --rm certbot renew

# Voir les certificats disponibles
docker-compose run --rm certbot certificates
```

## Sécurité

### Recommandations

1. **Firewall** : Configurez UFW pour n'autoriser que les ports nécessaires
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **Secrets** : Ne commitez JAMAIS le fichier `.env` dans Git
   - Ajouté dans `.gitignore`

3. **Backups** : Configurez des backups réguliers
   ```bash
   # Ajouter dans crontab
   0 2 * * * /opt/votre-repo/scripts/backup-db.sh
   ```

4. **Mises à jour** : Gardez Docker et vos images à jour
   ```bash
   # Mettre à jour les images de base
   docker-compose pull
   docker-compose up -d
   ```

5. **Monitoring** : Utilisez Portainer pour surveiller les ressources

## Support

Pour des problèmes spécifiques :
1. Vérifiez les logs avec `./scripts/logs.sh`
2. Consultez la documentation Docker Compose
3. Vérifiez les issues GitHub du projet
