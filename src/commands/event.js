const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createEvent } = require('../services/eventService');
const { isAdmin } = require('../services/permissions');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription(`Manage ${Terms.EVENT}s (Admin).`)
    .addSubcommand((subcommand) => subcommand
      .setName('create')
      .setDescription(`Create a timed ${Terms.EVENT}.`)
      .addStringOption((option) => option.setName('name').setDescription('Event name').setRequired(true))
      .addStringOption((option) => option.setName('description').setDescription('Description').setRequired(true))
      .addStringOption((option) => option.setName('start').setDescription('ISO start time').setRequired(true))
      .addStringOption((option) => option.setName('end').setDescription('ISO end time').setRequired(true))
      .addIntegerOption((option) => option.setName('reward').setDescription(`${Terms.CURRENCY_ABBREV} reward`).setRequired(true).setMinValue(1))
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
      return interaction.reply({ content: 'Access denied, Tenno. Insufficient clearance.', ephemeral: true });
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
      channelIds: interaction.options.getString('channels', true).split(',').map((v) => v.trim()).filter(Boolean)
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.LOTUS)
      .setAuthor({ name: `${Terms.EVENT} Created`, iconURL: Icons.LOTUS })
      .setTitle(event.name)
      .setDescription(event.description)
      .addFields(
        { name: 'Start', value: `<t:${Math.floor(start.getTime() / 1000)}:F>`, inline: true },
        { name: 'End', value: `<t:${Math.floor(end.getTime() / 1000)}:F>`, inline: true },
        { name: 'Reward', value: `${event.rewardAp} ${Terms.CURRENCY_ABBREV}`, inline: true },
        { name: 'Condition', value: `${event.conditionType.replace(/_/g, ' ')} ≥ ${event.conditionValue}` },
        { name: 'Tracking URL', value: `\`/api/events/${event.id}/track?user=<discordId>\`` }
      )
      .setFooter({ text: `Event ID: ${event.id}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
