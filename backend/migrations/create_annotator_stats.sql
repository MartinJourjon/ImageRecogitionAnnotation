-- Table pour stocker les statistiques du leaderboard (cache)
-- Cette table sera mise à jour périodiquement par un job cron

CREATE TABLE IF NOT EXISTS annotator_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  image_count INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_annotations INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank INTEGER DEFAULT 0,
  last_annotation_timestamp TIMESTAMP,
  last_refreshed TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes de classement
CREATE INDEX IF NOT EXISTS idx_annotator_stats_xp ON annotator_stats(xp DESC);
CREATE INDEX IF NOT EXISTS idx_annotator_stats_points ON annotator_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_annotator_stats_rank ON annotator_stats(rank ASC);
CREATE INDEX IF NOT EXISTS idx_annotator_stats_refreshed ON annotator_stats(last_refreshed DESC);

-- Fonction pour rafraîchir les statistiques du leaderboard
CREATE OR REPLACE FUNCTION refresh_annotator_stats()
RETURNS void AS $$
BEGIN
  -- Supprimer les anciennes stats et recalculer
  TRUNCATE TABLE annotator_stats;

  -- Insérer les nouvelles stats calculées
  INSERT INTO annotator_stats (
    user_id,
    nickname,
    image_count,
    xp,
    total_points,
    total_annotations,
    level,
    last_annotation_timestamp,
    last_refreshed
  )
  SELECT
    a.user_id,
    a.nickname,
    COUNT(DISTINCT CASE WHEN an.status = 'done' THEN an.img_id END) as image_count,
    a.xp,
    a.total_points,
    a.total_annotations,
    FLOOR(a.xp / 500) + 1 as level,
    MAX(an.annotation_timestamp) as last_annotation_timestamp,
    NOW() as last_refreshed
  FROM annotators a
  LEFT JOIN annotations an ON an.annotator_id = a.user_id::text
  GROUP BY a.user_id, a.nickname, a.xp, a.total_points, a.total_annotations;

  -- Calculer et mettre à jour les rangs (1 = premier)
  WITH ranked AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (ORDER BY xp DESC, total_points DESC, total_annotations DESC) as rank_number
    FROM annotator_stats
  )
  UPDATE annotator_stats s
  SET rank = r.rank_number
  FROM ranked r
  WHERE s.user_id = r.user_id;

  RAISE NOTICE 'Annotator stats refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Initialiser la table avec les données actuelles
SELECT refresh_annotator_stats();

COMMENT ON TABLE annotator_stats IS 'Cache table for leaderboard statistics, updated periodically by cron job';
COMMENT ON FUNCTION refresh_annotator_stats() IS 'Recalculates all annotator statistics and rankings';
