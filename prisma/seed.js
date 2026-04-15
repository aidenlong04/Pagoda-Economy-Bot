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
  // ── Runtime config defaults ──────────────────────────────────────────
  await upsertConfig('MESSAGE_AP', '1');
  await upsertConfig('MESSAGE_COOLDOWN_SECONDS', '60');
  await upsertConfig('MESSAGE_MIN_LENGTH', '4');
  await upsertConfig('VOICE_AP_PER_5MIN', '5');

  // ── Warframe-themed Achievements ─────────────────────────────────────
  const achievements = [
    // Earning milestones (Alliance Standing earned all-time)
    { name: 'Initiate',           description: 'Earn 1,000 Alliance Standing',    category: 'EARNING', threshold: 1000,   rewardAp: 100 },
    { name: 'Operative',          description: 'Earn 10,000 Alliance Standing',   category: 'EARNING', threshold: 10000,  rewardAp: 500 },
    { name: 'Master Tenno',       description: 'Earn 100,000 Alliance Standing',  category: 'EARNING', threshold: 100000, rewardAp: 2500 },
    // Spending milestones
    { name: 'Market Regular',     description: 'Spend 1,000 AP in the Tenno Market', category: 'SPENDING', threshold: 1000,  rewardAp: 100 },
    { name: 'Platinum Patron',    description: 'Spend 25,000 AP in the Tenno Market', category: 'SPENDING', threshold: 25000, rewardAp: 1000 },
    // Activity milestones
    { name: 'Comms Officer',      description: 'Send 500 messages',              category: 'ACTIVITY', threshold: 500,   rewardAp: 150 },
    { name: 'Relay Veteran',      description: 'Send 5,000 messages',            category: 'ACTIVITY', threshold: 5000,  rewardAp: 750 },
    // Quest milestones
    { name: 'Mission Rookie',     description: 'Complete 5 Codex Missions',       category: 'QUEST', threshold: 5,  rewardAp: 100 },
    { name: 'Star Chart Clearer', description: 'Complete 50 Codex Missions',      category: 'QUEST', threshold: 50, rewardAp: 1500 },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement
    });
  }

  // ── Warframe-themed Quest Seeds ──────────────────────────────────────
  const quests = [
    {
      type: 'DAILY',
      title: 'Transmissions Intercepted',
      description: 'Send 50 messages in any channel. The Lotus needs your intel.',
      requirementType: 'MESSAGE_COUNT',
      requirementValue: 50,
      rewardAp: 120,
      active: true,
      recurring: 'DAILY'
    },
    {
      type: 'DAILY',
      title: 'Signal Boost',
      description: 'React to 10 messages. Boost Tenno morale across the relay.',
      requirementType: 'REACTION_COUNT',
      requirementValue: 10,
      rewardAp: 100,
      active: true,
      recurring: 'DAILY'
    },
    {
      type: 'WEEKLY',
      title: 'Void Meditation',
      description: 'Spend 60 minutes in voice channels. Focus your Void energy.',
      requirementType: 'VOICE_MINUTES',
      requirementValue: 60,
      rewardAp: 500,
      active: true,
      recurring: 'WEEKLY'
    },
    {
      type: 'MONTHLY',
      title: 'Origin System Sweep',
      description: 'Send 1,000 messages this month. Leave no relay unvisited.',
      requirementType: 'MESSAGE_COUNT',
      requirementValue: 1000,
      rewardAp: 2000,
      active: true,
      recurring: 'MONTHLY'
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

  console.log('Seed data applied successfully.');
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
