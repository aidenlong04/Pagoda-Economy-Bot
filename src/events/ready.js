const logger = require('../logger');

module.exports = async function onReady(client) {
  logger.info(`Logged in as ${client.user.tag}`);
};
