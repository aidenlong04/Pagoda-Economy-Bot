const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAchievementProgress } = require('../services/achievementService');

module.exports = {
  data: new SlashCommandBuilder().setName('achievements').setDescription('View achievement progress.'),
  async execute(interaction) {
    const rows = await getAchievementProgress(interaction.user.id);
    const embed = new EmbedBuilder().setTitle('Achievements & Milestones');
    embed.setDescription(rows.length
      ? rows.map((row) => {
          if (row.unlockedAt) {
            return `✅ **${row.name}** — unlocked <t:${Math.floor(new Date(row.unlockedAt).getTime() / 1000)}:R>`;
          }
          return `⬜ **${row.name}** — ${row.current}/${row.threshold} (${row.rewardAp} AP)`;
        }).join('\n')
      : 'No achievements configured.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
