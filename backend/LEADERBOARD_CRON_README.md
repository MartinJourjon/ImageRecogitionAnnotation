# Leaderboard Cron Job System

Ce système calcule et met en cache les statistiques du leaderboard automatiquement via un job cron.

## Architecture

### Table de cache : `annotator_stats`

Une table PostgreSQL qui stocke les statistiques précalculées pour chaque annotateur :

- `user_id` : ID de l'utilisateur
- `nickname` : Pseudo de l'annotateur
- `image_count` : Nombre d'images annotées (status='done')
- `xp` : Total XP
- `total_points` : Total points
- `total_annotations` : Nombre total d'annotations
- `level` : Niveau calculé (XP / 500 + 1)
- `rank` : Position dans le classement (1 = premier)
- `last_annotation_timestamp` : Date de la dernière annotation
- `last_refreshed` : Date du dernier refresh

### Fonction SQL : `refresh_annotator_stats()`

Fonction PostgreSQL qui :
1. Vide la table `annotator_stats`
2. Recalcule toutes les statistiques depuis `annotators` et `annotations`
3. Calcule les rangs (positions dans le classement)
4. Met à jour le timestamp `last_refreshed`

### Service Cron : `services/leaderboardCron.js`

Module Node.js qui :
- Lance un job cron périodique (par défaut : toutes les 5 minutes)
- Appelle la fonction `refresh_annotator_stats()` automatiquement
- Peut être déclenché manuellement via API
- Logue toutes les opérations avec durée d'exécution

## Installation

### 1. Installer les dépendances

```bash
cd backend
npm install
```

Cela installera `node-cron` qui est maintenant dans le `package.json`.

### 2. Créer la table et la fonction SQL

```bash
# Se connecter à PostgreSQL
psql -U postgres -d image_annotation

# Exécuter le script de migration
\i backend/migrations/create_annotator_stats.sql
```

Ou via un client PostgreSQL (pgAdmin, DBeaver, etc.) :
```sql
-- Copier/coller le contenu de backend/migrations/create_annotator_stats.sql
```

### 3. Configuration (optionnel)

Par défaut, le cron s'exécute toutes les 5 minutes. Pour changer la fréquence, ajoutez dans votre `.env` :

```bash
# Exemples de configuration cron :
# Toutes les 5 minutes (par défaut)
LEADERBOARD_CRON_SCHEDULE="*/5 * * * *"

# Toutes les heures
LEADERBOARD_CRON_SCHEDULE="0 * * * *"

# Toutes les 30 minutes
LEADERBOARD_CRON_SCHEDULE="*/30 * * * *"

# Tous les jours à minuit
LEADERBOARD_CRON_SCHEDULE="0 0 * * *"

# Toutes les 6 heures
LEADERBOARD_CRON_SCHEDULE="0 */6 * * *"
```

**Format cron** : `minute heure jour mois jour_semaine`

## Utilisation

### Démarrage automatique

Le cron démarre automatiquement au lancement du serveur Express :

```bash
cd backend
npm start
```

Vous verrez dans les logs :
```
[LEADERBOARD CRON] Initializing cron job with schedule: */5 * * * *
[LEADERBOARD CRON] Cron job started successfully
[LEADERBOARD CRON] Running initial stats refresh...
[LEADERBOARD CRON] Starting stats refresh...
[LEADERBOARD CRON] Stats refreshed successfully! X annotators processed in XXms
```

### Refresh manuel via API

Endpoint : `POST /api/annotators/stats/refresh`

```bash
# Avec curl (remplacez YOUR_TOKEN par votre JWT)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/annotators/stats/refresh
```

Réponse :
```json
{
  "success": true,
  "message": "Stats refreshed successfully",
  "count": 10,
  "duration": 42
}
```

### Endpoints utilisant le cache

Tous ces endpoints utilisent maintenant la table `annotator_stats` pour des performances optimales :

1. **GET /api/annotators/leaderboard?limit=10**
   - Top N annotateurs classés par rang
   - Retourne : `user_id`, `nickname`, `xp`, `level`, `rank`, `image_count`, etc.

