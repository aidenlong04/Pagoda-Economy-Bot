const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show AP leaderboard top 25 (paginated).')
    .addIntegerOption((option) => option.setName('page').setDescription('Page number').setMinValue(1)),
  async execute(interaction) {
    const page = interaction.options.getInteger('page') || 1;
    const users = await getLeaderboard(page, 25);
    const embed = new EmbedBuilder().setTitle(`Alliance Standing Leaderboard • Page ${page}`);
    embed.setDescription(users.length
      ? users.map((user, index) => `**#${(page - 1) * 25 + index + 1}** <@${user.discordId}> — **${user.balance} AP**`).join('\n')
      : 'No leaderboard data yet.');
    await interaction.reply({ embeds: [embed] });
  }
};
