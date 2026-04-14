const prisma = require('../db/prisma');
const { incrementQuestProgress } = require('../services/questService');
const { evaluateAchievements } = require('../services/achievementService');
const { recordChannelInteraction } = require('../services/eventService');

module.exports = async function onMessageCreate(message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  await prisma.user.upsert({
    where: { discordId: message.author.id },
    update: { messageCount: { increment: 1 } },
    create: { discordId: message.author.id, messageCount: 1 }
  });

  const completed = await incrementQuestProgress(message.author.id, 'MESSAGE_COUNT', 1);
  if (completed.length > 0) {
    await message.channel.send(`🎉 ${message.author}, you completed ${completed.length} quest(s)!`).catch(() => null);
  }

  await evaluateAchievements(message.author.id, message.member);
  await recordChannelInteraction(message.channel.id, message.author.id, 'MESSAGE');
};
