const express = require('express');
const prisma = require('../db/prisma');

const router = express.Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', uptime: process.uptime(), db: 'up' });
  } catch (_error) {
    res.status(503).json({ status: 'degraded', uptime: process.uptime(), db: 'down' });
  }
});

module.exports = router;
