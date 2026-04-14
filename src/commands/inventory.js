const { SlashCommandBuilder } = require('discord.js');
const { getInventory } = require('../services/shopService');

module.exports = {
  data: new SlashCommandBuilder().setName('inventory').setDescription('View your inventory.'),
  async execute(interaction) {
    const items = await getInventory(interaction.user.id);
    const content = items.length
      ? items.map((item) => `• **${item.itemName}** x${item.quantity}`).join('\n')
      : 'Your inventory is empty.';
    await interaction.reply({ content, ephemeral: true });
  }
};
