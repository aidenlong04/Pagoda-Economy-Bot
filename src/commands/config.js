const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setConfig, getConfig } = require('../services/configService');
const { isAdmin } = require('../services/permissions');
const { Colors, Icons } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Manage bot configuration (Admin).')
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Set a config key/value pair.')
      .addStringOption((option) => option.setName('key').setDescription('Config key').setRequired(true))
      .addStringOption((option) => option.setName('value').setDescription('Config value').setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('View a config value.')
      .addStringOption((option) => option.setName('key').setDescription('Config key').setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'Access denied, Tenno. Insufficient clearance.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'get') {
      const key = interaction.options.getString('key', true);
      const value = await getConfig(key);
      const embed = new EmbedBuilder()
        .setColor(Colors.TENNO)
        .setAuthor({ name: 'Configuration', iconURL: Icons.CODEX })
        .addFields({ name: key, value: value ?? '*not set*' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const key = interaction.options.getString('key', true);
    const value = interaction.options.getString('value', true);
    await setConfig(key, value);
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setAuthor({ name: 'Configuration Updated', iconURL: Icons.CODEX })
      .addFields({ name: key, value })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
};
