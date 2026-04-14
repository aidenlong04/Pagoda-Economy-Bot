const { buildEventSummaryEmbed } = require('../src/services/eventService');

describe('buildEventSummaryEmbed', () => {
  const baseEvent = {
    id: 'evt_test123',
    name: 'Test Tactical Alert',
    description: 'A test event for validating summary embeds.',
    startTime: new Date('2026-01-01T00:00:00Z'),
    endTime: new Date('2026-01-02T00:00:00Z'),
    rewardAp: 500,
    conditionType: 'MIN_UNIQUE_PARTICIPANTS',
    conditionValue: 3,
  };

  it('returns an object with embed data when qualified > 0', () => {
    const embed = buildEventSummaryEmbed(baseEvent, 5, 3, ['111', '222', '333']);
    const json = embed.toJSON();

    expect(json.title).toBe('Test Tactical Alert');
    expect(json.fields).toBeDefined();
    expect(json.fields.length).toBeGreaterThanOrEqual(5);

    const participantsField = json.fields.find((f) => f.name === 'Total Participants');
    expect(participantsField.value).toBe('5');

    const qualifiedField = json.fields.find((f) => f.name === 'Qualified Tenno');
    expect(qualifiedField.value).toBe('3');

    const rewardField = json.fields.find((f) => f.name === 'Reward');
    expect(rewardField.value).toContain('500');

    const rewardedField = json.fields.find((f) => f.name === 'Rewarded Tenno');
    expect(rewardedField).toBeDefined();
    expect(rewardedField.value).toContain('<@111>');
  });

  it('handles zero qualified users', () => {
    const embed = buildEventSummaryEmbed(baseEvent, 2, 0, []);
    const json = embed.toJSON();

    const qualifiedField = json.fields.find((f) => f.name === 'Qualified Tenno');
    expect(qualifiedField.value).toBe('0');

    const rewardedField = json.fields.find((f) => f.name === 'Rewarded Tenno');
    expect(rewardedField).toBeUndefined();
  });

  it('truncates rewarded list beyond 30 users', () => {
    const ids = Array.from({ length: 40 }, (_, i) => String(i));
    const embed = buildEventSummaryEmbed(baseEvent, 40, 40, ids);
    const json = embed.toJSON();

    const rewardedField = json.fields.find((f) => f.name === 'Rewarded Tenno');
    expect(rewardedField.value).toContain('...and 10 more');
  });
});
