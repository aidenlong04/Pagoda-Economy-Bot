const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const prisma = require('../db/prisma');

const activeVoiceSessions = new Map();

module.exports = async function onVoiceStateUpdate(oldState, newState) {
  const userId = newState.id;

  if (!oldState.channelId && newState.channelId) {
    activeVoiceSessions.set(userId, Date.now());
    return;
  }

  if (oldState.channelId && !newState.channelId) {
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

    await incrementQuestProgress(userId, 'VOICE_MINUTES', minutes);
    const member = newState.member || oldState.member;
    await evaluateAchievements(userId, member);
  }
};
