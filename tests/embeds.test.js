const { themed, success, warning, error, info, market, prestige } = require('../src/utils/embeds');
const { Colors, Icons } = require('../src/config/warframeTheme');

describe('embed utility builders', () => {
  it('themed() creates an embed with color, author, and timestamp', () => {
    const embed = themed(Colors.TENNO, 'Test', Icons.LOTUS);
    const json = embed.toJSON();
    expect(json.color).toBe(Colors.TENNO);
    expect(json.author.name).toBe('Test');
    expect(json.author.icon_url).toBe(Icons.LOTUS);
    expect(json.timestamp).toBeDefined();
  });

  it('success() sets SUCCESS color and description', () => {
    const embed = success('OK', 'It worked');
    const json = embed.toJSON();
    expect(json.color).toBe(Colors.SUCCESS);
    expect(json.description).toBe('It worked');
  });

  it('warning() sets WARNING color', () => {
    const json = warning('Warn', 'Careful').toJSON();
    expect(json.color).toBe(Colors.WARNING);
  });

  it('error() sets ERROR color', () => {
    const json = error('Err', 'Broke').toJSON();
    expect(json.color).toBe(Colors.ERROR);
  });

  it('info() sets TENNO color', () => {
    const json = info('Info', 'Data').toJSON();
    expect(json.color).toBe(Colors.TENNO);
  });

  it('market() sets CORPUS color', () => {
    const json = market('Shop', 'Items').toJSON();
    expect(json.color).toBe(Colors.CORPUS);
  });

  it('prestige() sets OROKIN color', () => {
    const json = prestige('Gold', 'Shiny').toJSON();
    expect(json.color).toBe(Colors.OROKIN);
  });
});
