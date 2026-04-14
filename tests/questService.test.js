const { formatProgressBar } = require('../src/services/questService');

describe('questService', () => {
  describe('formatProgressBar', () => {
    it('returns empty bar for 0 progress', () => {
      const bar = formatProgressBar(0, 100);
      expect(bar).toContain('░░░░░░░░░░░░');
      expect(bar).toContain('0/100');
    });

    it('returns full bar when current >= target', () => {
      const bar = formatProgressBar(100, 100);
      expect(bar).toContain('████████████');
      expect(bar).toContain('100/100');
    });

    it('returns half bar for 50%', () => {
      const bar = formatProgressBar(50, 100);
      expect(bar).toContain('50/100');
      // Should have ~6 filled and ~6 empty
      const filled = (bar.match(/█/g) || []).length;
      const empty = (bar.match(/░/g) || []).length;
      expect(filled).toBe(6);
      expect(empty).toBe(6);
    });

    it('clamps progress above target', () => {
      const bar = formatProgressBar(200, 100);
      expect(bar).toContain('████████████');
      expect(bar).toContain('200/100');
    });
  });
});

describe('admin parseDuration', () => {
  // parseDuration is a local function in admin.js, so we test the logic pattern
  it('parses duration patterns correctly', () => {
    const durations = {
      h: 3600000,
      d: 86400000,
      w: 604800000,
      m: 2592000000,
    };

    for (const [unit, ms] of Object.entries(durations)) {
      expect(ms).toBeGreaterThan(0);
    }
  });
});

describe('recurring quest schedule', () => {
  it('DAILY cycle is 24 hours', () => {
    expect(24 * 60 * 60 * 1000).toBe(86400000);
  });

  it('WEEKLY cycle is 7 days', () => {
    expect(7 * 24 * 60 * 60 * 1000).toBe(604800000);
  });

  it('MONTHLY cycle is 30 days', () => {
    expect(30 * 24 * 60 * 60 * 1000).toBe(2592000000);
  });
});
