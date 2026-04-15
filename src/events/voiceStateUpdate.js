const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const { grantAp } = require('../services/economyService');
const { getConfig } = require('../services/configService');
const prisma = require('../db/prisma');
const logger = require('../logger');

const activeVoiceSessions = new Map();

// Maximum trackable session length (default 8 hours) — prevents abuse from
// users who leave a client idling in voice forever.
const MAX_SESSION_MS = 8 * 60 * 60 * 1000;

// Periodically sweep stale voice sessions to prevent unbounded memory growth
// in case disconnect events are missed.
const VOICE_SWEEP_INTERVAL_MS = 30 * 60 * 1000; // every 30 min
setInterval(() => {
  const cutoff = Date.now() - MAX_SESSION_MS;
  for (const [key, ts] of activeVoiceSessions) {
    if (ts < cutoff) activeVoiceSessions.delete(key);
  }
}, VOICE_SWEEP_INTERVAL_MS).unref();

module.exports = async function onVoiceStateUpdate(oldState, newState) {
  const userId = newState.id;

  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
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
      await settleVoiceSession(userId, oldState, newState);
    } else if (wasExcluded && !nowExcluded) {
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
  if (state.guild && state.guild.afkChannelId && state.channelId === state.guild.afkChannelId) {
    return true;
  }
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

  // Cap session duration to prevent abuse
  const elapsed = Math.min(Date.now() - startedAt, MAX_SESSION_MS);
  const minutes = Math.floor(elapsed / 60000);
  if (minutes <= 0) {
    return;
  }

  // Run DB upsert and AP grant in parallel where possible
  const upsertPromise = prisma.user.upsert({
    where: { discordId: userId },
    update: { voiceMinutes: { increment: minutes } },
    create: { discordId: userId, voiceMinutes: minutes }
  });

  const apPer5Min = parseInt(await getConfig('VOICE_AP_PER_5MIN'), 10) || 0;
  let apPromise;
  if (apPer5Min > 0) {
    const brackets = Math.floor(minutes / 5);
    if (brackets > 0) {
      const voiceAp = brackets * apPer5Min;
      apPromise = grantAp(userId, voiceAp, 'VOICE', userId, { reason: 'voice-activity', minutes, brackets })
        .catch((err) => logger.warn('Failed to grant voice AP', { userId, error: err.message }));
    }
  }

  await upsertPromise;

  // Run quest progress and achievement eval in parallel
  const member = newState.member || oldState.member;
  await Promise.all([
    incrementQuestProgress(userId, 'VOICE_MINUTES', minutes),
    evaluateAchievements(userId, member),
    apPromise
  ]);
}

// Exported for testing
module.exports._activeVoiceSessions = activeVoiceSessions;
module.exports._MAX_SESSION_MS = MAX_SESSION_MS;
