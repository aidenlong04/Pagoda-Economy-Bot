const { Prisma } = require('@prisma/client');
const prisma = require('../db/prisma');

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

async function getBalance(discordId) {
  const user = await ensureUser(discordId);
  return user.balance;
}

async function getLeaderboard(page = 1, limit = 25) {
  const skip = (page - 1) * limit;
  return prisma.user.findMany({
    orderBy: [{ balance: 'desc' }, { createdAt: 'asc' }],
    skip,
    take: limit,
    select: {
      discordId: true,
      balance: true,
      totalEarned: true,
      messageCount: true,
      questsCompleted: true,
    }
  });
}

module.exports = {
  assertPositiveInteger,
  ensureUser,
  grantAp,
  spendAp,
  getBalance,
  getLeaderboard
};
