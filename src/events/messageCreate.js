const prisma = require('../db/prisma');
const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const { recordChannelInteraction } = require('../services/eventService');
const { grantAp } = require('../services/economyService');
const { getConfigBatch } = require('../services/configService');
const logger = require('../logger');

// Per-user cooldown map: discordId -> last AP grant timestamp (ms)
const messageCooldowns = new Map();

module.exports = async function onMessageCreate(message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  // Batch-fetch all config keys in a single DB round-trip
  const config = await getConfigBatch([
    'MESSAGE_MIN_LENGTH',
    'MESSAGE_COOLDOWN_SECONDS',
    'MESSAGE_AP'
  ]);
  const minLength = parseInt(config.get('MESSAGE_MIN_LENGTH'), 10) || 4;

  // Only count messages that meet minimum length (filters spam/emoji-only)
  if (message.content.length < minLength) {
    return;
  }

  const discordId = message.author.id;

  // Fire-and-forget: upsert message count (non-blocking — doesn't gate AP or quests)
  const upsertPromise = prisma.user.upsert({
    where: { discordId },
    update: { messageCount: { increment: 1 } },
    create: { discordId, messageCount: 1 }
  }).catch((err) => logger.warn('Failed to upsert message count', { userId: discordId, error: err.message }));

  // Passive message AP with per-user cooldown (checked in-memory — zero DB cost)
  const cooldownSec = parseInt(config.get('MESSAGE_COOLDOWN_SECONDS'), 10) || 60;
  const messageAp = parseInt(config.get('MESSAGE_AP'), 10) || 0;
  const now = Date.now();
  const lastGrant = messageCooldowns.get(discordId) || 0;

  let apPromise;
  if (messageAp > 0 && (now - lastGrant) >= cooldownSec * 1000) {
    messageCooldowns.set(discordId, now);
    apPromise = grantAp(discordId, messageAp, 'MESSAGE', discordId, { reason: 'message-activity' })
      .catch((err) => logger.warn('Failed to grant message AP', { userId: discordId, error: err.message }));
  }

  // Wait for upsert before quest/achievement eval (they depend on user record)
  await upsertPromise;

  // Run quest progress, achievement eval, and event recording in parallel
  const [completed] = await Promise.all([
    incrementQuestProgress(discordId, 'MESSAGE_COUNT', 1),
    evaluateAchievements(discordId, message.member),
    recordChannelInteraction(message.channel.id, discordId, 'MESSAGE'),
    apPromise // also await AP grant if in-flight
  ]);

  if (completed.length > 0) {
    message.channel.send(`🎉 ${message.author}, you completed ${completed.length} quest(s)!`).catch(() => null);
  }
};

// Exported for testing
module.exports._messageCooldowns = messageCooldowns;
