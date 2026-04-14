/**
 * Centralized embed builders — eliminates repeated EmbedBuilder boilerplate
 * across all commands. Every bot embed flows through these helpers so theming,
 * footer, and timestamp are always consistent.
 */
const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../config/warframeTheme');

/**
 * Base themed embed with color, author, timestamp.
 */
function themed(color, authorName, iconURL) {
  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: authorName, iconURL })
    .setTimestamp();
}

/** Success embed (green) */
function success(title, description) {
  return themed(Colors.SUCCESS, title, Icons.LOTUS).setDescription(description);
}

/** Warning embed (orange) */
function warning(title, description) {
  return themed(Colors.WARNING, title, Icons.LOTUS).setDescription(description);
}

/** Error embed (red) */
function error(title, description) {
  return themed(Colors.ERROR, title, Icons.LOTUS).setDescription(description);
}

/** Info embed (cyan) */
function info(title, description) {
  return themed(Colors.TENNO, title, Icons.CODEX).setDescription(description);
}

/** Economy/shop embed (Corpus blue) */
function market(title, description) {
  return themed(Colors.CORPUS, title, Icons.CREDITS).setDescription(description);
}

/** Prestige/gold embed */
function prestige(title, description) {
  return themed(Colors.OROKIN, title, Icons.PAGODA_EMBLEM).setDescription(description);
}

module.exports = { themed, success, warning, error, info, market, prestige };
