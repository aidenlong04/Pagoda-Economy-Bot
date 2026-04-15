const { EmbedBuilder } = require('discord.js');
const prisma = require('../db/prisma');
const { ensureUser, grantAp } = require('./economyService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');

function computeQualifiedUsers(event, userCounts, uniqueCount) {
  if (event.conditionType === 'MIN_UNIQUE_PARTICIPANTS') {
    if (uniqueCount < event.conditionValue) {
      return [];
    }
    return Array.from(userCounts.keys());
  }

  if (event.conditionType === 'INDIVIDUAL_INTERACTION_THRESHOLD') {
    return Array.from(userCounts.entries())
      .filter(([, count]) => count >= event.conditionValue)
      .map(([userId]) => userId);
  }

  return [];
}

/**
 * Build a rich embed summarizing a closed event's results.
 */
function buildEventSummaryEmbed(event, participants, qualified, qualifiedDiscordIds) {
  const embed = new EmbedBuilder()
    .setColor(qualified > 0 ? Colors.SUCCESS : Colors.WARNING)
    .setAuthor({ name: `${Terms.EVENT} Concluded`, iconURL: Icons.LOTUS })
    .setTitle(event.name)
    .setDescription(
      `${event.description}\n\n*${randomFlavor('EVENT_CLOSE')}*`
    )
    .addFields(
      { name: 'Duration', value: `<t:${ts(event.startTime)}:F> → <t:${ts(event.endTime)}:F>`, inline: false },
      { name: 'Total Participants', value: String(participants), inline: true },
      { name: 'Qualified Tenno', value: String(qualified), inline: true },
      { name: 'Reward', value: `${event.rewardAp} ${Terms.CURRENCY_ABBREV} each`, inline: true },
      { name: 'Condition', value: `${event.conditionType.replace(/_/g, ' ')} ≥ ${event.conditionValue}`, inline: false }
    )
    .setTimestamp();

  if (qualifiedDiscordIds.length > 0 && qualifiedDiscordIds.length <= 30) {
    embed.addFields({
      name: 'Rewarded Tenno',
      value: qualifiedDiscordIds.map((id) => `<@${id}>`).join(', ')
    });
  } else if (qualifiedDiscordIds.length > 30) {
    embed.addFields({
      name: 'Rewarded Tenno',
      value: `${qualifiedDiscordIds.slice(0, 30).map((id) => `<@${id}>`).join(', ')}\n...and ${qualifiedDiscordIds.length - 30} more`
    });
  }

  embed.setFooter({ text: `Event ID: ${event.id}` });
  return embed;
}

function ts(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

async function createEvent(data) {
  return prisma.economyEvent.create({
    data: {
      name: data.name,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      rewardAp: data.rewardAp,
      channelIds: data.channelIds,
      conditionType: data.conditionType,
      conditionValue: data.conditionValue,
      status: data.startTime <= new Date() ? 'ACTIVE' : 'SCHEDULED'
    }
  });
}

async function trackEventClick(eventId, discordId, interactionType = 'URL_CLICK') {
  const event = await prisma.economyEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new Error('Event not found');
  }

  const now = new Date();
  if (now < event.startTime || now > event.endTime) {
    return { tracked: false, reason: 'outside_event_window' };
  }

  const user = await ensureUser(discordId);
  await prisma.eventInteraction.create({
    data: {
      eventId: event.id,
      userId: user.id,
      interactionType
    }
  });

  return { tracked: true };
}

// ── Active event cache ─────────────────────────────────────────────────────
// recordChannelInteraction runs on every message. Caching active events avoids
// a DB query per message when no events are running (the common case).
let activeEventCache = null;
let activeEventCacheExpiresAt = 0;
const ACTIVE_EVENT_CACHE_TTL_MS = 30_000; // 30 seconds

async function getActiveEvents() {
  const now = Date.now();
  if (activeEventCache && now < activeEventCacheExpiresAt) {
    return activeEventCache;
  }
  const dbNow = new Date();
  activeEventCache = await prisma.economyEvent.findMany({
    where: {
      status: { in: ['ACTIVE', 'SCHEDULED'] },
      startTime: { lte: dbNow },
      endTime: { gte: dbNow }
    }
  });
  activeEventCacheExpiresAt = now + ACTIVE_EVENT_CACHE_TTL_MS;
  return activeEventCache;
}

async function recordChannelInteraction(discordChannelId, discordUserId, interactionType) {
  const events = await getActiveEvents();
  if (events.length === 0) return; // Fast path: no active events

  const targets = events.filter((event) => Array.isArray(event.channelIds) && event.channelIds.includes(discordChannelId));
  if (!targets.length) {
    return;
  }

  // Record interactions in parallel for multiple matching events
  await Promise.all(
    targets.map((event) => trackEventClick(event.id, discordUserId, interactionType))
  );
}

/**
 * Close expired events, award AP, and return structured results
 * including per-channel summary embeds.
 */
async function closeExpiredEvents() {
  const now = new Date();
  const activations = await prisma.economyEvent.updateMany({
    where: { status: 'SCHEDULED', startTime: { lte: now } },
    data: { status: 'ACTIVE' }
  });

  const closable = await prisma.economyEvent.findMany({
    where: { status: 'ACTIVE', endTime: { lt: now } }
  });

  const results = [];
  for (const event of closable) {
    const interactions = await prisma.eventInteraction.findMany({ where: { eventId: event.id } });
    const userCounts = new Map();
    for (const interaction of interactions) {
      userCounts.set(interaction.userId, (userCounts.get(interaction.userId) || 0) + 1);
    }

    const qualifiedUserIds = computeQualifiedUsers(event, userCounts, userCounts.size);

    // Batch-fetch all qualified users in a single query instead of N individual lookups
    const qualifiedUsers = qualifiedUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: qualifiedUserIds } } })
      : [];

    const qualifiedDiscordIds = [];
    for (const user of qualifiedUsers) {
      await grantAp(user.discordId, event.rewardAp, 'EVENT', 'system', { eventId: event.id, eventName: event.name });
      qualifiedDiscordIds.push(user.discordId);
    }

    await prisma.economyEvent.update({ where: { id: event.id }, data: { status: 'CLOSED' } });

    const summaryEmbed = buildEventSummaryEmbed(
      event,
      userCounts.size,
      qualifiedUserIds.length,
      qualifiedDiscordIds
    );

    results.push({
      event,
      participants: userCounts.size,
      qualified: qualifiedUserIds.length,
      summaryEmbed,
      channelIds: Array.isArray(event.channelIds) ? event.channelIds : [],
    });
  }

  return { activated: activations.count, closed: results };
}

module.exports = {
  computeQualifiedUsers,
  buildEventSummaryEmbed,
  createEvent,
  trackEventClick,
  recordChannelInteraction,
  closeExpiredEvents
};
