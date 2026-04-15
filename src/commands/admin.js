const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addShopItem, editShopItem, removeShopItem, restockShopItem } = require('../services/shopService');
const { setConfig, getConfig } = require('../services/configService');
const { createEvent } = require('../services/eventService');
const { grantAp } = require('../services/economyService');
const { createQuest, editQuest, removeQuest, listAllQuests } = require('../services/questService');
const { createAchievement, editAchievement, removeAchievement } = require('../services/achievementService');
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
        .addStringOption((o) => o.setName('reason').setDescription('Grant reason'))))
    .addSubcommandGroup((group) => group
      .setName('quest')
      .setDescription('Manage Codex Missions (quests).')
      .addSubcommand((sub) => sub
        .setName('create')
        .setDescription('Create a new quest.')
        .addStringOption((o) => o.setName('title').setDescription('Quest title').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Quest description').setRequired(true))
        .addStringOption((o) => o
          .setName('type')
          .setDescription('Quest type / rotation')
          .setRequired(true)
          .addChoices(
            { name: 'Daily (Rotation A)', value: 'DAILY' },
            { name: 'Weekly (Rotation B)', value: 'WEEKLY' },
            { name: 'Monthly (Rotation C)', value: 'MONTHLY' },
            { name: 'Custom / Tactical Alert', value: 'CUSTOM' }
          ))
        .addStringOption((o) => o
          .setName('requirement_type')
          .setDescription('What the quest tracks')
          .setRequired(true)
          .addChoices(
            { name: 'Message Count', value: 'MESSAGE_COUNT' },
            { name: 'Reaction Count', value: 'REACTION_COUNT' },
            { name: 'Voice Minutes', value: 'VOICE_MINUTES' },
            { name: 'URL Clicks', value: 'URL_CLICKS' },
            { name: 'Custom', value: 'CUSTOM' }
          ))
        .addIntegerOption((o) => o.setName('requirement_value').setDescription('Target count to complete').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('reward').setDescription(`${Terms.CURRENCY_ABBREV} awarded on completion`).setRequired(true).setMinValue(1))
        .addStringOption((o) => o
          .setName('recurring')
          .setDescription('Auto-reset schedule (progress resets each cycle)')
          .addChoices(
            { name: 'None (one-time)', value: 'NONE' },
            { name: 'Daily', value: 'DAILY' },
            { name: 'Weekly', value: 'WEEKLY' },
            { name: 'Monthly', value: 'MONTHLY' }
          ))
        .addStringOption((o) => o.setName('expires_in').setDescription('Expire duration (e.g. 7d, 24h, 30d). Omit for no expiry.'))
        .addUserOption((o) => o.setName('assigned_to').setDescription('Assign to a specific user (omit for everyone)')))
      .addSubcommand((sub) => sub
        .setName('edit')
        .setDescription('Edit an existing quest.')
        .addStringOption((o) => o.setName('quest_id').setDescription('Quest ID').setRequired(true))
        .addStringOption((o) => o.setName('title').setDescription('New title'))
        .addStringOption((o) => o.setName('description').setDescription('New description'))
        .addIntegerOption((o) => o.setName('requirement_value').setDescription('New target count').setMinValue(1))
        .addIntegerOption((o) => o.setName('reward').setDescription('New AP reward').setMinValue(1))
        .addBooleanOption((o) => o.setName('active').setDescription('Active/inactive'))
        .addStringOption((o) => o.setName('expires_in').setDescription('New expire duration (e.g. 7d, 24h)'))
        .addStringOption((o) => o
          .setName('recurring')
          .setDescription('Change recurring schedule')
          .addChoices(
            { name: 'None (one-time)', value: 'NONE' },
            { name: 'Daily', value: 'DAILY' },
            { name: 'Weekly', value: 'WEEKLY' },
            { name: 'Monthly', value: 'MONTHLY' }
          )))
      .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Deactivate a quest (removes from board).')
        .addStringOption((o) => o.setName('quest_id').setDescription('Quest ID').setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('list')
        .setDescription('List all quests (active and inactive).')))
    .addSubcommandGroup((group) => group
      .setName('achievement')
      .setDescription('Manage Mastery Challenges (achievements).')
      .addSubcommand((sub) => sub
        .setName('create')
        .setDescription('Create a new achievement.')
        .addStringOption((o) => o.setName('name').setDescription('Achievement name (unique)').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Achievement description').setRequired(true))
        .addStringOption((o) => o
          .setName('category')
          .setDescription('Achievement category')
          .setRequired(true)
          .addChoices(
            { name: 'Earning (totalEarned)', value: 'EARNING' },
            { name: 'Spending (totalSpent)', value: 'SPENDING' },
            { name: 'Activity (messageCount)', value: 'ACTIVITY' },
            { name: 'Quest (questsCompleted)', value: 'QUEST' }
          ))
        .addIntegerOption((o) => o.setName('threshold').setDescription('Threshold to unlock').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('reward').setDescription(`${Terms.CURRENCY_ABBREV} reward on unlock`).setRequired(true).setMinValue(0))
        .addRoleOption((o) => o.setName('role').setDescription('Role to grant on unlock (optional)')))
      .addSubcommand((sub) => sub
        .setName('edit')
        .setDescription('Edit an existing achievement.')
        .addStringOption((o) => o.setName('name').setDescription('Current achievement name').setRequired(true))
        .addStringOption((o) => o.setName('new_name').setDescription('New name'))
        .addStringOption((o) => o.setName('description').setDescription('New description'))
        .addIntegerOption((o) => o.setName('threshold').setDescription('New threshold').setMinValue(1))
        .addIntegerOption((o) => o.setName('reward').setDescription('New AP reward').setMinValue(0))
        .addRoleOption((o) => o.setName('role').setDescription('New role to grant on unlock')))
      .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Delete an achievement (and user unlocks).')
        .addStringOption((o) => o.setName('name').setDescription('Achievement name').setRequired(true)))),

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

    if (group === 'quest') {
      if (sub === 'create') return handleQuestCreate(interaction);
      if (sub === 'edit') return handleQuestEdit(interaction);
      if (sub === 'remove') return handleQuestRemove(interaction);
      if (sub === 'list') return handleQuestList(interaction);
    }

    if (group === 'achievement') {
      if (sub === 'create') return handleAchievementCreate(interaction);
      if (sub === 'edit') return handleAchievementEdit(interaction);
      if (sub === 'remove') return handleAchievementRemove(interaction);
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
    .setAuthor({ name: 'AP Grant', iconURL: Icons.PAGODA_EMBLEM })
    .setDescription(`Granted **${amount.toLocaleString()} ${Terms.CURRENCY_ABBREV}** to <@${recipient.id}>`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'New Balance', value: `${user.balance.toLocaleString()} ${Terms.CURRENCY_ABBREV}`, inline: true }
    )
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

// ── Quest handlers ─────────────────────────────────────────────────────────

/**
 * Parse a duration string like "7d", "24h", "30d" into a future Date.
 */
function parseDuration(str) {
  if (!str) return null;
  const match = str.trim().match(/^(\d+)\s*(h|d|w|m)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const ms = { h: 3600000, d: 86400000, w: 604800000, m: 2592000000 };
  return new Date(Date.now() + num * (ms[unit] || 0));
}

const ROTATION_LABELS = { DAILY: 'Rotation A — Daily', WEEKLY: 'Rotation B — Weekly', MONTHLY: 'Rotation C — Monthly', CUSTOM: 'Tactical Alert' };
const RECURRING_LABELS = { NONE: 'One-time', DAILY: 'Resets daily', WEEKLY: 'Resets weekly', MONTHLY: 'Resets monthly' };

async function handleQuestCreate(interaction) {
  await interaction.deferReply();
  const expiresIn = interaction.options.getString('expires_in');
  const expiresAt = parseDuration(expiresIn);
  const assignedUser = interaction.options.getUser('assigned_to');

  const quest = await createQuest({
    title: interaction.options.getString('title', true),
    description: interaction.options.getString('description', true),
    type: interaction.options.getString('type', true),
    requirementType: interaction.options.getString('requirement_type', true),
    requirementValue: interaction.options.getInteger('requirement_value', true),
    rewardAp: interaction.options.getInteger('reward', true),
    recurring: interaction.options.getString('recurring') || 'NONE',
    expiresAt,
    assignedTo: assignedUser?.id || null,
    createdBy: interaction.user.id,
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.LOTUS)
    .setAuthor({ name: `${Terms.QUEST_LABEL} — Created`, iconURL: Icons.CODEX })
    .setTitle(quest.title)
    .setDescription(quest.description)
    .addFields(
      { name: 'Type', value: ROTATION_LABELS[quest.type] || quest.type, inline: true },
      { name: 'Requirement', value: `${quest.requirementType.replace(/_/g, ' ')} ≥ ${quest.requirementValue}`, inline: true },
      { name: 'Reward', value: `${quest.rewardAp} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Recurring', value: RECURRING_LABELS[quest.recurring] || 'None', inline: true },
      { name: 'Expires', value: quest.expiresAt ? `<t:${Math.floor(quest.expiresAt.getTime() / 1000)}:F>` : 'Never', inline: true },
      { name: 'Assigned', value: assignedUser ? `<@${assignedUser.id}>` : 'Everyone', inline: true }
    )
    .setFooter({ text: `Quest ID: ${quest.id}` })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleQuestEdit(interaction) {
  const questId = interaction.options.getString('quest_id', true);
  const updates = {};

  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const reqValue = interaction.options.getInteger('requirement_value');
  const reward = interaction.options.getInteger('reward');
  const active = interaction.options.getBoolean('active');
  const expiresIn = interaction.options.getString('expires_in');
  const recurring = interaction.options.getString('recurring');

  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (reqValue != null) updates.requirementValue = reqValue;
  if (reward != null) updates.rewardAp = reward;
  if (active != null) updates.active = active;
  if (expiresIn != null) {
    const expiresAt = parseDuration(expiresIn);
    updates.expiresAt = expiresAt;
  }
  if (recurring != null) updates.recurring = recurring;

  if (Object.keys(updates).length === 0) {
    return interaction.reply({ content: 'No changes specified.', ephemeral: true });
  }

  const quest = await editQuest(questId, updates);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: `${Terms.QUEST_LABEL} — Edited`, iconURL: Icons.CODEX })
    .setTitle(quest.title)
    .addFields(
      ...Object.entries(updates).map(([key, value]) => ({
        name: key, value: value instanceof Date ? `<t:${Math.floor(value.getTime() / 1000)}:F>` : String(value), inline: true
      }))
    )
    .setFooter({ text: `Quest ID: ${quest.id}` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleQuestRemove(interaction) {
  const questId = interaction.options.getString('quest_id', true);
  const quest = await removeQuest(questId);
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setAuthor({ name: `${Terms.QUEST_LABEL} — Deactivated`, iconURL: Icons.CODEX })
    .setDescription(`**${quest.title}** has been removed from the Codex.`)
    .setFooter({ text: `Quest ID: ${quest.id}` })
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}

async function handleQuestList(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const quests = await listAllQuests();

  if (!quests.length) {
    return interaction.editReply({ content: 'No quests configured.' });
  }

  const lines = quests.map((q) => {
    const status = q.active ? '🟢' : '🔴';
    const recur = q.recurring !== 'NONE' ? ` ↻${q.recurring}` : '';
    const exp = q.expiresAt ? ` ⏰<t:${Math.floor(new Date(q.expiresAt).getTime() / 1000)}:R>` : '';
    return `${status} **${q.title}** (${q.type}${recur}${exp})\n> ${q.requirementType} ≥ ${q.requirementValue} • ${q.rewardAp} AP\n> \`ID: ${q.id}\``;
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: `${Terms.QUEST_LABEL} — All Quests`, iconURL: Icons.CODEX })
    .setDescription(lines.join('\n\n'))
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

// ── Achievement handlers ───────────────────────────────────────────────────

async function handleAchievementCreate(interaction) {
  await interaction.deferReply();
  const role = interaction.options.getRole('role');
  const achievement = await createAchievement({
    name: interaction.options.getString('name', true),
    description: interaction.options.getString('description', true),
    category: interaction.options.getString('category', true),
    threshold: interaction.options.getInteger('threshold', true),
    rewardAp: interaction.options.getInteger('reward', true),
    rewardRoleId: role?.id || null,
    createdBy: interaction.user.id,
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.OROKIN)
    .setAuthor({ name: `${Terms.ACHIEVEMENT} — Created`, iconURL: Icons.PAGODA_EMBLEM })
    .setTitle(achievement.name)
    .setDescription(achievement.description)
    .addFields(
      { name: 'Category', value: achievement.category, inline: true },
      { name: 'Threshold', value: achievement.threshold.toLocaleString(), inline: true },
      { name: 'Reward', value: `${achievement.rewardAp} ${Terms.CURRENCY_ABBREV}`, inline: true },
      { name: 'Role', value: role ? `<@&${role.id}>` : 'None', inline: true }
    )
    .setFooter({ text: `ID: ${achievement.id}` })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleAchievementEdit(interaction) {
  const name = interaction.options.getString('name', true);
  const updates = {};

  const newName = interaction.options.getString('new_name');
  const description = interaction.options.getString('description');
  const threshold = interaction.options.getInteger('threshold');
  const reward = interaction.options.getInteger('reward');
  const role = interaction.options.getRole('role');

  if (newName != null) updates.name = newName;
  if (description != null) updates.description = description;
  if (threshold != null) updates.threshold = threshold;
  if (reward != null) updates.rewardAp = reward;
  if (role) updates.rewardRoleId = role.id;

  if (Object.keys(updates).length === 0) {
    return interaction.reply({ content: 'No changes specified.', ephemeral: true });
  }

  const achievement = await editAchievement(name, updates);
  const embed = new EmbedBuilder()
    .setColor(Colors.TENNO)
    .setAuthor({ name: `${Terms.ACHIEVEMENT} — Edited`, iconURL: Icons.PAGODA_EMBLEM })
    .setTitle(achievement.name)
    .addFields(
      ...Object.entries(updates).map(([key, value]) => ({
        name: key, value: String(value), inline: true
      }))
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleAchievementRemove(interaction) {
  const name = interaction.options.getString('name', true);
  await removeAchievement(name);
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setAuthor({ name: `${Terms.ACHIEVEMENT} — Removed`, iconURL: Icons.PAGODA_EMBLEM })
    .setDescription(`**${name}** has been deleted.`)
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}
