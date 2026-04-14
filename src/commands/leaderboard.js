const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLeaderboard } = require('../services/economyService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const PAGE_SIZE = 25;

function buildLeaderboardEmbed(users, page) {
  const embed = new EmbedBuilder()
    .setColor(Colors.OROKIN)
    .setAuthor({ name: `${Terms.LEADERBOARD} • Page ${page}`, iconURL: Icons.ALLIANCE })
    .setThumbnail(Icons.TENNO)
    .setTimestamp();

  if (!users.length) {
    embed.setDescription('No leaderboard data yet. Get out there, Tenno!');
  } else {
    const lines = users.map((user, index) => {
      const rank = (page - 1) * PAGE_SIZE + index + 1;
      const medal = RANK_MEDALS[rank - 1] || `**#${rank}**`;
      return `${medal} <@${user.discordId}> — **${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`;
    });
    embed.setDescription(lines.join('\n'));
  }

  return embed;
}

function buildPaginationRow(page, hasMore) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`leaderboard:${page - 1}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('◀️')
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('leaderboard:page')
      .setLabel(`Page ${page}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`leaderboard:${page + 1}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('▶️')
      .setDisabled(!hasMore)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Show the ${Terms.LEADERBOARD} — top 25 Tenno (paginated).`)
    .addIntegerOption((option) => option.setName('page').setDescription('Page number').setMinValue(1)),
  async execute(interaction) {
    await interaction.deferReply();
    const page = interaction.options.getInteger('page') || 1;
    const users = await getLeaderboard(page, PAGE_SIZE);
    const embed = buildLeaderboardEmbed(users, page);
    const row = buildPaginationRow(page, users.length === PAGE_SIZE);
    await interaction.editReply({ embeds: [embed], components: [row] });
  },
  // Exported for reuse in button handler and webhook leaderboard
  buildLeaderboardEmbed,
  buildPaginationRow,
  PAGE_SIZE
};
