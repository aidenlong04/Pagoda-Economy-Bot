const { SlashCommandBuilder } = require('discord.js');
const { buyItem } = require('../services/shopService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy a shop item.')
    .addStringOption((option) => option.setName('item').setDescription('Item name').setRequired(true)),
  async execute(interaction) {
    const item = interaction.options.getString('item', true);
    await buyItem({
      discordId: interaction.user.id,
      itemName: item,
      member: interaction.member,
      channel: interaction.channel
    });
    await interaction.reply({ content: `Purchased **${item}**.` });
  }
};
