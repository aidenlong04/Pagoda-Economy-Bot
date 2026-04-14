const { Client, GatewayIntentBits, Partials, Options, ActivityType } = require('discord.js');
const cron = require('node-cron');
const onInteractionCreate = require('./events/interactionCreate');
const onMessageCreate = require('./events/messageCreate');
const onMessageReactionAdd = require('./events/messageReactionAdd');
const onVoiceStateUpdate = require('./events/voiceStateUpdate');
const onReady = require('./events/ready');
const { closeExpiredEvents } = require('./services/eventService');
const { deactivateExpiredQuests, resetRecurringQuests } = require('./services/questService');
const { updateWebhookLeaderboard } = require('./services/leaderboardWebhook');
const logger = require('./logger');

function createBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    // Cache sweepers — keep memory bounded per Discord.js recommendations
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 300,   // every 5 min
        lifetime: 600,   // discard messages older than 10 min
      },
    },
  });

  client.on('ready', () => onReady(client));
  client.on('interactionCreate', onInteractionCreate);
  client.on('messageCreate', onMessageCreate);
  client.on('messageReactionAdd', onMessageReactionAdd);
  client.on('voiceStateUpdate', onVoiceStateUpdate);

  // Cron: every minute, check for event state transitions + quest expiry/reset
  cron.schedule('* * * * *', async () => {
    try {
      const status = await closeExpiredEvents();

      // Post rich summary embeds to each event's monitored channels
      for (const result of status.closed) {
        for (const channelId of result.channelIds) {
          try {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
              await channel.send({ embeds: [result.summaryEmbed] });
            }
          } catch (err) {
            logger.warn('Failed to post event summary to channel', { channelId, error: err.message });
          }
        }
      }

      if (status.activated || status.closed.length) {
        logger.info('Processed event scheduler tick', {
          activated: status.activated,
          closed: status.closed.length,
        });
      }

      // Deactivate expired quests and reset recurring quest progress
      const expired = await deactivateExpiredQuests();
      const reset = await resetRecurringQuests();
      if (expired || reset) {
        logger.info('Quest maintenance tick', { expired, reset });
      }
    } catch (error) {
      logger.error('Event scheduler failed', { error: error.message });
    }
  });

  // Cron: daily at midnight UTC, update the persistent webhook leaderboard
  cron.schedule('0 0 * * *', async () => {
    try {
      const updated = await updateWebhookLeaderboard();
      if (updated) {
        logger.info('Webhook leaderboard updated successfully');
      }
    } catch (error) {
      logger.error('Webhook leaderboard cron failed', { error: error.message });
    }
  });

  return client;
}

module.exports = { createBot };
