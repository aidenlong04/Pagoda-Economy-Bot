const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cron = require('node-cron');
const onInteractionCreate = require('./events/interactionCreate');
const onMessageCreate = require('./events/messageCreate');
const onMessageReactionAdd = require('./events/messageReactionAdd');
const onVoiceStateUpdate = require('./events/voiceStateUpdate');
const onReady = require('./events/ready');
const { closeExpiredEvents } = require('./services/eventService');
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
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
  });

  client.on('ready', () => onReady(client));
  client.on('interactionCreate', onInteractionCreate);
  client.on('messageCreate', onMessageCreate);
  client.on('messageReactionAdd', onMessageReactionAdd);
  client.on('voiceStateUpdate', onVoiceStateUpdate);

  cron.schedule('* * * * *', async () => {
    try {
      const status = await closeExpiredEvents();
      if (status.activated || status.closed.length) {
        logger.info('Processed event scheduler tick', status);
      }
    } catch (error) {
      logger.error('Event scheduler failed', { error: error.message });
    }
  });

  return client;
}

module.exports = { createBot };
