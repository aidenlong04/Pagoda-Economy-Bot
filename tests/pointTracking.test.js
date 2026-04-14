const defaults = require('../src/config/defaultConfig');

describe('defaultConfig point tracking settings', () => {
  it('has MESSAGE_AP config', () => {
    expect(defaults.MESSAGE_AP).toBe('1');
  });

  it('has MESSAGE_COOLDOWN_SECONDS config', () => {
    expect(defaults.MESSAGE_COOLDOWN_SECONDS).toBe('60');
  });

  it('has MESSAGE_MIN_LENGTH config', () => {
    expect(defaults.MESSAGE_MIN_LENGTH).toBe('4');
  });

  it('has VOICE_AP_PER_5MIN config', () => {
    expect(defaults.VOICE_AP_PER_5MIN).toBe('5');
  });

  it('has STREAK_BONUS_PERCENT config', () => {
    expect(defaults.STREAK_BONUS_PERCENT).toBe('10');
  });

  it('has STREAK_BONUS_CAP config', () => {
    expect(defaults.STREAK_BONUS_CAP).toBe('100');
  });

  it('all values are string type (config values are strings)', () => {
    for (const [key, value] of Object.entries(defaults)) {
      expect(typeof value).toBe('string');
    }
  });
});
