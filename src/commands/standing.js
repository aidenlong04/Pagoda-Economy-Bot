const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, claimDaily } = require('../services/economyService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standing')
    .setDescription(`View and manage your ${Terms.CURRENCY_NAME}.`)
    .addSubcommand((sub) => sub
      .setName('view')
      .setDescription(`Show your ${Terms.CURRENCY_NAME} balance.`))
    .addSubcommand((sub) => sub
      .setName('daily')
      .setDescription(`Claim your ${Terms.DAILY} reward.`)),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'view') return handleView(interaction);
    if (sub === 'daily') return handleDaily(interaction);
  }
};

async function handleView(interaction) {
  const balance = await getBalance(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: Terms.BALANCE, iconURL: Icons.CREDITS })
    .setDescription(`<@${interaction.user.id}>\n\n**${balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`)
    .setFooter({ text: Terms.CURRENCY_NAME })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('standing:daily')
      .setLabel(`Claim ${Terms.DAILY}`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎁')
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleDaily(interaction) {
  const result = await claimDaily(interaction.user.id);

  if (!result.claimed) {
    const hours = Math.floor(result.remainingSeconds / 3600);
    const minutes = Math.floor((result.remainingSeconds % 3600) / 60);
    const embed = new EmbedBuilder()
      .setColor(Colors.WARNING)
      .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
      .setDescription(`You've already collected today's tribute.\nTry again in **${hours}h ${minutes}m**.`)
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
    .setDescription(
      `**+${result.reward.toLocaleString()} ${Terms.CURRENCY_ABBREV}**\n\n*${randomFlavor('DAILY_CLAIM')}*`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('standing:view')
      .setLabel('View Balance')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('💰')
  );

  return interaction.reply({ embeds: [embed], components: [row] });
}
