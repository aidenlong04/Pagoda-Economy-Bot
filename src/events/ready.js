const logger = require('../logger');

module.exports = async function onReady(client) {
  logger.info(`Logged in as ${client.user.tag} — Orbiter systems online.`);
  client.user.setActivity('Alliance Standing | /balance', { type: 3 }); // Watching
};
