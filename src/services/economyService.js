const { Prisma } = require('@prisma/client');
const prisma = require('../db/prisma');
const { getConfig } = require('./configService');

function assertPositiveInteger(value, field = 'value') {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
}

async function ensureUser(discordId, tx = prisma) {
  return tx.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId }
  });
}

async function createTransaction(tx, { userId, amount, type, source, actorId, metadata }) {
  return tx.transaction.create({
    data: { userId, amount, type, source, actorId, metadata }
  });
}

async function grantAp(discordId, amount, source, actorId = null, metadata = {}) {
  assertPositiveInteger(amount, 'amount');
  return prisma.$transaction(async (tx) => {
    const user = await ensureUser(discordId, tx);
    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount }
      }
    });
    await createTransaction(tx, { userId: user.id, amount, type: 'EARN', source, actorId, metadata });
    return tx.user.findUnique({ where: { id: user.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function spendAp(discordId, amount, source, actorId = null, metadata = {}) {
  assertPositiveInteger(amount, 'amount');
  return prisma.$transaction(async (tx) => {
    const user = await ensureUser(discordId, tx);
    if (user.balance < amount) {
      throw new Error('Insufficient AP balance');
    }
    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: amount },
        totalSpent: { increment: amount }
      }
    });
    await createTransaction(tx, { userId: user.id, amount: -amount, type: 'SPEND', source, actorId, metadata });
    return tx.user.findUnique({ where: { id: user.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function transferAp(fromDiscordId, toDiscordId, amount, actorId = null) {
  assertPositiveInteger(amount, 'amount');
  if (fromDiscordId === toDiscordId) {
    throw new Error('Cannot transfer AP to yourself');
  }

  return prisma.$transaction(async (tx) => {
    const [fromUser, toUser] = await Promise.all([
      ensureUser(fromDiscordId, tx),
      ensureUser(toDiscordId, tx)
    ]);

    if (fromUser.balance < amount) {
      throw new Error('Insufficient AP balance');
    }

    await tx.user.update({ where: { id: fromUser.id }, data: { balance: { decrement: amount } } });
    await tx.user.update({ where: { id: toUser.id }, data: { balance: { increment: amount } } });

    await Promise.all([
      createTransaction(tx, {
        userId: fromUser.id,
        amount: -amount,
        type: 'TRANSFER',
        source: 'TRANSFER',
        actorId,
        metadata: { direction: 'out', toDiscordId }
      }),
      createTransaction(tx, {
        userId: toUser.id,
        amount,
        type: 'TRANSFER',
        source: 'TRANSFER',
        actorId,
        metadata: { direction: 'in', fromDiscordId }
      })
    ]);

    return {
      from: await tx.user.findUnique({ where: { id: fromUser.id } }),
      to: await tx.user.findUnique({ where: { id: toUser.id } })
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function getBalance(discordId) {
  const user = await ensureUser(discordId);
  return user.balance;
}

async function getLeaderboard(page = 1, limit = 25) {
  const skip = (page - 1) * limit;
  return prisma.user.findMany({
    orderBy: [{ balance: 'desc' }, { createdAt: 'asc' }],
    skip,
    take: limit
  });
}

async function claimDaily(discordId) {
  const reward = parseInt(await getConfig('DAILY_REWARD_AP'), 10);
  const cooldown = parseInt(await getConfig('DAILY_COOLDOWN_SECONDS'), 10);
  const streakBonusPct = parseInt(await getConfig('STREAK_BONUS_PERCENT'), 10) || 0;
  const streakBonusCap = parseInt(await getConfig('STREAK_BONUS_CAP'), 10) || 100;
  const now = Date.now();

  return prisma.$transaction(async (tx) => {
    const user = await ensureUser(discordId, tx);
    const latestDaily = await tx.transaction.findFirst({
      where: {
        userId: user.id,
        source: 'DAILY'
      },
      orderBy: { timestamp: 'desc' }
    });

    if (latestDaily) {
      const elapsed = Math.floor((now - latestDaily.timestamp.getTime()) / 1000);
      if (elapsed < cooldown) {
        return { claimed: false, remainingSeconds: cooldown - elapsed };
      }
    }

    // Compute streak: if last claim was within 2× cooldown, continue streak; otherwise reset
    let newStreak;
    if (latestDaily) {
      const sinceLast = Math.floor((now - latestDaily.timestamp.getTime()) / 1000);
      newStreak = sinceLast <= cooldown * 2 ? user.daysActiveStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    // Apply streak bonus: bonus = min(streak * bonusPct, cap) percent
    const bonusPct = Math.min(newStreak * streakBonusPct, streakBonusCap);
    const bonusAp = Math.floor(reward * bonusPct / 100);
    const totalReward = reward + bonusAp;

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: totalReward },
        totalEarned: { increment: totalReward },
        daysActiveStreak: newStreak,
        lastDailyAt: new Date(now)
      }
    });

    await createTransaction(tx, {
      userId: user.id,
      amount: totalReward,
      type: 'EARN',
      source: 'DAILY',
      actorId: discordId,
      metadata: { reason: 'daily-claim', streak: newStreak, baseReward: reward, bonus: bonusAp }
    });

    return { claimed: true, reward: totalReward, baseReward: reward, bonus: bonusAp, streak: newStreak };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

module.exports = {
  assertPositiveInteger,
  ensureUser,
  grantAp,
  spendAp,
  transferAp,
  getBalance,
  getLeaderboard,
  claimDaily
};
