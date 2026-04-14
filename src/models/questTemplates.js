/**
 * Default quest templates seeded on first run.
 * Warframe-themed quest names and descriptions.
 */
module.exports = {
  DAILY: [
    {
      title: 'Transmissions Intercepted',
      description: 'Send 50 messages in any channel. The Lotus needs your intel.',
      requirementType: 'MESSAGE_COUNT',
      requirementValue: 50,
      rewardAp: 120,
    },
    {
      title: 'Signal Boost',
      description: 'React to 10 messages. Boost Tenno morale across the relay.',
      requirementType: 'REACTION_COUNT',
      requirementValue: 10,
      rewardAp: 100,
    },
  ],
  WEEKLY: [
    {
      title: 'Void Meditation',
      description: 'Spend 60 minutes in voice channels. Focus your Void energy.',
      requirementType: 'VOICE_MINUTES',
      requirementValue: 60,
      rewardAp: 500,
    },
  ],
  MONTHLY: [
    {
      title: 'Origin System Sweep',
      description: 'Send 1,000 messages this month. Leave no relay unvisited.',
      requirementType: 'MESSAGE_COUNT',
      requirementValue: 1000,
      rewardAp: 2000,
    },
  ],
};
