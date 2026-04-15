require('dotenv').config();
const express = require('express');
const healthRoute = require('./routes/health');
const eventsRoute = require('./routes/events');
const prisma = require('./db/prisma');
const logger = require('./logger');
const { createBot } = require('./bot');
const { registerSlashCommands } = require('./commands');

async function main() {
  await registerSlashCommands();

  const app = express();
  app.use(express.json());
  app.use(healthRoute);
  app.use(eventsRoute);

  const port = parseInt(process.env.PORT || '3000', 10);
  const server = app.listen(port, () => {
    logger.info(`HTTP server listening on port ${port}`);
  });

  const bot = createBot();
  await bot.login(process.env.DISCORD_TOKEN);

  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close();
    await bot.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection', { error: error?.message || String(error) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error?.message || String(error) });
  });
}

main().catch(async (error) => {
  logger.error('Startup failed', { error: error.message });
  await prisma.$disconnect();
  process.exit(1);
});
