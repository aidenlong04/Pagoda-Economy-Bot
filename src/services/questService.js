const prisma = require('../db/prisma');
const { ensureUser, grantAp } = require('./economyService');
const logger = require('../logger');

function formatProgressBar(current, target, size = 12) {
  const ratio = Math.max(0, Math.min(1, current / target));
  const filled = Math.round(ratio * size);
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${current}/${target}`;
}

/**
 * Get active, non-expired quests visible to a user.
 */
async function getQuestsForUser(discordId) {
  const user = await ensureUser(discordId);
  const now = new Date();
  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      OR: [{ assignedTo: null }, { assignedTo: discordId }],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
      ]
    },
    orderBy: [{ type: 'asc' }, { title: 'asc' }]
  });

  const progress = await prisma.questProgress.findMany({ where: { userId: user.id } });
  const progressMap = new Map(progress.map((entry) => [entry.questId, entry]));

  return quests.map((quest) => {
    const userProgress = progressMap.get(quest.id);
    const amount = userProgress?.progress ?? 0;
    return {
      ...quest,
      progress: amount,
      completed: userProgress?.completed ?? false,
      progressBar: formatProgressBar(amount, quest.requirementValue)
    };
  });
}

async function incrementQuestProgress(discordId, requirementType, amount = 1) {
  const user = await ensureUser(discordId);
  const now = new Date();
  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      requirementType,
      OR: [{ assignedTo: null }, { assignedTo: discordId }],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
      ]
    }
  });

  const completed = [];
  for (const quest of quests) {
    const progress = await prisma.questProgress.upsert({
      where: { userId_questId: { userId: user.id, questId: quest.id } },
      update: { progress: { increment: amount } },
      create: { userId: user.id, questId: quest.id, progress: amount }
    });

    if (!progress.completed && progress.progress >= quest.requirementValue) {
      await prisma.questProgress.update({
        where: { id: progress.id },
        data: { completed: true, completedAt: new Date() }
      });
      await prisma.user.update({ where: { id: user.id }, data: { questsCompleted: { increment: 1 } } });
      await grantAp(discordId, quest.rewardAp, 'QUEST', discordId, { questId: quest.id, questTitle: quest.title });
      completed.push(quest);
    }
  }

  return completed;
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

async function createQuest({ title, description, type, requirementType, requirementValue, rewardAp, expiresAt, recurring, assignedTo, createdBy }) {
  return prisma.quest.create({
    data: {
      title,
      description,
      type: type || 'CUSTOM',
      requirementType,
      requirementValue,
      rewardAp,
      active: true,
      expiresAt: expiresAt || null,
      recurring: recurring || 'NONE',
      assignedTo: assignedTo || null,
      createdBy: createdBy || null,
    }
  });
}

async function editQuest(questId, updates) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) throw new Error('Quest not found');
  return prisma.quest.update({ where: { id: questId }, data: updates });
}

async function removeQuest(questId) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) throw new Error('Quest not found');
  return prisma.quest.update({ where: { id: questId }, data: { active: false } });
}

async function listAllQuests() {
  return prisma.quest.findMany({ orderBy: [{ active: 'desc' }, { type: 'asc' }, { title: 'asc' }] });
}

// ── Expiration + Recurring Reset (called by cron) ──────────────────────────

/**
 * Deactivate quests that have passed their expiresAt timestamp.
 */
async function deactivateExpiredQuests() {
  const now = new Date();
  const result = await prisma.quest.updateMany({
    where: {
      active: true,
      expiresAt: { lte: now },
      recurring: 'NONE' // Don't deactivate recurring quests; they get reset instead
    },
    data: { active: false }
  });
  return result.count;
}

/**
 * Reset progress for recurring quests whose cycle has elapsed.
 * Daily: reset every 24h; Weekly: every 7d; Monthly: every 30d.
 */
async function resetRecurringQuests() {
  const now = new Date();
  const cycleDurations = {
    DAILY: 24 * 60 * 60 * 1000,
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
    MONTHLY: 30 * 24 * 60 * 60 * 1000,
  };

  const recurringQuests = await prisma.quest.findMany({
    where: {
      active: true,
      recurring: { not: 'NONE' }
    }
  });

  let resetCount = 0;
  for (const quest of recurringQuests) {
    const cycleDuration = cycleDurations[quest.recurring];
    if (!cycleDuration) continue;

    const lastReset = quest.lastResetAt || quest.createdAt || new Date(0);
    const elapsed = now.getTime() - new Date(lastReset).getTime();

    if (elapsed >= cycleDuration) {
      // Reset all user progress for this quest
      await prisma.questProgress.deleteMany({ where: { questId: quest.id } });

      // Update the quest's lastResetAt and refresh expiration if applicable
      const updateData = { lastResetAt: now };

      // If quest has an expiresAt, extend it by one cycle from now
      if (quest.expiresAt) {
        updateData.expiresAt = new Date(now.getTime() + cycleDuration);
      }

      await prisma.quest.update({ where: { id: quest.id }, data: updateData });
      resetCount++;
      logger.info('Reset recurring quest', { questId: quest.id, title: quest.title, recurring: quest.recurring });
    }
  }

  return resetCount;
}

module.exports = {
  formatProgressBar,
  getQuestsForUser,
  incrementQuestProgress,
  createQuest,
  editQuest,
  removeQuest,
  listAllQuests,
  deactivateExpiredQuests,
  resetRecurringQuests,
};
