const { REST, Routes } = require('discord.js');
const balance = require('./balance');
const leaderboard = require('./leaderboard');
const daily = require('./daily');
const market = require('./market');
const quests = require('./quests');
const achievements = require('./achievements');
const admin = require('./admin');

const commands = [balance, leaderboard, daily, market, quests, achievements, admin];

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
