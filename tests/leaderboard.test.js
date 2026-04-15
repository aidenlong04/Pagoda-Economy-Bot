const { buildLeaderboardEmbed, buildPaginationRow, PAGE_SIZE } = require('../src/commands/leaderboard');
const { buildWebhookLeaderboardEmbed } = require('../src/services/leaderboardWebhook');
const { Colors } = require('../src/config/warframeTheme');

describe('leaderboard embed builders', () => {
  const mockUsers = [
    { discordId: '111', balance: 5000 },
    { discordId: '222', balance: 3000 },
    { discordId: '333', balance: 1000 },
  ];

  const mockUsersWithStats = [
    { discordId: '111', balance: 5000, totalEarned: 8000, messageCount: 120, questsCompleted: 5, daysActiveStreak: 3 },
    { discordId: '222', balance: 3000, totalEarned: 4000, messageCount: 50, questsCompleted: 0, daysActiveStreak: 1 },
    { discordId: '333', balance: 1000, totalEarned: 0, messageCount: 0, questsCompleted: 0, daysActiveStreak: 0 },
  ];

  it('buildLeaderboardEmbed displays ranked users', () => {
    const embed = buildLeaderboardEmbed(mockUsers, 1);
    const json = embed.toJSON();
    expect(json.color).toBe(Colors.OROKIN);
    expect(json.description).toContain('<@111>');
    expect(json.description).toContain('🥇');
    expect(json.description).toContain('🥈');
    expect(json.description).toContain('🥉');
  });

  it('buildLeaderboardEmbed shows empty message when no users', () => {
    const embed = buildLeaderboardEmbed([], 1);
    const json = embed.toJSON();
    expect(json.description).toContain('No leaderboard data');
  });

  it('buildPaginationRow disables Previous on page 1', () => {
    const row = buildPaginationRow(1, true);
    const json = row.toJSON();
    expect(json.components[0].disabled).toBe(true);  // Previous
    expect(json.components[2].disabled).toBe(false);  // Next
  });

  it('buildPaginationRow disables Next when no more data', () => {
    const row = buildPaginationRow(2, false);
    const json = row.toJSON();
    expect(json.components[0].disabled).toBe(false);  // Previous
    expect(json.components[2].disabled).toBe(true);   // Next
  });

  it('buildWebhookLeaderboardEmbed creates a themed embed', () => {
    const embed = buildWebhookLeaderboardEmbed(mockUsers);
    const json = embed.toJSON();
    expect(json.color).toBe(Colors.OROKIN);
    expect(json.description).toContain('<@111>');
    expect(json.footer.text).toContain('Auto-updated daily');
  });

  it('buildWebhookLeaderboardEmbed includes activity stats when present', () => {
    const embed = buildWebhookLeaderboardEmbed(mockUsersWithStats);
    const json = embed.toJSON();
    // User 111 has all stats
    expect(json.description).toContain('📈 8,000 earned');
    expect(json.description).toContain('💬 120 msgs');
    expect(json.description).toContain('📜 5 quests');
    // User 222 has some stats (no quests)
    expect(json.description).toContain('💬 50 msgs');
    // User 333 has no stats — no stat line
  });

  it('PAGE_SIZE is 25', () => {
    expect(PAGE_SIZE).toBe(25);
  });
});
