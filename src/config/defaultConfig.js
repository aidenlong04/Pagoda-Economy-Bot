module.exports = {
  DAILY_REWARD_AP: '100',
  DAILY_COOLDOWN_SECONDS: '86400',
  // Passive AP earning rates
  MESSAGE_AP: '1',                   // AP granted per qualifying message
  MESSAGE_COOLDOWN_SECONDS: '60',    // Min seconds between message AP grants per user
  MESSAGE_MIN_LENGTH: '4',           // Minimum message length to earn AP
  VOICE_AP_PER_5MIN: '5',           // AP granted per 5-minute voice bracket
  // Daily streak bonus
  STREAK_BONUS_PERCENT: '10',       // Bonus % per consecutive day (e.g., 10 = +10% per day)
  STREAK_BONUS_CAP: '100',          // Maximum bonus % cap (e.g., 100 = double rewards at 10 days)
};
