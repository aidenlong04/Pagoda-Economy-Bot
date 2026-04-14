/**
 * Handles Discord message component interactions (buttons, select menus).
 * Each handler receives the interaction and performs the appropriate action.
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, claimDaily, getLeaderboard, ensureUser } = require('../services/economyService');
const prisma = require('../db/prisma');
const { getQuestsForUser } = require('../services/questService');
const { getAchievementProgress } = require('../services/achievementService');
const { listShopItems, buyItem, getInventory } = require('../services/shopService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');
const { buildLeaderboardEmbed, buildPaginationRow, PAGE_SIZE } = require('../commands/leaderboard');

const TYPE_ICONS = { DAILY: '📋', WEEKLY: '📅', CUSTOM: '⭐' };
const CATEGORY_ICONS = { EARNING: '💰', SPENDING: '🛒', ACTIVITY: '💬', QUEST: '📜' };
const ACTION_LABELS = { ROLE_GRANT: '🏷️ Role', CUSTOM_RESPONSE: '💬 Message', INVENTORY_ITEM: '📦 Item' };

// ── Button Handlers ────────────────────────────────────────────────────────

async function handleStandingView(interaction) {
  const user = await ensureUser(interaction.user.id);

  const recentTxns = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    take: 5
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: Terms.BALANCE, iconURL: Icons.CREDITS })
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

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleStandingDaily(interaction) {
  const result = await claimDaily(interaction.user.id);

  if (!result.claimed) {
    const hours = Math.floor(result.remainingSeconds / 3600);
    const minutes = Math.floor((result.remainingSeconds % 3600) / 60);
    const embed = new EmbedBuilder()
      .setColor(Colors.WARNING)
      .setAuthor({ name: Terms.DAILY, iconURL: Icons.LOTUS })
      .setDescription(`You've already collected today's tribute.\nTry again in **${hours}h ${minutes}m**.`)
      .setTimestamp();
    return interaction.update({ embeds: [embed], components: [] });
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

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleLeaderboardPage(interaction, page) {
  const users = await getLeaderboard(page, PAGE_SIZE);
  const embed = buildLeaderboardEmbed(users, page);
  const row = buildPaginationRow(page, users.length === PAGE_SIZE);
  await interaction.update({ embeds: [embed], components: [row] });
}

function buildProfileNavRow(activeSub) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('profile:missions')
      .setLabel('Missions')
      .setStyle(activeSub === 'missions' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📋')
      .setDisabled(activeSub === 'missions'),
    new ButtonBuilder()
      .setCustomId('profile:mastery')
      .setLabel('Mastery')
      .setStyle(activeSub === 'mastery' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🏆')
      .setDisabled(activeSub === 'mastery')
  );
}

async function handleProfileMissions(interaction) {
  const quests = await getQuestsForUser(interaction.user.id);
  const embed = new EmbedBuilder()
    .setColor(Colors.LOTUS)
    .setAuthor({ name: Terms.QUEST_LABEL, iconURL: Icons.CODEX })
    .setThumbnail(Icons.LOTUS)
    .setTimestamp();

  if (!quests.length) {
    embed.setDescription('No active missions in your Codex, Tenno.');
  } else {
    const lines = quests.map((quest) => {
      const icon = TYPE_ICONS[quest.type] || '•';
      const state = quest.completed ? '✅ **Completed**' : quest.progressBar;
      return `${icon} **${quest.title}** (${quest.type})\n${state}\nReward: \`${quest.rewardAp} ${Terms.CURRENCY_ABBREV}\``;
    });
    embed.setDescription(lines.join('\n\n'));
  }

  embed.setFooter({ text: 'Progress updates automatically as you interact' });
  await interaction.update({ embeds: [embed], components: [buildProfileNavRow('missions')] });
}

async function handleProfileMastery(interaction) {
  const rows = await getAchievementProgress(interaction.user.id);
  const embed = new EmbedBuilder()
    .setColor(Colors.OROKIN)
    .setAuthor({ name: `${Terms.ACHIEVEMENT}s`, iconURL: Icons.CODEX })
    .setThumbnail(Icons.TENNO)
    .setTimestamp();

  if (!rows.length) {
    embed.setDescription('No Mastery Challenges configured yet.');
  } else {
    const lines = rows.map((row) => {
      const icon = CATEGORY_ICONS[row.category] || '•';
      if (row.unlockedAt) {
        return `${icon} ✅ **${row.name}** — unlocked <t:${Math.floor(new Date(row.unlockedAt).getTime() / 1000)}:R>`;
      }
      const pct = row.threshold > 0 ? Math.min(100, Math.round((row.current / row.threshold) * 100)) : 0;
      return `${icon} ⬜ **${row.name}** — ${row.current.toLocaleString()}/${row.threshold.toLocaleString()} (${pct}%) • \`${row.rewardAp} ${Terms.CURRENCY_ABBREV}\``;
    });
    embed.setDescription(lines.join('\n'));
  }

  embed.setFooter({ text: 'Achievements unlock automatically as you progress' });
  await interaction.update({ embeds: [embed], components: [buildProfileNavRow('mastery')] });
}

async function handleMarketBrowse(interaction) {
  const items = await listShopItems();
  const embed = new EmbedBuilder()
    .setColor(Colors.CORPUS)
    .setAuthor({ name: Terms.SHOP_NAME, iconURL: Icons.CREDITS })
    .setThumbnail(Icons.VOID_RELIC)
    .setTimestamp();

  if (!items.length) {
    embed.setDescription('The market is empty. Check back later, Tenno.');
    return interaction.update({ embeds: [embed], components: [] });
  }

  const lines = items.map((item) => {
    const stock = item.stock === null ? '∞' : item.stock;
    const repeat = item.repeatable ? 'repeatable' : 'one-time';
    const tag = ACTION_LABELS[item.actionType] || '❓';
    return `${tag} **${item.name}** — \`${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}\`\n` +
      `${item.description}\n` +
      `*Stock: ${stock} • ${repeat}*`;
  });
  embed.setDescription(lines.join('\n\n'));
  embed.setFooter({ text: 'Use the menu below or /market buy <item> to purchase' });

  const { StringSelectMenuBuilder } = require('discord.js');
  const components = [];

  if (items.length <= 25) {
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('market:buy')
        .setPlaceholder('Quick buy — select an item…')
        .addOptions(items.map((item) => ({
          label: item.name,
          description: `${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}${item.stock !== null ? ` • ${item.stock} left` : ''}`,
          value: item.name,
          emoji: ACTION_LABELS[item.actionType]?.charAt(0) || '❓'
        })))
    );
    components.push(selectRow);
  }

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('market:inventory')
      .setLabel('View Arsenal')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎒')
  );
  components.push(navRow);

  await interaction.update({ embeds: [embed], components });
}

async function handleMarketBuy(interaction, itemName) {
  await interaction.deferUpdate();
  const item = await buyItem({
    discordId: interaction.user.id,
    itemName,
    member: interaction.member,
    channel: interaction.channel
  });
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: 'Purchase Complete', iconURL: Icons.CREDITS })
    .setDescription(
      `Acquired **${item.name}** for **${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}**\n\n` +
      `*${randomFlavor('PURCHASE')}*`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('market:browse')
      .setLabel('Back to Market')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪'),
    new ButtonBuilder()
      .setCustomId('market:inventory')
      .setLabel('View Arsenal')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎒')
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleMarketInventory(interaction) {
  const items = await getInventory(interaction.user.id);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: Terms.INVENTORY, iconURL: Icons.CODEX })
    .setTimestamp();

  if (!items.length) {
    embed.setDescription('Your Arsenal is empty, Tenno.');
  } else {
    embed.setDescription(
      items.map((item) => `• **${item.itemName}** ×${item.quantity}`).join('\n')
    );
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('market:browse')
      .setLabel('Browse Market')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪')
  );

  await interaction.update({ embeds: [embed], components: [row] });
}

// ── Router ─────────────────────────────────────────────────────────────────

async function handleComponentInteraction(interaction) {
  const customId = interaction.customId;

  // Standing buttons
  if (customId === 'standing:view') return handleStandingView(interaction);
  if (customId === 'standing:daily') return handleStandingDaily(interaction);

  // Leaderboard pagination
  if (customId.startsWith('leaderboard:')) {
    const page = parseInt(customId.split(':')[1], 10);
    if (!Number.isNaN(page) && page >= 1) {
      return handleLeaderboardPage(interaction, page);
    }
  }

  // Profile navigation
  if (customId === 'profile:missions') return handleProfileMissions(interaction);
  if (customId === 'profile:mastery') return handleProfileMastery(interaction);

  // Market buttons
  if (customId === 'market:browse') return handleMarketBrowse(interaction);
  if (customId === 'market:inventory') return handleMarketInventory(interaction);

  return null;
}

async function handleSelectMenuInteraction(interaction) {
  const customId = interaction.customId;

  if (customId === 'market:buy') {
    const itemName = interaction.values[0];
    return handleMarketBuy(interaction, itemName);
  }

  return null;
}

module.exports = {
  handleComponentInteraction,
  handleSelectMenuInteraction
};
