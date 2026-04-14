const prisma = require('../db/prisma');
const defaults = require('../config/defaultConfig');

async function getConfig(key) {
  const row = await prisma.config.findUnique({ where: { key } });
  if (row) {
    return row.value;
  }
  return defaults[key] ?? null;
}

async function setConfig(key, value) {
  return prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

module.exports = {
  getConfig,
  setConfig
};
