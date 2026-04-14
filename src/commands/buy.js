const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { buyItem } = require('../services/shopService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy a shop item.')
    .addStringOption((option) => option.setName('item').setDescription('Item name').setRequired(true)),
  async execute(interaction) {
    const itemName = interaction.options.getString('item', true);
    const item = await buyItem({
      discordId: interaction.user.id,
      itemName,
      member: interaction.member,
      channel: interaction.channel
    });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setAuthor({ name: 'Purchase Complete', iconURL: Icons.CREDITS })
      .setDescription(
        `Acquired **${item.name}** for **${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}**\n\n` +
        `*${randomFlavor('PURCHASE')}*`
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
