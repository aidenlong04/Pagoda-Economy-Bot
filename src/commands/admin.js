const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addShopItem, editShopItem, removeShopItem, restockShopItem } = require('../services/shopService');
const { setConfig, getConfig } = require('../services/configService');
const { createEvent } = require('../services/eventService');
const { grantAp } = require('../services/economyService');
const { isAdmin } = require('../services/permissions');
const { Colors, Icons, Terms } = require('../config/warframeTheme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin management — shop, config, events, grants (ManageGuild required).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
        .addIntegerOption((o) => o.setName('amount').setDescription('Stock to add').setRequired(true).setMinValue(1))))
    .addSubcommandGroup((group) => group
      .setName('config')
      .setDescription('Runtime configuration.')
      .addSubcommand((sub) => sub
        .setName('set')
        .setDescription('Set a config key/value pair.')
        .addStringOption((o) => o.setName('key').setDescription('Config key').setRequired(true))
        .addStringOption((o) => o.setName('value').setDescription('Config value').setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('get')
        .setDescription('View a config value.')
        .addStringOption((o) => o.setName('key').setDescription('Config key').setRequired(true))))
    .addSubcommandGroup((group) => group
      .setName('event')
      .setDescription(`Manage ${Terms.EVENT}s.`)
      .addSubcommand((sub) => sub
        .setName('create')
        .setDescription(`Create a timed ${Terms.EVENT}.`)
        .addStringOption((o) => o.setName('name').setDescription('Event name').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(true))
        .addStringOption((o) => o.setName('start').setDescription('ISO start time').setRequired(true))
        .addStringOption((o) => o.setName('end').setDescription('ISO end time').setRequired(true))
        .addIntegerOption((o) => o.setName('reward').setDescription(`${Terms.CURRENCY_ABBREV} reward`).setRequired(true).setMinValue(1))
        .addStringOption((o) => o
          .setName('condition')
          .setDescription('Condition type')
          .setRequired(true)
          .addChoices(
            { name: 'Minimum unique participants', value: 'MIN_UNIQUE_PARTICIPANTS' },
            { name: 'Individual interaction threshold', value: 'INDIVIDUAL_INTERACTION_THRESHOLD' }
          ))
        .addIntegerOption((o) => o.setName('condition_value').setDescription('Condition value').setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName('channels').setDescription('Comma-separated channel IDs').setRequired(true))))
    .addSubcommandGroup((group) => group
      .setName('grant')
      .setDescription('Direct AP grants.')
      .addSubcommand((sub) => sub
        .setName('ap')
        .setDescription('Grant AP to a user.')
        .addUserOption((o) => o.setName('user').setDescription('Recipient').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('AP amount').setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName('reason').setDescription('Grant reason')))),

  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'Access denied, Tenno. Insufficient clearance.', ephemeral: true });
    }

    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    if (group === 'shop') {
      if (sub === 'add') return handleShopAdd(interaction);
      if (sub === 'edit') return handleShopEdit(interaction);
      if (sub === 'remove') return handleShopRemove(interaction);
      if (sub === 'restock') return handleShopRestock(interaction);
    }

    if (group === 'config') {
      if (sub === 'get') return handleConfigGet(interaction);
      if (sub === 'set') return handleConfigSet(interaction);
    }

    if (group === 'event') {
      if (sub === 'create') return handleEventCreate(interaction);
    }

    if (group === 'grant') {
      if (sub === 'ap') return handleGrantAp(interaction);
    }

    return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
  }
};

// ── Shop handlers ──────────────────────────────────────────────────────────

async function handleShopAdd(interaction) {
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

async function handleShopEdit(interaction) {
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

async function handleShopRemove(interaction) {
  const name = interaction.options.getString('name', true);
  await removeShopItem(name);
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setAuthor({ name: `${Terms.SHOP_NAME} — Item Removed`, iconURL: Icons.CREDITS })
    .setDescription(`**${name}** has been deactivated from the ${Terms.SHOP_NAME}.`)
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

async function handleShopRestock(interaction) {
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

// ── Config handlers ────────────────────────────────────────────────────────

async function handleConfigGet(interaction) {
  const key = interaction.options.getString('key', true);
  const value = await getConfig(key);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: 'Configuration', iconURL: Icons.CODEX })
    .addFields({ name: key, value: value ?? '*not set*' })
    .setTimestamp();
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleConfigSet(interaction) {
  const key = interaction.options.getString('key', true);
  const value = interaction.options.getString('value', true);
  await setConfig(key, value);
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setAuthor({ name: 'Configuration Updated', iconURL: Icons.CODEX })
    .addFields({ name: key, value })
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handleEventCreate(interaction) {
  const start = new Date(interaction.options.getString('start', true));
  const end = new Date(interaction.options.getString('end', true));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return interaction.reply({ content: 'Invalid start/end date values.', ephemeral: true });
  }

  await interaction.deferReply();
  const event = await createEvent({
    name: interaction.options.getString('name', true),
    description: interaction.options.getString('description', true),
    startTime: start,
    endTime: end,
    rewardAp: interaction.options.getInteger('reward', true),
    conditionType: interaction.options.getString('condition', true),
    conditionValue: interaction.options.getInteger('condition_value', true),
    channelIds: interaction.options.getString('channels', true).split(',').map((v) => v.trim()).filter(Boolean)
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.LOTUS)
    .setAuthor({ name: `${Terms.EVENT} Created`, iconURL: Icons.LOTUS })
    .setTitle(event.name)
    .setDescription(event.description)
    .addFields(
      { name: 'Start', value: `<t:${Math.floor(start.getTime() / 1000)}:F>`, inline: true },
      { name: 'End', value: `<t:${Math.floor(end.getTime() / 1000)}:F>`, inline: true },
      { name: 'Reward', value: `${event.rewardAp} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Condition', value: `${event.conditionType.replace(/_/g, ' ')} ≥ ${event.conditionValue}` },
      { name: 'Tracking URL', value: `\`/api/events/${event.id}/track?user=<discordId>\`` }
    )
    .setFooter({ text: `Event ID: ${event.id}` })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

// ── Grant handler ──────────────────────────────────────────────────────────

async function handleGrantAp(interaction) {
  const recipient = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount', true);
  const reason = interaction.options.getString('reason') || 'Admin grant';

  const user = await grantAp(recipient.id, amount, 'ADMIN_GRANT', interaction.user.id, { reason });
  const embed = new EmbedBuilder()
    .setColor(Colors.OROKIN)
    .setAuthor({ name: 'AP Grant', iconURL: Icons.CREDITS })
    .setDescription(`Granted **${amount.toLocaleString()} ${Terms.CURRENCY_ABBREV}** to <@${recipient.id}>`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'New Balance', value: `${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true }
    )
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}