2. **GET /api/annotators/stats**
   - Liste complète des statistiques
   - Retourne tous les annotateurs triés par rang

## Surveillance et diagnostic

### Vérifier l'état de la table

```sql
-- Voir les dernières stats
SELECT * FROM annotator_stats ORDER BY rank LIMIT 10;

-- Vérifier la date du dernier refresh
SELECT MAX(last_refreshed) FROM annotator_stats;

-- Compter les entrées
SELECT COUNT(*) FROM annotator_stats;
```

### Logs du cron

Le système logue automatiquement :
- Démarrage du cron
- Début de chaque refresh
- Nombre d'annotateurs traités
- Durée d'exécution
- Erreurs éventuelles

Exemple de logs :
```
[LEADERBOARD CRON] Starting stats refresh...
[LEADERBOARD CRON] Stats refreshed successfully! 25 annotators processed in 127ms
```

### Debug

Si le cron ne fonctionne pas :

1. **Vérifier que la table existe**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'annotator_stats';
   ```

2. **Tester la fonction manuellement**
   ```sql
   SELECT refresh_annotator_stats();
   ```

3. **Vérifier les logs du serveur**
   - Les erreurs seront affichées dans la console du serveur Express

4. **Forcer un refresh manuel**
   - Utilisez l'endpoint `POST /api/annotators/stats/refresh`

## Performance

### Avantages du cache

**Sans cache (ancienne méthode)** :
- Requête complexe avec JOIN et GROUP BY à chaque appel
- Temps de réponse : 50-200ms (selon le nombre d'annotations)
- Charge élevée sur la base de données

**Avec cache (nouvelle méthode)** :
- Simple SELECT sur une table pré-calculée
- Temps de réponse : 1-5ms
- Charge minimale sur la base de données
- Scaling : peut gérer des millions d'annotations sans ralentir les API calls

### Compromis

- **Fraîcheur des données** : Les stats sont rafraîchies toutes les 5 minutes (configurable)
- **Acceptable pour** : Un leaderboard qui n'a pas besoin d'être en temps réel à la seconde près
- **Avantages** : Performance maximale pour les utilisateurs consultant le leaderboard

## Maintenance

### Réinitialiser le cache

```sql
-- Supprimer toutes les stats
TRUNCATE TABLE annotator_stats;

-- Recalculer
SELECT refresh_annotator_stats();
```

### Désactiver temporairement le cron

Pour désactiver le cron sans redémarrer le serveur, vous pouvez :

1. **Via variable d'environnement** :
   ```bash
   LEADERBOARD_CRON_ENABLED=false npm start
   ```
   (Nécessite d'ajouter cette vérification dans `leaderboardCron.js`)

2. **Commenter le démarrage** dans `app.js` :
   ```javascript
   // startLeaderboardCron();
   ```

## Troubleshooting

### Erreur : "relation 'annotator_stats' does not exist"

➡️ **Solution** : Exécuter le script de migration
```bash
psql -U postgres -d image_annotation < backend/migrations/create_annotator_stats.sql
```

### Erreur : "function refresh_annotator_stats() does not exist"

➡️ **Solution** : La fonction SQL n'a pas été créée
```bash
psql -U postgres -d image_annotation < backend/migrations/create_annotator_stats.sql
```

### Le cron ne démarre pas

➡️ **Vérifications** :
1. `node-cron` est installé : `npm list node-cron`
2. `app.js` contient `startLeaderboardCron()`
3. Pas d'erreur au démarrage dans les logs

### Stats pas à jour

➡️ **Solutions** :
1. Vérifier le dernier refresh : `SELECT MAX(last_refreshed) FROM annotator_stats;`
2. Forcer un refresh manuel via API
3. Vérifier les logs du cron pour les erreurs

## Évolutions futures possibles

- [ ] Ajouter un endpoint pour configurer la fréquence du cron dynamiquement
- [ ] Créer une table d'historique des stats (snapshots quotidiens)
- [ ] Ajouter des webhooks pour notifier les changements de classement
- [ ] Implémenter un système de cache Redis pour encore plus de performance
- [ ] Ajouter des métriques Prometheus pour monitorer le cron
