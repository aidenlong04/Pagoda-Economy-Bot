const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAchievementProgress } = require('../services/achievementService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const CATEGORY_ICONS = {
  EARNING: '💰',
  SPENDING: '🛒',
  ACTIVITY: '💬',
  QUEST: '📜',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription(`View your ${Terms.ACHIEVEMENT} progress.`),
  async execute(interaction) {
    const rows = await getAchievementProgress(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(Colors.OROKIN)
      .setAuthor({ name: `${Terms.ACHIEVEMENT}s`, iconURL: Icons.CODEX })
      .setThumbnail(Icons.TENNO)
      .setTimestamp();

    if (!rows.length) {
      embed.setDescription('No Mastery Challenges configured yet.');
    } else {
      const lines = rows.map((row) => {
        const icon = CATEGORY_ICONS[row.category] || '•';
        if (row.unlockedAt) {
          return `${icon} ✅ **${row.name}** — unlocked <t:${Math.floor(new Date(row.unlockedAt).getTime() / 1000)}:R>`;
        }
        const pct = row.threshold > 0 ? Math.min(100, Math.round((row.current / row.threshold) * 100)) : 0;
        return `${icon} ⬜ **${row.name}** — ${row.current.toLocaleString()}/${row.threshold.toLocaleString()} (${pct}%) • \`${row.rewardAp} ${Terms.CURRENCY_ABBREV}\``;
      });
      embed.setDescription(lines.join('\n'));
    }

    embed.setFooter({ text: 'Achievements unlock automatically as you progress' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
