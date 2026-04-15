const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { listShopItems, buyItem, getInventory } = require('../services/shopService');
const { Colors, Icons, Terms, randomFlavor } = require('../config/warframeTheme');

const ACTION_LABELS = {
  ROLE_GRANT: '🏷️ Role',
  CUSTOM_RESPONSE: '💬 Message',
  INVENTORY_ITEM: '📦 Item',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription(`${Terms.SHOP_NAME} — browse items, buy, and check your ${Terms.INVENTORY}.`),

  async execute(interaction) {
    return handleBrowse(interaction);
  }
};

async function handleBrowse(interaction) {
  const items = await listShopItems();
  const embed = new EmbedBuilder()
    .setColor(Colors.CORPUS)
    .setAuthor({ name: Terms.SHOP_NAME, iconURL: Icons.CREDITS })
    .setThumbnail(Icons.VOID_RELIC)
    .setTimestamp();

  if (!items.length) {
    embed.setDescription('The market is empty. Check back later, Tenno.');
    return interaction.reply({ embeds: [embed] });
  }

  const lines = items.map((item) => {
    const stock = item.stock === null ? '∞' : item.stock;
    const repeat = item.repeatable ? 'repeatable' : 'one-time';
    const tag = ACTION_LABELS[item.actionType] || '❓';
    return `${tag} **${item.name}** — \`${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}\`\n` +
      `${item.description}\n` +
      `*Stock: ${stock} • ${repeat}*`;
  });
  embed.setDescription(lines.join('\n\n'));

  const components = [];

  // Add a select menu for quick-buy if there are purchasable items
  if (items.length <= 25) {
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('market:buy')
        .setPlaceholder('Quick buy — select an item…')
        .addOptions(items.map((item) => ({
          label: item.name,
          description: `${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}${item.stock !== null ? ` • ${item.stock} left` : ''}`,
          value: item.name,
          emoji: ACTION_LABELS[item.actionType]?.charAt(0) || '❓'
        })))
    );
    components.push(selectRow);
  }

  // Navigation buttons
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('market:inventory')
      .setLabel('View Arsenal')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎒')
  );
  components.push(navRow);

  embed.setFooter({ text: `Use the menu below to purchase items` });
  await interaction.reply({ embeds: [embed], components });
}
