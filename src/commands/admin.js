const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addShopItem, editShopItem, removeShopItem, restockShopItem } = require('../services/shopService');
const { isAdmin } = require('../services/permissions');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin shop & bot management commands.')
    .addSubcommandGroup((group) => group
      .setName('shop')
      .setDescription('Manage shop items.')
      .addSubcommand((sub) => sub
        .setName('add')
        .setDescription('Add a new item to the Tenno Market.')
        .addStringOption((o) => o.setName('name').setDescription('Item name').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Item description').setRequired(true))
        .addIntegerOption((o) => o.setName('price').setDescription(`Price in ${Terms.CURRENCY_ABBREV}`).setRequired(true).setMinValue(1))
        .addStringOption((o) => o
          .setName('action_type')
          .setDescription('What happens on purchase')
          .setRequired(true)
          .addChoices(
            { name: 'Grant Role', value: 'ROLE_GRANT' },
            { name: 'Custom Response', value: 'CUSTOM_RESPONSE' },
            { name: 'Inventory Item', value: 'INVENTORY_ITEM' }
          ))
        .addIntegerOption((o) => o.setName('stock').setDescription('Stock count (omit for unlimited)'))
        .addBooleanOption((o) => o.setName('repeatable').setDescription('Can users buy multiple times? (default: true)'))
        .addRoleOption((o) => o.setName('role').setDescription('Role to grant (for ROLE_GRANT action)'))
        .addStringOption((o) => o.setName('message').setDescription('Custom message (for CUSTOM_RESPONSE action)'))
        .addBooleanOption((o) => o.setName('dm').setDescription('Send as DM instead of channel (for CUSTOM_RESPONSE)')))
      .addSubcommand((sub) => sub
        .setName('edit')
        .setDescription('Edit an existing shop item.')
        .addStringOption((o) => o.setName('name').setDescription('Current item name').setRequired(true))
        .addStringOption((o) => o.setName('new_name').setDescription('New item name'))
        .addStringOption((o) => o.setName('description').setDescription('New description'))
        .addIntegerOption((o) => o.setName('price').setDescription('New price').setMinValue(1))
        .addBooleanOption((o) => o.setName('repeatable').setDescription('Repeatable'))
        .addBooleanOption((o) => o.setName('active').setDescription('Active in shop')))
      .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Deactivate a shop item.')
        .addStringOption((o) => o.setName('name').setDescription('Item name to remove').setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('restock')
        .setDescription('Restock a shop item.')
        .addStringOption((o) => o.setName('name').setDescription('Item name').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Stock to add').setRequired(true).setMinValue(1)))),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'Access denied, Tenno. Insufficient clearance.', ephemeral: true });
    }

    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    if (group === 'shop') {
      if (sub === 'add') {
        return handleAdd(interaction);
      }
      if (sub === 'edit') {
        return handleEdit(interaction);
      }
      if (sub === 'remove') {
        return handleRemove(interaction);
      }
      if (sub === 'restock') {
        return handleRestock(interaction);
      }
    }

    return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
  }
};

async function handleAdd(interaction) {
  const actionType = interaction.options.getString('action_type', true);
  const actionData = {};

  if (actionType === 'ROLE_GRANT') {
    const role = interaction.options.getRole('role');
    if (!role) {
      return interaction.reply({ content: 'ROLE_GRANT requires a role option.', ephemeral: true });
    }
    actionData.roleId = role.id;
  }
  if (actionType === 'CUSTOM_RESPONSE') {
    actionData.message = interaction.options.getString('message') || 'Thank you for your purchase!';
    actionData.dm = interaction.options.getBoolean('dm') ?? false;
  }

  const item = await addShopItem({
    name: interaction.options.getString('name', true),
    description: interaction.options.getString('description', true),
    price: interaction.options.getInteger('price', true),
    stock: interaction.options.getInteger('stock') ?? null,
    actionType,
    actionData,
    repeatable: interaction.options.getBoolean('repeatable') ?? true,
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: `${Terms.SHOP_NAME} — Item Added`, iconURL: Icons.CREDITS })
    .setTitle(item.name)
    .setDescription(item.description)
    .addFields(
      { name: 'Price', value: `${item.price} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Stock', value: item.stock === null ? '∞' : String(item.stock), inline: true },
      { name: 'Type', value: item.actionType, inline: true }
    )
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

async function handleEdit(interaction) {
  const name = interaction.options.getString('name', true);
  const updates = {};
  const newName = interaction.options.getString('new_name');
  const description = interaction.options.getString('description');
  const price = interaction.options.getInteger('price');
  const repeatable = interaction.options.getBoolean('repeatable');
  const active = interaction.options.getBoolean('active');

  if (newName != null) updates.name = newName;
  if (description != null) updates.description = description;
  if (price != null) updates.price = price;
  if (repeatable != null) updates.repeatable = repeatable;
  if (active != null) updates.active = active;

  if (Object.keys(updates).length === 0) {
    return interaction.reply({ content: 'No changes specified.', ephemeral: true });
  }

  const item = await editShopItem(name, updates);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: `${Terms.SHOP_NAME} — Item Edited`, iconURL: Icons.CREDITS })
    .setTitle(item.name)
    .addFields(
      ...Object.entries(updates).map(([key, value]) => ({
        name: key, value: String(value), inline: true
      }))
    )
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

async function handleRemove(interaction) {
  const name = interaction.options.getString('name', true);
  await removeShopItem(name);
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setAuthor({ name: `${Terms.SHOP_NAME} — Item Removed`, iconURL: Icons.CREDITS })
    .setDescription(`**${name}** has been deactivated from the ${Terms.SHOP_NAME}.`)
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

async function handleRestock(interaction) {
  const name = interaction.options.getString('name', true);
  const amount = interaction.options.getInteger('amount', true);
  const item = await restockShopItem(name, amount);
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: `${Terms.SHOP_NAME} — Restocked`, iconURL: Icons.CREDITS })
    .setDescription(`**${item.name}** restocked +${amount}\nNew stock: **${item.stock === null ? '∞' : item.stock}**`)
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}
