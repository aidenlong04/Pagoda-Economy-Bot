const { SlashCommandBuilder } = require('discord.js');
const { getBalance } = require('../services/economyService');

module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('Show your Alliance Standing balance.'),
  async execute(interaction) {
    const balance = await getBalance(interaction.user.id);
    await interaction.reply({ content: `You have **${balance} AP**.`, ephemeral: true });
  }
};
