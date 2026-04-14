const prisma = require('../db/prisma');
const mapping = require('../models/achievementDefinitions');
const { grantAp } = require('./economyService');

async function evaluateAchievements(discordId, member = null) {
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) {
    return [];
  }

  const achievements = await prisma.achievement.findMany({ orderBy: { threshold: 'asc' } });
  const unlocked = await prisma.userAchievement.findMany({ where: { userId: user.id } });
  const unlockedSet = new Set(unlocked.map((a) => a.achievementId));

  const newlyUnlocked = [];
  for (const achievement of achievements) {
    const field = mapping[achievement.category]?.field;
    if (!field || unlockedSet.has(achievement.id)) {
      continue;
    }

    if ((user[field] || 0) >= achievement.threshold) {
      await prisma.userAchievement.create({ data: { userId: user.id, achievementId: achievement.id } });
      if (achievement.rewardAp > 0) {
        await grantAp(discordId, achievement.rewardAp, 'ACHIEVEMENT', discordId, { achievementId: achievement.id });
      }
      if (achievement.rewardRoleId && member) {
        const role = member.guild.roles.cache.get(achievement.rewardRoleId);
        if (role) {
          await member.roles.add(role).catch(() => null);
        }
      }
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

async function getAchievementProgress(discordId) {
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) {
    return [];
  }
  const achievements = await prisma.achievement.findMany({ orderBy: [{ category: 'asc' }, { threshold: 'asc' }] });
  const unlocked = await prisma.userAchievement.findMany({ where: { userId: user.id } });
  const unlockedMap = new Map(unlocked.map((item) => [item.achievementId, item.unlockedAt]));

  return achievements.map((achievement) => {
    const field = mapping[achievement.category]?.field;
    return {
      ...achievement,
      current: user[field] || 0,
      unlockedAt: unlockedMap.get(achievement.id) || null
    };
  });
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

async function createAchievement({ name, description, category, threshold, rewardAp, rewardRoleId, createdBy }) {
  return prisma.achievement.create({
    data: {
      name,
      description,
      category,
      threshold,
      rewardAp,
      rewardRoleId: rewardRoleId || null,
      createdBy: createdBy || null,
    }
  });
}

async function editAchievement(name, updates) {
  const achievement = await prisma.achievement.findUnique({ where: { name } });
  if (!achievement) throw new Error('Achievement not found');
  return prisma.achievement.update({ where: { name }, data: updates });
}

async function removeAchievement(name) {
  const achievement = await prisma.achievement.findUnique({ where: { name } });
  if (!achievement) throw new Error('Achievement not found');
  // Delete user unlocks and the achievement itself
  await prisma.userAchievement.deleteMany({ where: { achievementId: achievement.id } });
  return prisma.achievement.delete({ where: { name } });
}

async function listAllAchievements() {
  return prisma.achievement.findMany({ orderBy: [{ category: 'asc' }, { threshold: 'asc' }] });
}

module.exports = {
  evaluateAchievements,
  getAchievementProgress,
  createAchievement,
  editAchievement,
  removeAchievement,
  listAllAchievements,
};
