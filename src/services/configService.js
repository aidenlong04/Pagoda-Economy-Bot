const prisma = require('../db/prisma');
const defaults = require('../config/defaultConfig');

// ── In-memory config cache (Dyno/Carl-bot pattern) ────────────────────────
// Config values rarely change; caching avoids DB round-trips on every
// message/interaction. TTL keeps cache fresh when admins update config.
const CONFIG_CACHE_TTL_MS = 60_000; // 1 minute
const configCache = new Map(); // key → { value, expiresAt }

async function getConfig(key) {
  const cached = configCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const row = await prisma.config.findUnique({ where: { key } });
  const value = row ? row.value : (defaults[key] ?? null);
  configCache.set(key, { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS });
  return value;
}

async function setConfig(key, value) {
  const result = await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  // Immediately update cache on write so reads reflect changes
  configCache.set(key, { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS });
  return result;
}

/**
 * Batch-fetch multiple config keys in a single DB query.
 * Returns a Map<string, string> of key→value.
 */
async function getConfigBatch(keys) {
  const now = Date.now();
  const result = new Map();
  const missingKeys = [];

  for (const key of keys) {
    const cached = configCache.get(key);
    if (cached && now < cached.expiresAt) {
      result.set(key, cached.value);
    } else {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    const rows = await prisma.config.findMany({
      where: { key: { in: missingKeys } }
    });
    const rowMap = new Map(rows.map((r) => [r.key, r.value]));

    for (const key of missingKeys) {
      const value = rowMap.get(key) ?? (defaults[key] ?? null);
      configCache.set(key, { value, expiresAt: now + CONFIG_CACHE_TTL_MS });
      result.set(key, value);
    }
  }

  return result;
}

/** Clear all cached config entries (useful for testing). */
function clearConfigCache() {
  configCache.clear();
}

module.exports = {
  getConfig,
  setConfig,
  getConfigBatch,
  clearConfigCache
};
