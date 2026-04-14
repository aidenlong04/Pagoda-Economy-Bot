const { SlashCommandBuilder } = require('discord.js');
const { transferAp } = require('../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer AP to another user.')
    .addUserOption((option) => option.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription('Amount of AP').setRequired(true)),
  async execute(interaction) {
    const recipient = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    await transferAp(interaction.user.id, recipient.id, amount, interaction.user.id);
    await interaction.reply({ content: `Transferred **${amount} AP** to ${recipient}.` });
  }
};
