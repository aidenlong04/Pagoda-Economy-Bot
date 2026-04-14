module.exports = {
  DAILY: [
    { title: 'Send 50 messages', description: 'Send 50 messages today.', requirementType: 'MESSAGE_COUNT', requirementValue: 50, rewardAp: 120 },
    { title: 'React 10 times', description: 'React to 10 messages today.', requirementType: 'REACTION_COUNT', requirementValue: 10, rewardAp: 100 }
  ],
  WEEKLY: [
    { title: '60 voice minutes', description: 'Spend 60 minutes in voice channels.', requirementType: 'VOICE_MINUTES', requirementValue: 60, rewardAp: 500 }
  ]
};
