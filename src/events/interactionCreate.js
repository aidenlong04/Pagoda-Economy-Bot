const { commands } = require('../commands');
const { handleComponentInteraction, handleSelectMenuInteraction } = require('./componentHandler');
const logger = require('../logger');

const commandMap = new Map(commands.map((command) => [command.data.name, command]));

module.exports = async function onInteractionCreate(interaction) {
  // ── Autocomplete handling (used by /market buy) ──────────────────────────
  if (interaction.isAutocomplete()) {
    const command = commandMap.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        logger.warn('Autocomplete failed', { command: interaction.commandName, error: error.message });
      }
    }
    return;
  }

  // ── Button interactions ──────────────────────────────────────────────────
  if (interaction.isButton()) {
    try {
      await handleComponentInteraction(interaction);
    } catch (error) {
      logger.error('Button interaction failed', { customId: interaction.customId, error: error.message });
      const msg = { content: `Error: ${error.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => null);
      } else {
        await interaction.reply(msg).catch(() => null);
      }
    }
    return;
  }

  // ── Select menu interactions ─────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    try {
      await handleSelectMenuInteraction(interaction);
    } catch (error) {
      logger.error('Select menu interaction failed', { customId: interaction.customId, error: error.message });
      const msg = { content: `Error: ${error.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => null);
      } else {
        await interaction.reply(msg).catch(() => null);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandMap.get(interaction.commandName);
  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Command execution failed', { command: interaction.commandName, error: error.message });
    const msg = { content: `Error: ${error.message}`, ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => null);
    } else {
      await interaction.reply(msg).catch(() => null);
    }
  }
};
