const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertConfig(key, value) {
  await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

async function main() {
  await upsertConfig('DAILY_REWARD_AP', process.env.DAILY_REWARD_AP || '100');
  await upsertConfig('DAILY_COOLDOWN_SECONDS', process.env.DAILY_COOLDOWN_SECONDS || '86400');

  const achievements = [
    { name: 'Bronze Earner', description: 'Earn 1,000 AP total', category: 'EARNING', threshold: 1000, rewardAp: 100 },
    { name: 'Silver Earner', description: 'Earn 10,000 AP total', category: 'EARNING', threshold: 10000, rewardAp: 500 },
    { name: 'Bronze Spender', description: 'Spend 1,000 AP in shop', category: 'SPENDING', threshold: 1000, rewardAp: 100 },
    { name: 'Quest Novice', description: 'Complete 10 quests', category: 'QUEST', threshold: 10, rewardAp: 150 }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement
    });
  }

  const quests = [
    {
      type: 'DAILY',
      title: 'Send 50 messages',
      description: 'Stay active by sending 50 messages.',
      requirementType: 'MESSAGE_COUNT',
      requirementValue: 50,
      rewardAp: 120,
      active: true
    },
    {
      type: 'DAILY',
      title: 'React to 10 messages',
      description: 'Use reactions 10 times today.',
      requirementType: 'REACTION_COUNT',
      requirementValue: 10,
      rewardAp: 100,
      active: true
    },
    {
      type: 'WEEKLY',
      title: 'Spend 60 minutes in voice',
      description: 'Spend one hour in voice channels this week.',
      requirementType: 'VOICE_MINUTES',
      requirementValue: 60,
      rewardAp: 500,
      active: true
    }
  ];

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { id: `${quest.type}:${quest.title}`.replace(/\s+/g, '_') },
      update: quest,
      create: {
        id: `${quest.type}:${quest.title}`.replace(/\s+/g, '_'),
        ...quest
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
