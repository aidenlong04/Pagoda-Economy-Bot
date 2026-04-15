const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../db/prisma');
const { ensureUser } = require('../services/economyService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standing')
    .setDescription(`View your ${Terms.CURRENCY_NAME}.`),

  async execute(interaction) {
    return handleView(interaction);
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
      { name: 'Total Spent', value: `${user.totalSpent.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true }
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

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
