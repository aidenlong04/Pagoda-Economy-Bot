const prisma = require('../db/prisma');
const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const { recordChannelInteraction } = require('../services/eventService');
const { grantAp } = require('../services/economyService');
const { getConfig } = require('../services/configService');
const logger = require('../logger');

// Per-user cooldown map: discordId -> last AP grant timestamp (ms)
const messageCooldowns = new Map();

module.exports = async function onMessageCreate(message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  const minLength = parseInt(await getConfig('MESSAGE_MIN_LENGTH'), 10) || 4;

  // Only count messages that meet minimum length (filters spam/emoji-only)
  if (message.content.length < minLength) {
    return;
  }

  await prisma.user.upsert({
    where: { discordId: message.author.id },
    update: { messageCount: { increment: 1 } },
    create: { discordId: message.author.id, messageCount: 1 }
  });

  // Passive message AP with per-user cooldown
  const cooldownSec = parseInt(await getConfig('MESSAGE_COOLDOWN_SECONDS'), 10) || 60;
  const messageAp = parseInt(await getConfig('MESSAGE_AP'), 10) || 0;
  const now = Date.now();
  const lastGrant = messageCooldowns.get(message.author.id) || 0;

  if (messageAp > 0 && (now - lastGrant) >= cooldownSec * 1000) {
    messageCooldowns.set(message.author.id, now);
    try {
      await grantAp(message.author.id, messageAp, 'MESSAGE', message.author.id, { reason: 'message-activity' });
    } catch (error) {
      logger.warn('Failed to grant message AP', { userId: message.author.id, error: error.message });
    }
  }

  const completed = await incrementQuestProgress(message.author.id, 'MESSAGE_COUNT', 1);
  if (completed.length > 0) {
    await message.channel.send(`🎉 ${message.author}, you completed ${completed.length} quest(s)!`).catch(() => null);
  }

  await evaluateAchievements(message.author.id, message.member);
  await recordChannelInteraction(message.channel.id, message.author.id, 'MESSAGE');
};

// Exported for testing
module.exports._messageCooldowns = messageCooldowns;
