const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// All routes are protected
router.use(verifyToken);

// Diagnostic endpoint to check annotation status
router.get('/diagnostic', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped
      FROM annotations
    `);

    const inProgress = await pool.query(`
      SELECT img_id, status, annotator_id, annotation_timestamp
      FROM annotations
      WHERE status = 'in_progress'
      ORDER BY img_id
      LIMIT 10
    `);

    const recent = await pool.query(`
      SELECT img_id, status, annotator_id, annotation_timestamp
      FROM annotations
      ORDER BY img_id DESC
      LIMIT 10
    `);

    res.json({
      stats: stats.rows[0],
      in_progress: inProgress.rows,
      recent: recent.rows
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get next pending annotation
router.get('/next', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM annotations
       WHERE status = 'pending'
       ORDER BY img_id ASC
       LIMIT 1`
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Get next annotation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark annotation as in_progress (atomic lock)
router.patch('/:imgId/lock', async (req, res) => {
  const { imgId } = req.params;

  console.log(`[ANNOTATION LOCK] Attempting to lock img_id: ${imgId}`);

  try {
    const result = await pool.query(
      `UPDATE annotations
       SET status = 'in_progress'
       WHERE img_id = $1 AND status = 'pending'
       RETURNING img_id, status`,
      [imgId]
    );

    if (result.rows.length === 0) {
      console.log(`[ANNOTATION LOCK] Failed to lock img_id: ${imgId} (already locked or not found)`);
      return res.status(409).json({ error: 'Annotation already locked or not found' });
    }

    console.log(`[ANNOTATION LOCK] Successfully locked img_id: ${imgId}, status: ${result.rows[0].status}`);
    res.json({ success: true, img_id: result.rows[0].img_id });
  } catch (error) {
    console.error(`[ANNOTATION LOCK] Error locking img_id: ${imgId}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Release annotation lock (set back to pending)
router.patch('/:imgId/unlock', async (req, res) => {
  const { imgId } = req.params;

  console.log(`[ANNOTATION UNLOCK] Attempting to unlock img_id: ${imgId}`);

  try {
    const result = await pool.query(
      `UPDATE annotations
       SET status = 'pending'
       WHERE img_id = $1 AND status = 'in_progress'
       RETURNING img_id, status`,
      [imgId]
    );

    if (result.rows.length > 0) {
      console.log(`[ANNOTATION UNLOCK] Successfully unlocked img_id: ${imgId}, status: ${result.rows[0].status}`);
    } else {
      console.log(`[ANNOTATION UNLOCK] No rows updated for img_id: ${imgId} (was not in_progress)`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`[ANNOTATION UNLOCK] Error unlocking img_id: ${imgId}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update annotation (save)
router.put('/:imgId', async (req, res) => {
  const { imgId } = req.params;
  const data = req.body;

  console.log(`[ANNOTATION UPDATE] Starting update for img_id: ${imgId}, status: ${data.status}`);

  // Build dynamic update query
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // List of allowed fields to update
  const allowedFields = [
    'age_category', 'gender', 'ethnicity', 'skin_type_primary', 'skin_type_secondary',
    'acne_present', 'acne_severity', 'blackheads', 'whiteheads', 'papules', 'pustules',
    'nodules', 'scarring_acne', 'pigmentation_present', 'pigmentation_type',
    'redness_level', 'pores', 'texture', 'shine', 'dehydration_signs', 'wrinkle_score',
    'region_wrinkles', 'skin_region', 'has_makeup', 'notes', 'blur_score',
    'annotation_confidence', 'annotation_timestamp', 'status'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // IMPORTANT: Always set annotator_id to the authenticated user's ID
  // This ensures correct tracking of who annotated what
  fields.push(`annotator_id = $${paramIndex}`);
  values.push(req.userId.toString()); // Store as TEXT to match column type
  paramIndex++;

  if (fields.length === 0) {
    console.log(`[ANNOTATION UPDATE] No valid fields to update for img_id: ${imgId}`);
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(imgId);
  const query = `UPDATE annotations SET ${fields.join(', ')} WHERE img_id = $${paramIndex} RETURNING *`;

  let client;
  try {
    client = await pool.connect();
    console.log(`[ANNOTATION UPDATE] Client connected for img_id: ${imgId}`);

    try {
      await client.query('BEGIN');
      console.log(`[ANNOTATION UPDATE] Transaction BEGIN for img_id: ${imgId}`);

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        console.log(`[ANNOTATION UPDATE] Annotation not found, ROLLBACK for img_id: ${imgId}`);
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Annotation not found' });
      }

      const annotation = result.rows[0];
      console.log(`[ANNOTATION UPDATE] Annotation updated, new status: ${annotation.status} for img_id: ${imgId}`);

      // If status is 'done', trigger gamification logic
      if (data.status === 'done') {
        // Award XP and points
        const xpReward = 50; // Base XP per annotation
        const pointsReward = 10; // Base points per annotation

        console.log(`[ANNOTATION UPDATE] Awarding ${xpReward} XP and ${pointsReward} points to user ${req.userId}`);

        const gamificationResult = await client.query(
          `UPDATE annotators
           SET xp = xp + $1,
               total_points = total_points + $2,
               total_annotations = total_annotations + 1
           WHERE user_id = $3
           RETURNING xp, total_points, total_annotations`,
          [xpReward, pointsReward, req.userId]
        );

        if (gamificationResult.rows.length > 0) {
          console.log(`[ANNOTATION UPDATE] Gamification updated:`, gamificationResult.rows[0]);
        } else {
          console.log(`[ANNOTATION UPDATE] WARNING: No annotator found for user_id: ${req.userId}`);
        }
      }

      await client.query('COMMIT');
      console.log(`[ANNOTATION UPDATE] Transaction COMMITTED successfully for img_id: ${imgId}`);

      res.json(annotation);
    } catch (error) {
      console.error(`[ANNOTATION UPDATE] Error in transaction for img_id: ${imgId}`, error);
      await client.query('ROLLBACK');
      console.log(`[ANNOTATION UPDATE] Transaction ROLLBACK for img_id: ${imgId}`);
      throw error;
    } finally {
      client.release();
      console.log(`[ANNOTATION UPDATE] Client released for img_id: ${imgId}`);
    }
  } catch (error) {
    console.error(`[ANNOTATION UPDATE] Fatal error for img_id: ${imgId}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Skip annotation
router.patch('/:imgId/skip', async (req, res) => {
  const { imgId } = req.params;

  console.log(`[ANNOTATION SKIP] Attempting to skip img_id: ${imgId}`);

  try {
    const result = await pool.query(
      `UPDATE annotations
       SET status = 'skipped', annotation_timestamp = NOW()
       WHERE img_id = $1 AND status = 'in_progress'
       RETURNING img_id, status`,
      [imgId]
    );

    if (result.rows.length === 0) {
      console.log(`[ANNOTATION SKIP] Failed to skip img_id: ${imgId} (not found or not in_progress)`);
      return res.status(404).json({ error: 'Annotation not found or not in progress' });
    }

    console.log(`[ANNOTATION SKIP] Successfully skipped img_id: ${imgId}, status: ${result.rows[0].status}`);
    res.json({ success: true });
  } catch (error) {
    console.error(`[ANNOTATION SKIP] Error skipping img_id: ${imgId}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete annotation
router.delete('/:imgId', async (req, res) => {
  const { imgId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM annotations WHERE img_id = $1 RETURNING img_id',
      [imgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete annotation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
