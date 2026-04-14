const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { claimDaily } = require('../services/economyService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription(`Claim your ${Terms.DAILY} reward.`),
  async execute(interaction) {
    const result = await claimDaily(interaction.user.id);
    if (!result.claimed) {
      const hours = Math.floor(result.remainingSeconds / 3600);
      const minutes = Math.floor((result.remainingSeconds % 3600) / 60);
      const embed = new EmbedBuilder()
        .setColor(Colors.WARNING)
        .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
        .setDescription(`You've already collected today's tribute.\nTry again in **${hours}h ${minutes}m**.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
      .setDescription(
        `**+${result.reward.toLocaleString()} ${Terms.CURRENCY_ABBREV}**\n\n*${randomFlavor('DAILY_CLAIM')}*`
      )
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
};
