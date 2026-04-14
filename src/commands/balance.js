const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../services/economyService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription(`Show your ${Terms.CURRENCY_NAME} balance.`),
  async execute(interaction) {
    const balance = await getBalance(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(Colors.TENNO)
      .setAuthor({ name: Terms.BALANCE, iconURL: Icons.CREDITS })
      .setDescription(`<@${interaction.user.id}>\n\n**${balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`)
      .setFooter({ text: Terms.CURRENCY_NAME })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
