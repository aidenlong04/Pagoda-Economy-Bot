const { commands } = require('../src/commands');

describe('command registry', () => {
  it('exports exactly 7 commands', () => {
    expect(commands.length).toBe(7);
  });

  it('all commands have data and execute', () => {
    for (const cmd of commands) {
      expect(cmd.data).toBeDefined();
      expect(typeof cmd.execute).toBe('function');
      // Verify toJSON works (valid slash command builder)
      expect(() => cmd.data.toJSON()).not.toThrow();
    }
  });

  it('command names are unique', () => {
    const names = commands.map((cmd) => cmd.data.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('admin command has defaultMemberPermissions set', () => {
    const admin = commands.find((cmd) => cmd.data.name === 'admin');
    const json = admin.data.toJSON();
    // ManageGuild = 1 << 5 = 32
    expect(json.default_member_permissions).toBe('32');
  });

  it('market command has autocomplete handler', () => {
    const market = commands.find((cmd) => cmd.data.name === 'market');
    expect(typeof market.autocomplete).toBe('function');
  });

  it('admin command has shop, config, event, and grant subcommand groups', () => {
    const admin = commands.find((cmd) => cmd.data.name === 'admin');
    const json = admin.data.toJSON();
    const groupNames = json.options.map((o) => o.name).sort();
    expect(groupNames).toEqual(['config', 'event', 'grant', 'shop']);
  });
});
