const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const { grantAp } = require('../services/economyService');
const { getConfig } = require('../services/configService');
const prisma = require('../db/prisma');
const logger = require('../logger');

const activeVoiceSessions = new Map();

module.exports = async function onVoiceStateUpdate(oldState, newState) {
  const userId = newState.id;

  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    // Don't start tracking if user joins the AFK channel or is server-deafened
    if (isExcludedState(newState)) {
      return;
    }
    activeVoiceSessions.set(userId, Date.now());
    return;
  }

  // User moved between channels or state changed (mute/deafen)
  if (oldState.channelId && newState.channelId) {
    const wasExcluded = isExcludedState(oldState);
    const nowExcluded = isExcludedState(newState);

    if (!wasExcluded && nowExcluded) {
      // Was tracking, now excluded — settle the session
      await settleVoiceSession(userId, oldState, newState);
    } else if (wasExcluded && !nowExcluded) {
      // Was excluded, now trackable — start a new session
      activeVoiceSessions.set(userId, Date.now());
    }
    return;
  }

  // User left voice channel
  if (oldState.channelId && !newState.channelId) {
    await settleVoiceSession(userId, oldState, newState);
  }
};

function isExcludedState(state) {
  // Exclude AFK channel
  if (state.guild && state.guild.afkChannelId && state.channelId === state.guild.afkChannelId) {
    return true;
  }
  // Exclude server-deafened users (they can't hear or participate)
  if (state.serverDeaf) {
    return true;
  }
  return false;
}

async function settleVoiceSession(userId, oldState, newState) {
  const startedAt = activeVoiceSessions.get(userId);
  activeVoiceSessions.delete(userId);
  if (!startedAt) {
    return;
  }

  const minutes = Math.floor((Date.now() - startedAt) / 60000);
  if (minutes <= 0) {
    return;
  }

  await prisma.user.upsert({
    where: { discordId: userId },
    update: { voiceMinutes: { increment: minutes } },
    create: { discordId: userId, voiceMinutes: minutes }
  });

  // Grant passive voice AP per 5-minute bracket
  const apPer5Min = parseInt(await getConfig('VOICE_AP_PER_5MIN'), 10) || 0;
  if (apPer5Min > 0) {
    const brackets = Math.floor(minutes / 5);
    if (brackets > 0) {
      const voiceAp = brackets * apPer5Min;
      try {
        await grantAp(userId, voiceAp, 'VOICE', userId, { reason: 'voice-activity', minutes, brackets });
      } catch (error) {
        logger.warn('Failed to grant voice AP', { userId, error: error.message });
      }
    }
  }

  await incrementQuestProgress(userId, 'VOICE_MINUTES', minutes);
  const member = newState.member || oldState.member;
  await evaluateAchievements(userId, member);
}

// Exported for testing
module.exports._activeVoiceSessions = activeVoiceSessions;
