const { incrementQuestProgress } = require('../services/questService');
const { recordChannelInteraction } = require('../services/eventService');

module.exports = async function onMessageReactionAdd(reaction, user) {
  if (!reaction.message.guild || user.bot) {
    return;
  }

  await incrementQuestProgress(user.id, 'REACTION_COUNT', 1);
  await recordChannelInteraction(reaction.message.channel.id, user.id, 'REACT');
};
