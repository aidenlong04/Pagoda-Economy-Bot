const prisma = require('../db/prisma');
const { incrementQuestProgress } = require('../services/questService');
const { recordChannelInteraction } = require('../services/eventService');

module.exports = async function onMessageReactionAdd(reaction, user) {
  if (!reaction.message.guild || user.bot) {
    return;
  }

  // Filter self-reacts — don't count reactions on your own messages
  if (reaction.message.author && reaction.message.author.id === user.id) {
    return;
  }

  // Track reaction count on user model
  await prisma.user.upsert({
    where: { discordId: user.id },
    update: { reactionCount: { increment: 1 } },
    create: { discordId: user.id, reactionCount: 1 }
  });

  await incrementQuestProgress(user.id, 'REACTION_COUNT', 1);
  await recordChannelInteraction(reaction.message.channel.id, user.id, 'REACT');
};
