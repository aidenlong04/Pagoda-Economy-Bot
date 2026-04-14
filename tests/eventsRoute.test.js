const eventsRoute = require('../src/routes/events');

describe('getSafeRedirect', () => {
  const original = process.env.EVENT_REDIRECT_ALLOWLIST;

  afterEach(() => {
    process.env.EVENT_REDIRECT_ALLOWLIST = original;
  });

  it('allows relative redirects', () => {
    expect(eventsRoute.getSafeRedirect('/internal/path')).toBe('/internal/path');
  });

  it('blocks external redirects without allowlist', () => {
    process.env.EVENT_REDIRECT_ALLOWLIST = '';
    expect(eventsRoute.getSafeRedirect('https://example.com/path')).toBeNull();
  });

  it('allows external redirects for allowlisted hosts only', () => {
    process.env.EVENT_REDIRECT_ALLOWLIST = 'example.com,allowed.test';
    expect(eventsRoute.getSafeRedirect('https://example.com/path')).toBe('https://example.com/path');
    expect(eventsRoute.getSafeRedirect('https://blocked.test/path')).toBeNull();
  });
});
