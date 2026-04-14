const { SlashCommandBuilder } = require('discord.js');
const { setConfig } = require('../services/configService');
const { isAdmin } = require('../services/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Set a runtime configuration value.')
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Set a config key/value pair.')
      .addStringOption((option) => option.setName('key').setDescription('Config key').setRequired(true))
      .addStringOption((option) => option.setName('value').setDescription('Config value').setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const key = interaction.options.getString('key', true);
    const value = interaction.options.getString('value', true);
    await setConfig(key, value);
    return interaction.reply({ content: `Updated config: **${key}** = **${value}**` });
  }
};
