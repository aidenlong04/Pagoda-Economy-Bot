const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { transferAp } = require('../services/economyService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription(`Transfer ${Terms.CURRENCY_ABBREV} to another Tenno.`)
    .addUserOption((option) => option.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription(`Amount of ${Terms.CURRENCY_ABBREV}`).setRequired(true)),
  async execute(interaction) {
    const recipient = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const result = await transferAp(interaction.user.id, recipient.id, amount, interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(Colors.OROKIN)
      .setAuthor({ name: 'Standing Transfer', iconURL: Icons.CREDITS })
      .setDescription(
        `<@${interaction.user.id}> transferred **${amount.toLocaleString()} ${Terms.CURRENCY_ABBREV}** to <@${recipient.id}>`
      )
      .addFields(
        { name: 'Your Balance', value: `${result.from.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true },
        { name: `${recipient.username}'s Balance`, value: `${result.to.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true }
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
