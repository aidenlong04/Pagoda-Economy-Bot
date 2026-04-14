const { SlashCommandBuilder } = require('discord.js');
const { createEvent } = require('../services/eventService');
const { isAdmin } = require('../services/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage AP events.')
    .addSubcommand((subcommand) => subcommand
      .setName('create')
      .setDescription('Create a timed event.')
      .addStringOption((option) => option.setName('name').setDescription('Event name').setRequired(true))
      .addStringOption((option) => option.setName('description').setDescription('Description').setRequired(true))
      .addStringOption((option) => option.setName('start').setDescription('ISO start time').setRequired(true))
      .addStringOption((option) => option.setName('end').setDescription('ISO end time').setRequired(true))
      .addIntegerOption((option) => option.setName('reward').setDescription('AP reward').setRequired(true).setMinValue(1))
      .addStringOption((option) => option
        .setName('condition')
        .setDescription('Condition type')
        .setRequired(true)
        .addChoices(
          { name: 'Minimum unique participants', value: 'MIN_UNIQUE_PARTICIPANTS' },
          { name: 'Individual interaction threshold', value: 'INDIVIDUAL_INTERACTION_THRESHOLD' }
        ))
      .addIntegerOption((option) => option.setName('condition_value').setDescription('Condition value').setRequired(true).setMinValue(1))
      .addStringOption((option) => option.setName('channels').setDescription('Comma-separated channel IDs').setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const start = new Date(interaction.options.getString('start', true));
    const end = new Date(interaction.options.getString('end', true));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return interaction.reply({ content: 'Invalid start/end date values.', ephemeral: true });
    }

    const event = await createEvent({
      name: interaction.options.getString('name', true),
      description: interaction.options.getString('description', true),
      startTime: start,
      endTime: end,
      rewardAp: interaction.options.getInteger('reward', true),
      conditionType: interaction.options.getString('condition', true),
      conditionValue: interaction.options.getInteger('condition_value', true),
      channelIds: interaction.options.getString('channels', true).split(',').map((value) => value.trim()).filter(Boolean)
    });

    return interaction.reply({
      content: `Event created: **${event.name}** (ID: \`${event.id}\`)\nTracking URL: \`/api/events/${event.id}/track?user=<discordId>\``
    });
  }
};
