const { SlashCommandBuilder } = require('discord.js');
const { claimDaily } = require('../services/economyService');

module.exports = {
  data: new SlashCommandBuilder().setName('daily').setDescription('Claim your daily AP reward.'),
  async execute(interaction) {
    const result = await claimDaily(interaction.user.id);
    if (!result.claimed) {
      return interaction.reply({
        content: `Daily already claimed. Try again in **${result.remainingSeconds}s**.`,
        ephemeral: true
      });
    }
    return interaction.reply({ content: `You claimed **${result.reward} AP** for your daily reward.` });
  }
};
