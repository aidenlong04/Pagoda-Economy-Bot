/**
 * Warframe Theme — Centralized visual constants for all Discord embeds.
 *
 * Pulls aesthetic inspiration from the Warframe universe via the
 * aidenlong04/warframe-item-pull data set (faction icons, color palette,
 * terminology). All bot embeds reference these constants so the theme
 * can be changed in one place.
 */

// ── Faction Colors (hex integers for discord.js EmbedBuilder) ──────────────
const Colors = {
  TENNO:    0x00BFFF,  // Bright cyan — primary Tenno HUD color
  LOTUS:    0x7B68EE,  // Medium slate blue — The Lotus / guidance
  OROKIN:   0xFFD700,  // Gold — Orokin legacy / prestige
  GRINEER:  0xCC3300,  // Dark red — Grineer faction
  CORPUS:   0x3399FF,  // Corporate blue — Corpus faction
  INFESTED: 0x66CC33,  // Toxic green — Infested faction
  VOID:     0xE0C8FF,  // Pale lavender — Void energy
  SUCCESS:  0x00FF7F,  // Spring green — success states
  WARNING:  0xFFA500,  // Orange — warnings
  ERROR:    0xFF4444,  // Red — errors
};

// ── Icon URLs ──────────────────────────────────────────────────────────────
// PAGODA_EMBLEM: Golden Pagoda alliance emblem — used as the primary
// Alliance Standing icon across all economy/standing embeds.
// Other icons are public Warframe community CDN assets.
const Icons = {
  PAGODA_EMBLEM: 'https://github.com/user-attachments/assets/0271f28e-83e5-44af-82c6-b787f31df8f6',
  LOTUS:         'https://cdn.warframestat.us/img/lotus.png',
  TENNO:         'https://cdn.warframestat.us/img/tenno.png',
  ALLIANCE:      'https://cdn.warframestat.us/img/alliance.png',
  CREDITS:       'https://cdn.warframestat.us/img/credits.png',
  VOID_RELIC:    'https://cdn.warframestat.us/img/void-relic.png',
  CODEX:         'https://cdn.warframestat.us/img/codex.png',
};

// ── Terminology mapping ────────────────────────────────────────────────────
// Warframe-flavored names for bot concepts.
const Terms = {
  CURRENCY_NAME:   'Alliance Standing',
  CURRENCY_ABBREV: 'AP',
  SHOP_NAME:       'Tenno Market',
  QUEST_LABEL:     'Codex Missions',
  ACHIEVEMENT:     'Mastery Challenge',
  LEADERBOARD:     'Clan Leaderboard',
  EVENT:           'Tactical Alert',
  INVENTORY:       'Arsenal',
  BALANCE:         'Standing',
};

// ── Flavor text pools (randomly selected per embed for variety) ────────────
const Flavor = {
  QUEST_COMPLETE: [
    'Mission complete, Tenno. Well done.',
    'Ordis is pleased with your performance!',
    'The Origin System is safer thanks to you.',
    'Objective achieved. Extraction available.',
  ],
  ACHIEVEMENT_UNLOCK: [
    'Mastery rank increased! The Lotus takes notice.',
    'A new milestone reached. The Orokin would be proud.',
    'Your legend grows across the Origin System.',
    'Achievement unlocked. Ordis is... impressed.',
  ],
  EVENT_CLOSE: [
    'Tactical Alert concluded. Reviewing field data.',
    'Operation complete. Distributing rewards to qualified Tenno.',
    'The mission is over. Let\'s see who made the cut.',
  ],
  PURCHASE: [
    'Transaction confirmed. Check your Arsenal.',
    'Item acquired. The Tenno Market thanks you.',
    'Ordis has added the item to your inventory.',
  ],
  INSUFFICIENT_FUNDS: [
    'Insufficient Standing, Tenno. Complete more missions.',
    'The Tenno Market requires more Alliance Standing.',
  ],
};

/**
 * Pick a random entry from a flavor text array.
 */
function randomFlavor(category) {
  const pool = Flavor[category];
  if (!pool || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  Colors,
  Icons,
  Terms,
  Flavor,
  randomFlavor,
};
