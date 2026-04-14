/**
 * Achievement category → user model field mapping.
 * Used by achievementService to evaluate whether a user
 * has crossed the threshold for each category.
 */
module.exports = {
  EARNING:  { field: 'totalEarned',     label: 'Standing Earned' },
  SPENDING: { field: 'totalSpent',      label: 'Standing Spent' },
  ACTIVITY: { field: 'messageCount',    label: 'Messages Sent' },
  QUEST:    { field: 'questsCompleted', label: 'Missions Completed' },
};
