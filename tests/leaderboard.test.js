const { buildLeaderboardEmbed, buildPaginationRow, PAGE_SIZE } = require('../src/commands/leaderboard');
const { buildWebhookLeaderboardEmbed } = require('../src/services/leaderboardWebhook');
const { Colors } = require('../src/config/warframeTheme');

describe('leaderboard embed builders', () => {
  const mockUsers = [
    { discordId: '111', balance: 5000 },
    { discordId: '222', balance: 3000 },
    { discordId: '333', balance: 1000 },
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

  it('PAGE_SIZE is 25', () => {
    expect(PAGE_SIZE).toBe(25);
  });
});
