const { ActivityType } = require('discord.js');
const { updateWebhookLeaderboard } = require('../services/leaderboardWebhook');
const logger = require('../logger');

module.exports = async function onReady(client) {
  logger.info(`Logged in as ${client.user.tag} — Orbiter systems online.`);
  client.user.setActivity('Alliance Standing | /standing', { type: ActivityType.Watching });

  // Post/update the persistent webhook leaderboard on startup
  try {
    const updated = await updateWebhookLeaderboard();
    if (updated) {
      logger.info('Webhook leaderboard posted/updated on startup');
    }
  } catch (error) {
    logger.warn('Webhook leaderboard startup update failed', { error: error.message });
  }
};
