# Pagoda Economy Bot

A Warframe-themed Discord economy bot built around **Alliance Standing (AP)** — featuring atomic currency transactions, a configurable Tenno Market, Codex Missions (quests), Mastery Challenges (achievements), and Tactical Alert events with URL tracking.

Themed after the Warframe universe using data structures from [aidenlong04/warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

### Economy
- Integer-precision AP wallet with serializable transaction isolation
- `/standing` — View your Standing with a themed embed showing balance, total earned/spent, and recent activity
- `/leaderboard [page]` — Clan Leaderboard with button-based pagination (Previous/Next)
- Earn AP through quests, events, messages, voice activity, and admin grants

### Persistent Webhook Leaderboard
- Auto-updated daily at midnight UTC via `WebhookClient`
- Also refreshed on bot startup
- Posts a single persistent message in a designated channel (edited in-place)
- Configure via `LEADERBOARD_WEBHOOK_URL` and `LEADERBOARD_CHANNEL_ID` environment variables

### Tenno Market (`/market` command)
- `/market` — Browse active items with quick-buy select menu and Arsenal button
- Component-based navigation: buy via select menu, view inventory via button

### Admin Hub (Consolidated `/admin` command — requires ManageGuild)
- `/admin shop add|edit|remove|restock` — Full shop CRUD
- `/admin config get|set` — Runtime configuration
- `/admin event create` — Create timed Tactical Alerts
- `/admin grant ap` — Direct AP grants to users
- `/admin quest create|edit|remove|list` — Quest CRUD with recurring/expiry options
- `/admin achievement create|edit|remove` — Achievement CRUD with role rewards

### Codex Profile (Consolidated `/profile` command)
- `/profile missions` — View active quest progress with visual progress bars + tab navigation
- `/profile mastery` — View milestone progress with tab navigation
- Button-based tab switching between missions and mastery views

### Tactical Alerts (Events)
- Admin-only timed event creation via `/admin event create`
- URL endpoint tracking: `GET /api/events/:eventId/track?user=<discordId>`
- Channel interaction tracking (messages + reactions)
- Rich per-channel summary embeds posted on event close
- Conditions: minimum unique participants or individual interaction threshold

### Discord v2 Components
- **Buttons** — Navigation between related views (market ↔ inventory, missions ↔ mastery)
- **Select Menus** — Quick-buy item selector in market browse
- **Pagination** — Button-based page navigation on leaderboard (Previous / Page N / Next)
- Component interactions handled via dedicated `componentHandler.js`

### HTTP Endpoints
- `GET /health` — Uptime + DB status
- `GET /api/events/:eventId/track?user=<discordId>[&redirect=<url>]` — Event tracking with allowlisted redirects

## Discord.js Best Practices

This bot follows [Discord's developer documentation](https://discord.com/developers/docs) recommendations:

- **Slash commands only** — no message-prefix commands, ready for verification
- **Message components** — buttons, select menus for interactive UX (Discord API v2)
- **`defaultMemberPermissions`** on admin commands — Discord hides them from non-admins natively
- **`deferReply()`** for DB-heavy commands — avoids 3-second interaction timeout
- **Cache sweepers** configured — bounded memory growth via `Options.DefaultSweeperSettings`
- **Proper `ActivityType` enum** usage — not magic numbers
- **Minimal intents** — only requests the gateway intents actually used
- **Graceful shutdown** — handles SIGINT/SIGTERM for clean disconnects

## Tech Stack

- **Runtime:** Node.js 20+
- **Discord:** discord.js v14
- **Database:** PostgreSQL + Prisma ORM (serializable isolation)
- **HTTP:** Express.js 5
- **Scheduler:** node-cron
- **Tests:** Vitest
- **Linting:** ESLint 9

## Project Structure

```
src/
├── commands/           # 5 slash commands (consolidated)
│   ├── admin.js        # /admin shop|config|event|grant|quest|achievement
│   ├── market.js       # /market (browse with quick-buy + inventory button)
│   ├── standing.js     # /standing (view balance)
│   ├── profile.js      # /profile missions|mastery
│   └── leaderboard.js  # /leaderboard (with button pagination)
├── config/
│   ├── defaultConfig.js
│   └── warframeTheme.js  # Colors, icons, terms, flavor text
├── db/prisma.js
├── events/             # Discord gateway event listeners
│   ├── interactionCreate.js  # Slash commands + buttons + select menus
│   ├── componentHandler.js   # Button & select menu interaction router
│   ├── messageCreate.js
│   ├── messageReactionAdd.js
│   ├── voiceStateUpdate.js
│   └── ready.js
├── models/             # Achievement & quest template definitions
├── routes/             # Express HTTP routes
├── services/           # Business logic layer
│   ├── leaderboardWebhook.js  # Persistent webhook leaderboard
│   └── ...
├── utils/              # Embed builders, helpers
├── bot.js              # Client setup + sweepers + cron (events + leaderboard)
├── index.js            # Entry point
└── logger.js
prisma/
├── schema.prisma       # 13 models, full data model
├── migrations/
└── seed.js             # Warframe-themed seed data
```

## Environment Variables

Copy `.env.example` to `.env` and fill values:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application client ID |
| `DISCORD_GUILD_ID` | Server to register commands in |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | HTTP server port (default: 3000) |
| `BOT_LOG_CHANNEL_ID` | Optional Discord channel for error logs |
| `ADMIN_ROLE_ID` | Optional role ID for admin commands |
| `REGISTER_COMMANDS_ON_START` | `true` to register slash commands on boot |
| `EVENT_REDIRECT_ALLOWLIST` | Comma-separated allowed redirect hosts |
| `LEADERBOARD_WEBHOOK_URL` | Discord webhook URL for persistent leaderboard (optional) |
| `LEADERBOARD_CHANNEL_ID` | Channel ID for persistent leaderboard |

## Local Setup

```bash
npm install
cp .env.example .env
# Edit .env with your values
./setup.sh
npm start
```

## Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

## PM2 Production

```bash
pm2 start src/index.js --name pagoda-economy-bot
pm2 save
pm2 startup
pm2 install pm2-logrotate
```

## Commands Reference

| Command | Access | Description |
|---|---|---|
| `/standing` | Everyone | View Alliance Standing |
| `/leaderboard [page]` | Everyone | Top 25 Tenno (button pagination) |
| `/market` | Everyone | Browse Tenno Market (quick-buy menu + inventory) |
| `/profile missions` | Everyone | Codex Mission progress |
| `/profile mastery` | Everyone | Mastery Challenge progress |
| `/admin shop add\|edit\|remove\|restock` | ManageGuild | Shop CRUD |
| `/admin config get\|set` | ManageGuild | Runtime config |
| `/admin event create` | ManageGuild | Create Tactical Alert |
| `/admin grant ap` | ManageGuild | Direct AP grant |
| `/admin quest create\|edit\|remove\|list` | ManageGuild | Quest CRUD |
| `/admin achievement create\|edit\|remove` | ManageGuild | Achievement CRUD |

## Webhook Leaderboard Setup

To enable the auto-updating persistent leaderboard:

1. In your Discord server, go to a channel → Edit Channel → Integrations → Webhooks → New Webhook
2. Copy the webhook URL
3. Set `LEADERBOARD_WEBHOOK_URL` in your `.env` file
4. Set `LEADERBOARD_CHANNEL_ID` to the target channel ID
5. The bot will post a leaderboard message on startup and update it daily at midnight UTC

## Bot Verification Documents

For Discord bot verification compliance:

- [Privacy Policy](PRIVACY_POLICY.md) — What data is collected, how it's used, deletion rights
- [Terms of Service](TERMS_OF_SERVICE.md) — Usage terms, virtual currency disclaimer
- [License](LICENSE) — MIT License

## Warframe Data Reference

This bot's theming pulls from the [warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull) project which aggregates data from:
- `@wfcd/items` — Warframe community item database
- `warframe-worldstate-data` — World state reference data
- `warframe-public-export-plus` — Official game export data
- Warframe drop tables API (`drops.warframestat.us`)
