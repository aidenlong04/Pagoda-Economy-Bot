const { Prisma } = require('@prisma/client');
const prisma = require('../db/prisma');
const { ensureUser } = require('./economyService');

async function listShopItems() {
  return prisma.shopItem.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
}

async function getInventory(discordId) {
  const user = await ensureUser(discordId);
  return prisma.userInventoryItem.findMany({ where: { userId: user.id }, orderBy: { itemName: 'asc' } });
}

async function buyItem({ discordId, itemName, member, channel }) {
  const item = await prisma.shopItem.findFirst({ where: { active: true, name: itemName } });
  if (!item) {
    throw new Error('Shop item not found');
  }
  if (item.stock !== null && item.stock <= 0) {
    throw new Error('This item is out of stock');
  }

  const user = await ensureUser(discordId);
  if (!item.repeatable) {
    const prior = await prisma.purchase.findFirst({ where: { userId: user.id, itemId: item.id } });
    if (prior) {
      throw new Error('This item can only be purchased once');
    }
  }

  await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUnique({ where: { id: user.id } });
    if (!freshUser || freshUser.balance < item.price) {
      throw new Error('Insufficient AP balance');
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: item.price },
        totalSpent: { increment: item.price }
      }
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        amount: -item.price,
        type: 'SPEND',
        source: 'SHOP',
        actorId: discordId,
        metadata: { itemId: item.id, itemName: item.name }
      }
    });

    await tx.purchase.create({ data: { userId: user.id, itemId: item.id } });

    if (item.stock !== null) {
      await tx.shopItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
    }

    if (item.actionType === 'INVENTORY_ITEM') {
      const actionData = item.actionData || {};
      const inventoryName = actionData.itemName || item.name;
      await tx.userInventoryItem.upsert({
        where: { userId_itemName: { userId: user.id, itemName: inventoryName } },
        update: { quantity: { increment: 1 }, metadata: actionData.metadata || Prisma.JsonNull },
        create: {
          userId: user.id,
          itemName: inventoryName,
          quantity: 1,
          metadata: actionData.metadata || Prisma.JsonNull
        }
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (item.actionType === 'ROLE_GRANT' && member) {
    const roleId = item.actionData?.roleId;
    if (roleId) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role);
      }
    }
  }

  if (item.actionType === 'CUSTOM_RESPONSE') {
    const message = item.actionData?.message || `Purchased ${item.name}!`;
    if (item.actionData?.dm && member) {
      await member.send(message).catch(() => null);
    } else if (channel) {
      await channel.send(message).catch(() => null);
    }
  }

  return item;
}

module.exports = {
  listShopItems,
  getInventory,
  buyItem
};
