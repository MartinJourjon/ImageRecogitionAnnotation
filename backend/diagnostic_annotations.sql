-- Diagnostic SQL pour vérifier l'état des annotations
-- Exécutez ce script dans votre client PostgreSQL (psql, pgAdmin, etc.)

-- 1. Compter les annotations par statut
SELECT status, COUNT(*) as count
FROM annotations
GROUP BY status
ORDER BY status;

-- 2. Voir les dernières annotations (les 20 dernières par img_id)
SELECT img_id, status, annotator_id, annotation_timestamp
FROM annotations
ORDER BY img_id DESC
LIMIT 20;

-- 3. Voir les annotations 'in_progress' (potentiellement bloquées)
SELECT img_id, status, annotator_id, annotation_timestamp
FROM annotations
WHERE status = 'in_progress'
ORDER BY img_id;

-- 4. Voir les annotations autour de l'image 392-394
SELECT img_id, status, annotator_id, annotation_timestamp
FROM annotations
WHERE img_id >= '390' AND img_id <= '395'
ORDER BY img_id;

-- 5. Statistiques globales
SELECT
  MIN(img_id) as first_img,
  MAX(img_id) as last_img,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
  COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped
FROM annotations;

-- 6. Vérifier s'il y a des transactions non commitées (normalement vide)
SELECT
  pid,
  state,
  query,
  query_start,
  state_change,
  xact_start
FROM pg_stat_activity
WHERE datname = current_database()
  AND state IN ('idle in transaction', 'idle in transaction (aborted)')
ORDER BY state_change;

-- 7. Pour réinitialiser les annotations bloquées (ATTENTION: à utiliser avec précaution)
-- Décommentez seulement si vous voulez réinitialiser les images en_progress
-- UPDATE annotations
-- SET status = 'pending'
-- WHERE status = 'in_progress';
