const { computeQualifiedUsers } = require('../src/services/eventService');

describe('computeQualifiedUsers', () => {
  it('awards all participants once minimum unique threshold is met', () => {
    const event = { conditionType: 'MIN_UNIQUE_PARTICIPANTS', conditionValue: 2 };
    const counts = new Map([
      ['u1', 1],
      ['u2', 3]
    ]);

    expect(computeQualifiedUsers(event, counts, 2)).toEqual(['u1', 'u2']);
  });

  it('awards only users meeting individual interaction threshold', () => {
    const event = { conditionType: 'INDIVIDUAL_INTERACTION_THRESHOLD', conditionValue: 3 };
    const counts = new Map([
      ['u1', 2],
      ['u2', 3],
      ['u3', 5]
    ]);

    expect(computeQualifiedUsers(event, counts, 3)).toEqual(['u2', 'u3']);
  });
});
