const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getQuestsForUser } = require('../services/questService');
const { getAchievementProgress } = require('../services/achievementService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const TYPE_ICONS = {
  DAILY: '📋',
  WEEKLY: '📅',
  CUSTOM: '⭐',
};

const CATEGORY_ICONS = {
  EARNING: '💰',
  SPENDING: '🛒',
  ACTIVITY: '💬',
  QUEST: '📜',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your Codex — missions and mastery progress.')
    .addSubcommand((sub) => sub
      .setName('missions')
      .setDescription(`View your active ${Terms.QUEST_LABEL} progress.`))
    .addSubcommand((sub) => sub
      .setName('mastery')
      .setDescription(`View your ${Terms.ACHIEVEMENT} progress.`)),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'missions') return handleMissions(interaction);
    if (sub === 'mastery') return handleMastery(interaction);
  }
};

function buildNavigationRow(activeSub) {
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

async function handleMissions(interaction) {
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
  const row = buildNavigationRow('missions');
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleMastery(interaction) {
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
  const row = buildNavigationRow('mastery');
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
