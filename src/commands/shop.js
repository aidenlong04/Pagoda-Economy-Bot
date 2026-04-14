const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listShopItems } = require('../services/shopService');

module.exports = {
  data: new SlashCommandBuilder().setName('shop').setDescription('Browse server shop items.'),
  async execute(interaction) {
    const items = await listShopItems();
    const embed = new EmbedBuilder().setTitle('Server Shop');
    embed.setDescription(items.length
      ? items.map((item) => {
          const stock = item.stock === null ? '∞' : item.stock;
          const repeat = item.repeatable ? 'repeatable' : 'one-time';
          return `**${item.name}** — ${item.price} AP (${stock} stock, ${repeat})\n${item.description}`;
        }).join('\n\n')
      : 'No active shop items.');
    await interaction.reply({ embeds: [embed] });
  }
};
