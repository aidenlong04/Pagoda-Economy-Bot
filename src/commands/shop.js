const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listShopItems } = require('../services/shopService');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

const ACTION_LABELS = {
  ROLE_GRANT: '🏷️ Role',
  CUSTOM_RESPONSE: '💬 Message',
  INVENTORY_ITEM: '📦 Item',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription(`Browse the ${Terms.SHOP_NAME}.`),
  async execute(interaction) {
    const items = await listShopItems();
    const embed = new EmbedBuilder()
      .setColor(Colors.CORPUS)
      .setAuthor({ name: Terms.SHOP_NAME, iconURL: Icons.CREDITS })
      .setThumbnail(Icons.VOID_RELIC)
      .setTimestamp();

    if (!items.length) {
      embed.setDescription('The market is empty. Check back later, Tenno.');
    } else {
      const lines = items.map((item) => {
        const stock = item.stock === null ? '∞' : item.stock;
        const repeat = item.repeatable ? 'repeatable' : 'one-time';
        const tag = ACTION_LABELS[item.actionType] || '❓';
        return `${tag} **${item.name}** — \`${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}\`\n` +
          `${item.description}\n` +
          `*Stock: ${stock} • ${repeat}*`;
      });
      embed.setDescription(lines.join('\n\n'));
    }

    embed.setFooter({ text: `Use /buy <item> to purchase • ${Terms.CURRENCY_NAME}` });
    await interaction.reply({ embeds: [embed] });
  }
};
