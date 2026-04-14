const { commands } = require('../commands');
const logger = require('../logger');

const commandMap = new Map(commands.map((command) => [command.data.name, command]));

module.exports = async function onInteractionCreate(interaction) {
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
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }
};
