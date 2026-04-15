# Copilot Instructions — Pagoda Economy Bot

## Project Overview

This is a **Warframe-themed Discord economy bot** built with discord.js v14 and Prisma/PostgreSQL. It provides Alliance Standing (AP) as virtual currency with shops, quests, achievements, events, and leaderboards. Uses Discord v2 message components (buttons, select menus) for interactive UX.

## Architecture

- **Runtime:** Node.js 20+ (CommonJS modules)
- **Framework:** discord.js v14 — slash commands + message components (buttons, select menus)
- **Database:** PostgreSQL via Prisma ORM with serializable transaction isolation
- **HTTP:** Express.js for health checks and event tracking endpoints
- **Scheduler:** node-cron for event lifecycle management + daily leaderboard webhook
- **Tests:** Vitest with `--globals` flag

## Key Design Decisions

### Warframe Theming
All embeds, terminology, and flavor text are centralized in `src/config/warframeTheme.js`. Colors, icons, and terms reference the Warframe universe (Tenno, Lotus, Orokin factions). Theme data originates from the [warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull) repository.

### Command Structure (5 commands total)
Commands are consolidated to minimize Discord's 100-command limit usage:

| Command | Type | Description |
|---|---|---|
| `/standing view` | Public | View AP balance (+ daily claim button) |
| `/standing daily` | Public | Claim daily tribute (+ view balance button) |
| `/leaderboard` | Public | Paginated clan leaderboard (button pagination) |
| `/market browse` | Public | Browse Tenno Market (quick-buy select menu) |
| `/market buy` | Public | Purchase item (with autocomplete) |
| `/market inventory` | Public | View Arsenal (inventory) |
| `/profile missions` | Public | View Codex Mission progress (tab navigation) |
| `/profile mastery` | Public | View Mastery Challenge progress (tab navigation) |
| `/admin shop add\|edit\|remove\|restock` | Admin | Shop CRUD |
| `/admin config get\|set` | Admin | Runtime config |
| `/admin event create` | Admin | Create Tactical Alerts |
| `/admin grant ap` | Admin | Direct AP grants |

### Message Components (Discord v2 API)
- **Buttons** — Navigation between views (standing ↔ daily, market ↔ inventory, profile tabs, leaderboard pagination)
- **Select Menus** — Quick-buy item selector in market browse
- All component interactions are routed through `src/events/componentHandler.js`
- Custom IDs follow `command:action` naming convention (e.g., `standing:daily`, `leaderboard:2`, `market:buy`)

### Webhook Leaderboard
- A persistent leaderboard message is posted/edited via `WebhookClient` in a designated channel
- Message ID stored in Config table (key: `LEADERBOARD_MESSAGE_ID`)
- Updated daily at midnight UTC via cron + on bot startup
- Configured via `LEADERBOARD_WEBHOOK_URL` environment variable

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
├── bot.js              # Client setup, intents, sweepers, cron (events + leaderboard)
├── index.js            # Entry point (Express + bot login)
├── logger.js           # Structured JSON logger
├── commands/           # Slash command handlers
│   ├── index.js        # Command registry + REST registration
│   ├── admin.js        # /admin (shop, config, event, grant)
│   ├── market.js       # /market (browse, buy, inventory) + select menu
│   ├── standing.js     # /standing (view, daily) + claim button
│   ├── profile.js      # /profile (missions, mastery) + tab buttons
│   └── leaderboard.js  # /leaderboard + pagination buttons
├── config/
│   ├── defaultConfig.js
│   └── warframeTheme.js  # ALL theming constants
├── db/prisma.js
├── events/             # Discord event listeners
│   ├── interactionCreate.js  # Routes commands, buttons, select menus
│   ├── componentHandler.js   # Button & select menu interaction handlers
│   ├── messageCreate.js
│   ├── messageReactionAdd.js
│   ├── voiceStateUpdate.js
│   └── ready.js
├── models/             # Static definitions (achievements, quest templates)
├── routes/             # Express routes (health, event tracking)
├── services/           # Business logic layer
│   ├── economyService.js      # Core AP operations
│   ├── shopService.js         # Buy/sell + admin CRUD
│   ├── questService.js        # Quest progress tracking
│   ├── achievementService.js
│   ├── eventService.js        # Event lifecycle + summary embeds
│   ├── leaderboardWebhook.js  # Persistent webhook leaderboard
│   ├── configService.js       # Runtime config
│   └── permissions.js         # Admin check
└── utils/
    └── embeds.js       # Centralized embed builders
```

## Code Conventions

- All database access goes through service layer files in `src/services/`
- Commands never import Prisma directly — they call service functions
- All embeds use colors/icons from `warframeTheme.js` — never hardcode hex values
- Admin commands check `isAdmin()` which validates ManageGuild permission OR configured ADMIN_ROLE_ID
- Error handling: commands catch errors and reply ephemeral; event handlers log and swallow
- Component custom IDs follow `command:action` convention (e.g., `standing:view`, `market:browse`)
- Button interactions use `interaction.update()` for in-place edits (not `reply()`)

## Testing

```bash
npm test          # vitest run --globals
npm run test:watch # vitest --globals (watch mode)
```

Tests are unit tests that don't require a database connection. They test:
- Pure function logic (validation, qualification algorithms, embed building)
- Theme constant exports
- Route helper functions
- Leaderboard embed and pagination builders

## Environment Variables

See `.env.example` for all supported variables. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` — Bot credentials
- `REGISTER_COMMANDS_ON_START=true` — Register slash commands on boot
- `ADMIN_ROLE_ID` — Optional admin role override
- `LEADERBOARD_WEBHOOK_URL` — Discord webhook URL for persistent leaderboard (optional)

## When Making Changes

1. **Adding a new command:** Add to the appropriate parent (public → new file, admin → new subcommand group in admin.js). Register in `commands/index.js`.
2. **Adding component interactions:** Add handler in `events/componentHandler.js`, use `command:action` custom ID convention.
3. **Adding new theming:** Add to `warframeTheme.js` only. Never hardcode colors/icons.
4. **Adding new economy operations:** Add to the appropriate service file. Always use serializable transactions for balance changes.
5. **Modifying schema:** Create a new Prisma migration (`npx prisma migrate dev --name <name>`).
6. **Run tests** after any service/utility changes: `npm test`
