const { PrismaClient } = require('@prisma/client');

// ── Connection pool tuning (Sapphire/Dyno pattern) ────────────────────────
// By default Prisma opens num_cpus × 2 + 1 connections. For a bot that
// handles many concurrent messages we explicitly set the pool size via the
// connection string `?connection_limit=N`. This PrismaClient instance also
// enables query-level logging in development for latency diagnostics.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'query' }]
    : [],
  // Disable Prisma metrics in production to reduce CPU overhead
  ...(process.env.NODE_ENV !== 'development' && { errorFormat: 'minimal' }),
});

module.exports = prisma;
