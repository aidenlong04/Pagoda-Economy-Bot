const { Colors, Icons, Terms, Flavor, randomFlavor } = require('../src/config/warframeTheme');

describe('warframeTheme', () => {
  it('exports all color constants as integers', () => {
    expect(typeof Colors.TENNO).toBe('number');
    expect(typeof Colors.OROKIN).toBe('number');
    expect(typeof Colors.LOTUS).toBe('number');
    expect(typeof Colors.SUCCESS).toBe('number');
  });

  it('exports icon URLs as strings', () => {
    expect(Icons.LOTUS).toMatch(/^https?:\/\//);
    expect(Icons.CREDITS).toMatch(/^https?:\/\//);
    expect(Icons.CODEX).toMatch(/^https?:\/\//);
  });

  it('exports terminology strings', () => {
    expect(Terms.CURRENCY_NAME).toBe('Alliance Standing');
    expect(Terms.CURRENCY_ABBREV).toBe('AP');
    expect(Terms.SHOP_NAME).toBe('Tenno Market');
  });

  it('randomFlavor returns a string from the pool', () => {
    const result = randomFlavor('DAILY_CLAIM');
    expect(typeof result).toBe('string');
    expect(Flavor.DAILY_CLAIM).toContain(result);
  });

  it('randomFlavor returns empty string for unknown category', () => {
    expect(randomFlavor('NONEXISTENT')).toBe('');
  });
});
