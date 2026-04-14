const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQuestsForUser } = require('../services/questService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const TYPE_ICONS = {
  DAILY: '📋',
  WEEKLY: '📅',
  CUSTOM: '⭐',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription(`View your active ${Terms.QUEST_LABEL} progress.`),
  async execute(interaction) {
    const quests = await getQuestsForUser(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(Colors.LOTUS)
      .setAuthor({ name: Terms.QUEST_LABEL, iconURL: Icons.CODEX })
      .setThumbnail(Icons.LOTUS)
      .setTimestamp();

    if (!quests.length) {
      embed.setDescription('No active missions in your Codex, Tenno.');
    } else {
      const lines = quests.map((quest) => {
        const icon = TYPE_ICONS[quest.type] || '•';
        const state = quest.completed ? '✅ **Completed**' : quest.progressBar;
        return `${icon} **${quest.title}** (${quest.type})\n${state}\nReward: \`${quest.rewardAp} ${Terms.CURRENCY_ABBREV}\``;
      });
      embed.setDescription(lines.join('\n\n'));
    }

    embed.setFooter({ text: 'Progress updates automatically as you interact' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
