const prisma = require('../db/prisma');
const { ensureUser, grantAp } = require('./economyService');

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

async function recordChannelInteraction(discordChannelId, discordUserId, interactionType) {
  const now = new Date();
  const events = await prisma.economyEvent.findMany({
    where: {
      status: { in: ['ACTIVE', 'SCHEDULED'] },
      startTime: { lte: now },
      endTime: { gte: now }
    }
  });

  const targets = events.filter((event) => Array.isArray(event.channelIds) && event.channelIds.includes(discordChannelId));
  if (!targets.length) {
    return;
  }

  for (const event of targets) {
    await trackEventClick(event.id, discordUserId, interactionType);
  }
}

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
    for (const userId of qualifiedUserIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await grantAp(user.discordId, event.rewardAp, 'EVENT', 'system', { eventId: event.id, eventName: event.name });
      }
    }

    await prisma.economyEvent.update({ where: { id: event.id }, data: { status: 'CLOSED' } });
    results.push({ event, participants: userCounts.size, qualified: qualifiedUserIds.length });
  }

  return { activated: activations.count, closed: results };
}

module.exports = {
  computeQualifiedUsers,
  createEvent,
  trackEventClick,
  recordChannelInteraction,
  closeExpiredEvents
};
