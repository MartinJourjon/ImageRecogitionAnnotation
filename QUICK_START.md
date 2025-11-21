# Déploiement Rapide

Guide de démarrage rapide pour déployer l'application sur votre serveur Ubuntu.

## Résumé en 5 étapes

```bash
# 1. Cloner le repo
git clone https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
cd VOTRE-REPO

# 2. Configurer l'environnement
cp .env.example .env
nano .env  # Éditez avec vos valeurs

# 3. Déployer
chmod +x scripts/*.sh
./scripts/deploy.sh

# 4. Configurer SSL
./scripts/init-ssl.sh

# 5. Configurer le webhook GitHub
# Voir DEPLOYMENT.md section "Configuration du Webhook GitHub"
```

## Variables essentielles à configurer dans .env

```env
DB_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=votre_secret_jwt_securise
WEBHOOK_SECRET=votre_secret_webhook_securise
DOMAIN=votre-domaine.com
EMAIL=votre-email@example.com
FRONTEND_URL=https://votre-domaine.com
VITE_API_BASE_URL=https://votre-domaine.com/api
```

## Commandes utiles

```bash
# Voir les logs
./scripts/logs.sh

# Mise à jour manuelle
./scripts/update.sh

# Backup de la base de données
./scripts/backup-db.sh

# Redémarrer un service
docker-compose restart backend

# Voir l'état des services
docker-compose ps
```

## Flux de déploiement automatique

```
┌─────────────────┐
│   Git Push      │
│   sur main      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Webhook  │
│  déclenché      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook Service │
│ sur le serveur  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Git Pull +     │
│  Docker Rebuild │
│  + Restart      │
└─────────────────┘
```

## URLs importantes

- **Application** : https://votre-domaine.com
- **API** : https://votre-domaine.com/api
- **Health Check** : https://votre-domaine.com/api/health
- **Webhook** : https://votre-domaine.com/webhook (pour GitHub)

## Documentation complète

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet avec troubleshooting.
