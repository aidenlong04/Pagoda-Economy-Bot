const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, claimDaily } = require('../services/economyService');
const prisma = require('../db/prisma');
const { ensureUser } = require('../services/economyService');
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
  const user = await ensureUser(interaction.user.id);

  // Fetch recent transactions (last 5)
  const recentTxns = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    take: 5
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: Terms.BALANCE, iconURL: Icons.PAGODA_EMBLEM })
    .setThumbnail(Icons.PAGODA_EMBLEM)
    .setDescription(`<@${interaction.user.id}>\n\n**${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`)
    .addFields(
      { name: 'Total Earned', value: `${user.totalEarned.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Total Spent', value: `${user.totalSpent.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Daily Streak', value: `🔥 ${user.daysActiveStreak} day${user.daysActiveStreak !== 1 ? 's' : ''}`, inline: true }
    )
    .setFooter({ text: Terms.CURRENCY_NAME })
    .setTimestamp();

  if (recentTxns.length > 0) {
    const txnLines = recentTxns.map((txn) => {
      const sign = txn.amount >= 0 ? '+' : '';
      const ts = Math.floor(txn.timestamp.getTime() / 1000);
      return `\`${sign}${txn.amount}\` ${Terms.CURRENCY_ABBREV} — ${txn.source.toLowerCase()} <t:${ts}:R>`;
    });
    embed.addFields({ name: 'Recent Activity', value: txnLines.join('\n') });
  }

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

  let description = `**+${result.reward.toLocaleString()} ${Terms.CURRENCY_ABBREV}**`;
  if (result.bonus > 0) {
    description += `\n*Base: ${result.baseReward} + Streak Bonus: ${result.bonus}*`;
  }
  description += `\n🔥 **${result.streak}-day streak!**`;
  description += `\n\n*${randomFlavor('DAILY_CLAIM')}*`;

  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
    .setDescription(description)
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
