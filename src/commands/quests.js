const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuestsForUser } = require('../services/questService');

module.exports = {
  data: new SlashCommandBuilder().setName('quests').setDescription('View your active quest progress.'),
  async execute(interaction) {
    const quests = await getQuestsForUser(interaction.user.id);
    const embed = new EmbedBuilder().setTitle('Quest Progress');
    embed.setDescription(quests.length
      ? quests.map((quest) => {
          const state = quest.completed ? '✅ Completed' : quest.progressBar;
          return `**${quest.title}** (${quest.type})\n${state}\nReward: ${quest.rewardAp} AP`;
        }).join('\n\n')
      : 'No active quests.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
