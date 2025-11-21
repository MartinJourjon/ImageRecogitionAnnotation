const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { forceRefresh } = require('../services/leaderboardCron');

// All routes are protected
router.use(verifyToken);

// Debug endpoint to check leaderboard data
router.get('/debug/leaderboard', async (req, res) => {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'annotator_stats'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return res.json({
        table_exists: false,
        message: 'Table annotator_stats does not exist. Run the migration first.'
      });
    }

    // Get stats from cache table
    const stats = await pool.query(`
      SELECT * FROM annotator_stats ORDER BY rank LIMIT 10
    `);

    // Get count
    const count = await pool.query(`
      SELECT COUNT(*) as total FROM annotator_stats
    `);

    // Get last refresh time
    const lastRefresh = await pool.query(`
      SELECT MAX(last_refreshed) as last_refresh FROM annotator_stats
    `);

    res.json({
      table_exists: true,
      total_annotators: parseInt(count.rows[0].total),
      last_refresh: lastRefresh.rows[0].last_refresh,
      top_10: stats.rows
    });
  } catch (error) {
    console.error('Debug leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get annotator by user ID
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, nickname, role, xp, total_points, total_annotations, created_at
       FROM annotators
       WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annotator profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get annotator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upsert annotator (create or update)
router.post('/profile', async (req, res) => {
  const { nickname } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO annotators (user_id, nickname, role, xp, total_points, total_annotations, created_at)
       VALUES ($1, $2, 'annotator', 0, 0, 0, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET nickname = $2
       RETURNING *`,
      [req.userId, nickname]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Upsert annotator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add XP and points to annotator
router.post('/rewards', async (req, res) => {
  const { xp = 0, points = 0, annotations = 0 } = req.body;

  try {
    const result = await pool.query(
      `UPDATE annotators
       SET xp = xp + $1,
           total_points = total_points + $2,
           total_annotations = total_annotations + $3
       WHERE user_id = $4
       RETURNING *`,
      [xp, points, annotations, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annotator not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add rewards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get annotator stats (leaderboard) - Uses cached table for performance
router.get('/stats', async (req, res) => {
  try {
    // Use the cached annotator_stats table (updated by cron job)
    const result = await pool.query(
      `SELECT
         user_id as annotator_id,
         nickname,
         image_count,
         last_annotation_timestamp as last_refreshed,
         xp,
         total_points,
         total_annotations,
         level,
         rank
       FROM annotator_stats
       ORDER BY rank ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get stats error:', error);
    // Si la table n'existe pas encore, fallback sur l'ancienne méthode
    console.log('Attempting fallback to direct query...');
    try {
      const fallbackResult = await pool.query(
        `SELECT
           a.user_id as annotator_id,
           a.nickname,
           COUNT(DISTINCT an.img_id) as image_count,
           MAX(an.annotation_timestamp) as last_refreshed,
           a.xp,
           a.total_points,
           a.total_annotations,
           FLOOR(a.xp / 500) + 1 as level,
           0 as rank
         FROM annotators a
         LEFT JOIN annotations an ON an.annotator_id = a.user_id::text
         WHERE an.status = 'done'
         GROUP BY a.user_id, a.nickname, a.xp, a.total_points, a.total_annotations
         ORDER BY image_count DESC`
      );
      res.json(fallbackResult.rows);
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Refresh annotator stats manually (force refresh of cache)
router.post('/stats/refresh', async (req, res) => {
  try {
    console.log('[STATS REFRESH] Manual refresh triggered by user');
    const result = await forceRefresh();

    if (result.success) {
      res.json({
        success: true,
        message: 'Stats refreshed successfully',
        count: result.count,
        duration: result.duration
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to refresh stats'
      });
    }
  } catch (error) {
    console.error('Refresh stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard (top annotators by XP) - Uses cached table for performance
router.get('/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Use the cached annotator_stats table
    const result = await pool.query(
      `SELECT
         user_id,
         nickname,
         xp,
         total_points,
         total_annotations,
         level,
         rank,
         image_count,
         last_annotation_timestamp
       FROM annotator_stats
       ORDER BY rank ASC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    // Fallback to annotators table if cache doesn't exist yet
    console.log('Attempting fallback to annotators table...');
    try {
      const fallbackResult = await pool.query(
        `SELECT
           user_id,
           nickname,
           xp,
           total_points,
           total_annotations,
           FLOOR(xp / 500) + 1 as level,
           0 as rank,
           0 as image_count
         FROM annotators
         ORDER BY xp DESC
         LIMIT $1`,
        [limit]
      );
      res.json(fallbackResult.rows);
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;
