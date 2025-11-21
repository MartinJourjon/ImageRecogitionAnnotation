const cron = require('node-cron');
const pool = require('../config/database');

/**
 * Fonction pour rafraîchir les statistiques du leaderboard
 * Appelle la fonction PostgreSQL refresh_annotator_stats()
 */
async function refreshLeaderboardStats() {
  console.log('[LEADERBOARD CRON] Starting stats refresh...');
  const startTime = Date.now();

  try {
    // Appeler la fonction SQL qui recalcule toutes les stats
    const result = await pool.query('SELECT refresh_annotator_stats()');

    // Compter combien d'entrées ont été mises à jour
    const countResult = await pool.query('SELECT COUNT(*) as count FROM annotator_stats');
    const count = countResult.rows[0].count;

    const duration = Date.now() - startTime;
    console.log(`[LEADERBOARD CRON] Stats refreshed successfully! ${count} annotators processed in ${duration}ms`);

    return { success: true, count, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LEADERBOARD CRON] Error refreshing stats after ${duration}ms:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialise le job cron pour rafraîchir le leaderboard
 * Par défaut: toutes les 5 minutes
 *
 * Format cron: * * * * *
 * ┬ ┬ ┬ ┬ ┬
 * │ │ │ │ │
 * │ │ │ │ └───── jour de la semaine (0 - 7) (0 et 7 = dimanche)
 * │ │ │ └────────── mois (1 - 12)
 * │ │ └─────────────── jour du mois (1 - 31)
 * │ └──────────────────── heure (0 - 23)
 * └───────────────────────── minute (0 - 59)
 *
 * Exemples:
 * - '* /5 * * * *' = toutes les 5 minutes
 * - '0 * * * *' = toutes les heures à la minute 0
 * - '0 0 * * *' = tous les jours à minuit
 * */

function startLeaderboardCron() {
  // Configuration par défaut: toutes les 5 minutes
  const cronSchedule = process.env.LEADERBOARD_CRON_SCHEDULE || '*/5 * * * *';

  console.log(`[LEADERBOARD CRON] Initializing cron job with schedule: ${cronSchedule}`);

  // Créer le job cron
  const job = cron.schedule(cronSchedule, async () => {
    await refreshLeaderboardStats();
  }, {
    scheduled: true,
    timezone: "Europe/Paris" // Ajustez selon votre timezone
  });

  console.log('[LEADERBOARD CRON] Cron job started successfully');

  // Exécuter immédiatement au démarrage pour avoir des stats à jour
  console.log('[LEADERBOARD CRON] Running initial stats refresh...');
  refreshLeaderboardStats().then(result => {
    if (result.success) {
      console.log('[LEADERBOARD CRON] Initial refresh completed');
    }
  });

  return job;
}

/**
 * Fonction pour forcer un rafraîchissement manuel (appelable depuis une route)
 */
async function forceRefresh() {
  console.log('[LEADERBOARD CRON] Manual refresh triggered');
  return await refreshLeaderboardStats();
}

module.exports = {
  startLeaderboardCron,
  refreshLeaderboardStats,
  forceRefresh
};
