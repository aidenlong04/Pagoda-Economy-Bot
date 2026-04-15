const { REST, Routes } = require('discord.js');
const standing = require('./standing');
const leaderboard = require('./leaderboard');
const market = require('./market');
const profile = require('./profile');
const admin = require('./admin');

const commands = [standing, leaderboard, market, profile, admin];

async function registerSlashCommands() {
  if (process.env.REGISTER_COMMANDS_ON_START !== 'true') {
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commands.map((command) => command.data.toJSON()) }
  );
}

module.exports = {
  commands,
  registerSlashCommands
};
