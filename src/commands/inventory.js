const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInventory } = require('../services/shopService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription(`View your ${Terms.INVENTORY}.`),
  async execute(interaction) {
    const items = await getInventory(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(Colors.TENNO)
      .setAuthor({ name: Terms.INVENTORY, iconURL: Icons.CODEX })
      .setTimestamp();

    if (!items.length) {
      embed.setDescription('Your Arsenal is empty, Tenno.');
    } else {
      embed.setDescription(
        items.map((item) => `• **${item.itemName}** ×${item.quantity}`).join('\n')
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
