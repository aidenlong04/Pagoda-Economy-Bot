const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../services/economyService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Show the ${Terms.LEADERBOARD} — top 25 Tenno (paginated).`)
    .addIntegerOption((option) => option.setName('page').setDescription('Page number').setMinValue(1)),
  async execute(interaction) {
    const page = interaction.options.getInteger('page') || 1;
    const users = await getLeaderboard(page, 25);
    const embed = new EmbedBuilder()
      .setColor(Colors.OROKIN)
      .setAuthor({ name: `${Terms.LEADERBOARD} • Page ${page}`, iconURL: Icons.ALLIANCE })
      .setThumbnail(Icons.TENNO)
      .setTimestamp();

    if (!users.length) {
      embed.setDescription('No leaderboard data yet. Get out there, Tenno!');
    } else {
      const lines = users.map((user, index) => {
        const rank = (page - 1) * 25 + index + 1;
        const medal = RANK_MEDALS[rank - 1] || `**#${rank}**`;
        return `${medal} <@${user.discordId}> — **${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`;
      });
      embed.setDescription(lines.join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
