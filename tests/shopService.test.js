const { restockShopItem } = require('../src/services/shopService');

// We test the restockShopItem validation (which doesn't need the DB)
describe('restockShopItem validation', () => {
  it('rejects zero amount', async () => {
    await expect(restockShopItem('test', 0)).rejects.toThrow('Restock amount must be a positive integer');
  });

  it('rejects negative amount', async () => {
    await expect(restockShopItem('test', -5)).rejects.toThrow('Restock amount must be a positive integer');
  });

  it('rejects non-integer amount', async () => {
    await expect(restockShopItem('test', 2.5)).rejects.toThrow('Restock amount must be a positive integer');
  });
});
