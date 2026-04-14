function isAdmin(interaction) {
  const hasManageGuild = interaction.memberPermissions?.has('ManageGuild');
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  const hasConfiguredRole = adminRoleId && interaction.member?.roles?.cache?.has(adminRoleId);
  return Boolean(hasManageGuild || hasConfiguredRole);
}

module.exports = { isAdmin };
