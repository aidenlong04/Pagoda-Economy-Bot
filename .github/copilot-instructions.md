# Copilot Instructions — Pagoda Economy Bot

## Project Overview

This is a **Warframe-themed Discord economy bot** built with discord.js v14 and Prisma/PostgreSQL. It provides Alliance Standing (AP) as virtual currency with shops, quests, achievements, events, and leaderboards.

## Architecture

- **Runtime:** Node.js 20+ (CommonJS modules)
- **Framework:** discord.js v14 — slash commands only, no message-prefix commands
- **Database:** PostgreSQL via Prisma ORM with serializable transaction isolation
- **HTTP:** Express.js for health checks and event tracking endpoints
- **Scheduler:** node-cron for event lifecycle management
- **Tests:** Vitest with `--globals` flag

## Key Design Decisions

### Warframe Theming
All embeds, terminology, and flavor text are centralized in `src/config/warframeTheme.js`. Colors, icons, and terms reference the Warframe universe (Tenno, Lotus, Orokin factions). Theme data originates from the [warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull) repository.

### Command Structure (8 commands total)
Commands are consolidated to minimize Discord's 100-command limit usage:

| Command | Type | Description |
|---|---|---|
| `/balance` | Public | View AP balance |
| `/pay` | Public | Transfer AP to another user |
| `/daily` | Public | Claim daily tribute |
| `/leaderboard` | Public | Paginated clan leaderboard |
| `/market browse` | Public | Browse Tenno Market |
| `/market buy` | Public | Purchase item (with autocomplete) |
| `/market inventory` | Public | View Arsenal (inventory) |
| `/quests` | Public | View Codex Mission progress |
| `/achievements` | Public | View Mastery Challenge progress |
| `/admin shop add\|edit\|remove\|restock` | Admin | Shop CRUD |
| `/admin config get\|set` | Admin | Runtime config |
| `/admin event create` | Admin | Create Tactical Alerts |
| `/admin grant ap` | Admin | Direct AP grants |

### Rate Limiting Practices
- Long-running DB queries use `interaction.deferReply()` to avoid 3-second timeout
- Market buy uses autocomplete to reduce failed lookups
- Cache sweepers configured to prevent unbounded memory growth
- Event scheduler runs once per minute (not per-second) to be gentle on DB

### Database Transactions
All balance-modifying operations use `Prisma.$transaction()` with `Serializable` isolation level to prevent race conditions and double-spending.

## File Structure

```
src/
├── bot.js              # Client setup, intents, sweepers, cron
├── index.js            # Entry point (Express + bot login)
├── logger.js           # Structured JSON logger
├── commands/           # Slash command handlers
│   ├── index.js        # Command registry + REST registration
│   ├── admin.js        # /admin (shop, config, event, grant)
│   ├── market.js       # /market (browse, buy, inventory)
│   └── ...             # balance, pay, daily, leaderboard, quests, achievements
├── config/
│   ├── defaultConfig.js
│   └── warframeTheme.js  # ALL theming constants
├── db/prisma.js
├── events/             # Discord event listeners
├── models/             # Static definitions (achievements, quest templates)
├── routes/             # Express routes (health, event tracking)
├── services/           # Business logic layer
│   ├── economyService.js   # Core AP operations
│   ├── shopService.js      # Buy/sell + admin CRUD
│   ├── questService.js     # Quest progress tracking
│   ├── achievementService.js
│   ├── eventService.js     # Event lifecycle + summary embeds
│   ├── configService.js    # Runtime config
│   └── permissions.js      # Admin check
└── utils/
    └── embeds.js       # Centralized embed builders
```

## Code Conventions

- All database access goes through service layer files in `src/services/`
- Commands never import Prisma directly — they call service functions
- All embeds use colors/icons from `warframeTheme.js` — never hardcode hex values
- Admin commands check `isAdmin()` which validates ManageGuild permission OR configured ADMIN_ROLE_ID
- Error handling: commands catch errors and reply ephemeral; event handlers log and swallow

## Testing

```bash
npm test          # vitest run --globals
npm run test:watch # vitest --globals (watch mode)
```

Tests are unit tests that don't require a database connection. They test:
- Pure function logic (validation, qualification algorithms, embed building)
- Theme constant exports
- Route helper functions

## Environment Variables

See `.env.example` for all supported variables. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` — Bot credentials
- `REGISTER_COMMANDS_ON_START=true` — Register slash commands on boot
- `ADMIN_ROLE_ID` — Optional admin role override

## When Making Changes

1. **Adding a new command:** Add to the appropriate parent (public → new file, admin → new subcommand group in admin.js). Register in `commands/index.js`.
2. **Adding new theming:** Add to `warframeTheme.js` only. Never hardcode colors/icons.
3. **Adding new economy operations:** Add to the appropriate service file. Always use serializable transactions for balance changes.
4. **Modifying schema:** Create a new Prisma migration (`npx prisma migrate dev --name <name>`).
5. **Run tests** after any service/utility changes: `npm test`
