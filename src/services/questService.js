const prisma = require('../db/prisma');
const { ensureUser, grantAp } = require('./economyService');

function formatProgressBar(current, target, size = 12) {
  const ratio = Math.max(0, Math.min(1, current / target));
  const filled = Math.round(ratio * size);
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${current}/${target}`;
}

async function getQuestsForUser(discordId) {
  const user = await ensureUser(discordId);
  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      OR: [{ assignedTo: null }, { assignedTo: discordId }]
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
  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      requirementType,
      OR: [{ assignedTo: null }, { assignedTo: discordId }]
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

module.exports = {
  formatProgressBar,
  getQuestsForUser,
  incrementQuestProgress
};
