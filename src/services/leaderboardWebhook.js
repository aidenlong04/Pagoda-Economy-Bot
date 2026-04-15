/**
 * Webhook Leaderboard — Posts and edits a persistent leaderboard message
 * in a designated channel using a Discord WebhookClient.
 *
 * The webhook URL is stored in LEADERBOARD_WEBHOOK_URL env var.
 * The posted message ID is persisted in the Config table (key: LEADERBOARD_MESSAGE_ID).
 */
const { WebhookClient, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('./economyService');
const { getConfig, setConfig } = require('./configService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');
const logger = require('../logger');

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const TOP_COUNT = 25;
const CONFIG_KEY = 'LEADERBOARD_MESSAGE_ID';

function buildWebhookLeaderboardEmbed(users) {
  const now = new Date();
  const embed = new EmbedBuilder()
    .setColor(Colors.OROKIN)
    .setAuthor({ name: Terms.LEADERBOARD, iconURL: Icons.PAGODA_EMBLEM })
    .setThumbnail(Icons.PAGODA_EMBLEM)
    .setFooter({ text: `Auto-updated daily • Last refresh` })
    .setTimestamp(now);

  if (!users.length) {
    embed.setDescription('No leaderboard data yet. Get out there, Tenno!');
  } else {
    const lines = users.map((user, index) => {
      const rank = index + 1;
      const medal = RANK_MEDALS[rank - 1] || `**#${rank}**`;
      const stats = [];
      if (user.totalEarned > 0) stats.push(`📈 ${user.totalEarned.toLocaleString()} earned`);
      if (user.messageCount > 0) stats.push(`💬 ${user.messageCount.toLocaleString()} msgs`);
      if (user.questsCompleted > 0) stats.push(`📜 ${user.questsCompleted} quests`);
      const statLine = stats.length > 0 ? `\n> ${stats.join(' • ')}` : '';
      return `${medal} <@${user.discordId}> — **${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}**${statLine}`;
    });
    embed.setDescription(lines.join('\n'));
  }

  return embed;
}

function getLeaderboardChannelId() {
  return process.env.LEADERBOARD_CHANNEL_ID || null;
}

function createWebhookClient() {
  const url = process.env.LEADERBOARD_WEBHOOK_URL;
  if (!url) {
    return null;
  }
  return new WebhookClient({ url });
}

/**
 * Post or edit the persistent leaderboard message.
 * Returns true if the message was successfully posted/edited, false otherwise.
 */
async function updateWebhookLeaderboard() {
  const webhook = createWebhookClient();
  if (!webhook) {
    return false;
  }

  try {
    const users = await getLeaderboard(1, TOP_COUNT);
    const embed = buildWebhookLeaderboardEmbed(users);
    const messageId = await getConfig(CONFIG_KEY);

    if (messageId) {
      // Try to edit existing message
      try {
        await webhook.editMessage(messageId, { embeds: [embed] });
        return true;
      } catch (editError) {
        // Message may have been deleted — send a new one
        logger.warn('Failed to edit leaderboard message, posting new one', { error: editError.message });
      }
    }

    // Post a new message
    const sent = await webhook.send({
      embeds: [embed],
      username: 'Clan Leaderboard',
      avatarURL: Icons.PAGODA_EMBLEM
    });
    await setConfig(CONFIG_KEY, sent.id);
    return true;
  } catch (error) {
    logger.error('Webhook leaderboard update failed', { error: error.message });
    return false;
  } finally {
    webhook.destroy();
  }
}

module.exports = {
  buildWebhookLeaderboardEmbed,
  updateWebhookLeaderboard,
  getLeaderboardChannelId,
  CONFIG_KEY
};
