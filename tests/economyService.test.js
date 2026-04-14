const { assertPositiveInteger } = require('../src/services/economyService');

describe('assertPositiveInteger', () => {
  it('accepts positive integers', () => {
    expect(() => assertPositiveInteger(1, 'amount')).not.toThrow();
    expect(() => assertPositiveInteger(50, 'amount')).not.toThrow();
  });

  it('rejects zero, negatives, and non-integers', () => {
    expect(() => assertPositiveInteger(0, 'amount')).toThrow('amount must be a positive integer');
    expect(() => assertPositiveInteger(-1, 'amount')).toThrow('amount must be a positive integer');
    expect(() => assertPositiveInteger(1.5, 'amount')).toThrow('amount must be a positive integer');
  });
});
