const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
    .setDescription(`${Terms.SHOP_NAME} — browse, buy, and check your ${Terms.INVENTORY}.`)
    .addSubcommand((sub) => sub
      .setName('browse')
      .setDescription(`Browse items in the ${Terms.SHOP_NAME}.`))
    .addSubcommand((sub) => sub
      .setName('buy')
      .setDescription('Purchase an item.')
      .addStringOption((o) => o
        .setName('item')
        .setDescription('Item name')
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand((sub) => sub
      .setName('inventory')
      .setDescription(`View your ${Terms.INVENTORY}.`)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const items = await listShopItems();
    const filtered = items
      .filter((i) => i.name.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(
      filtered.map((i) => ({ name: `${i.name} — ${i.price} AP`, value: i.name }))
    );
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'browse') return handleBrowse(interaction);
    if (sub === 'buy') return handleBuy(interaction);
    if (sub === 'inventory') return handleInventory(interaction);
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

  embed.setFooter({ text: `Use /market buy <item> to purchase • ${Terms.CURRENCY_NAME}` });
  await interaction.reply({ embeds: [embed] });
}

async function handleBuy(interaction) {
  await interaction.deferReply();
  const itemName = interaction.options.getString('item', true);
  const item = await buyItem({
    discordId: interaction.user.id,
    itemName,
    member: interaction.member,
    channel: interaction.channel
  });
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: 'Purchase Complete', iconURL: Icons.CREDITS })
    .setDescription(
      `Acquired **${item.name}** for **${item.price.toLocaleString()} ${Terms.CURRENCY_ABBREV}**\n\n` +
      `*${randomFlavor('PURCHASE')}*`
    )
    .setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

async function handleInventory(interaction) {
  const items = await getInventory(interaction.user.id);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: Terms.INVENTORY, iconURL: Icons.CODEX })
    .setTimestamp();

  if (!items.length) {
    embed.setDescription('Your Arsenal is empty, Tenno.');
  } else {
    embed.setDescription(
      items.map((item) => `• **${item.itemName}** ×${item.quantity}`).join('\n')
    );
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
