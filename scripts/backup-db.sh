#!/bin/bash

# Script de sauvegarde de la base de données

set -e

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Fichier .env introuvable !"
    exit 1
fi

# Créer le dossier de backup s'il n'existe pas
mkdir -p backups

# Nom du fichier de backup avec timestamp
BACKUP_FILE="backups/db-backup-$(date +%Y%m%d-%H%M%S).sql"

echo "💾 Sauvegarde de la base de données..."
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Compresser le backup
gzip "$BACKUP_FILE"

echo "✅ Sauvegarde créée: ${BACKUP_FILE}.gz"

# Garder seulement les 30 dernières sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
ls -t backups/db-backup-*.sql.gz | tail -n +31 | xargs -r rm

echo "✅ Sauvegarde terminée !"
