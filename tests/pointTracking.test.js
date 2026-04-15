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

  it('all values are string type (config values are strings)', () => {
    for (const [key, value] of Object.entries(defaults)) {
      expect(typeof value).toBe('string');
    }
  });
});

describe('voice session cap', () => {
  it('exports MAX_SESSION_MS as 8 hours', () => {
    const { _MAX_SESSION_MS } = require('../src/events/voiceStateUpdate');
    expect(_MAX_SESSION_MS).toBe(8 * 60 * 60 * 1000);
  });
});

describe('config service cache', () => {
  it('exports getConfigBatch and clearConfigCache', () => {
    const { getConfigBatch, clearConfigCache } = require('../src/services/configService');
    expect(typeof getConfigBatch).toBe('function');
    expect(typeof clearConfigCache).toBe('function');
  });
});
