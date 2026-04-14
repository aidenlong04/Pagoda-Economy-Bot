# Pagoda Economy Bot

A Warframe-themed Discord economy bot built around **Alliance Standing (AP)** — featuring atomic currency transactions, a configurable Tenno Market, Codex Missions (quests), Mastery Challenges (achievements), and Tactical Alert events with URL tracking.

Themed after the Warframe universe using data structures from [aidenlong04/warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

### Economy
- Integer-precision AP wallet with serializable transaction isolation
- `/balance` — View your Standing with a themed embed
- `/leaderboard [page]` — Clan Leaderboard with top 25 per page (deferred for large queries)
- `/daily` — Claim your Daily Tribute (configurable cooldown & reward)

### Tenno Market (Consolidated `/market` command)
- `/market browse` — Browse active items with stock, price, and action types
- `/market buy <item>` — Purchase with autocomplete item search, deferred reply
- `/market inventory` — View your Arsenal

### Admin Hub (Consolidated `/admin` command — requires ManageGuild)
- `/admin shop add|edit|remove|restock` — Full shop CRUD
- `/admin config get|set` — Runtime configuration
- `/admin event create` — Create timed Tactical Alerts
- `/admin grant ap` — Direct AP grants to users

### Codex Missions (Quests)
- `/quests` — View active quest progress with visual progress bars
- Daily/Weekly/Custom quest types with auto-completion and AP rewards
- Warframe-themed quest names (Transmissions Intercepted, Signal Boost, Void Meditation)

### Mastery Challenges (Achievements)
- `/achievements` — View milestone progress with percentage completion
- Categories: Earning, Spending, Activity, Quest milestones
- One-time AP bonus + optional role badge on unlock

### Tactical Alerts (Events)
- Admin-only timed event creation via `/admin event create`
- URL endpoint tracking: `GET /api/events/:eventId/track?user=<discordId>`
- Channel interaction tracking (messages + reactions)
- Rich per-channel summary embeds posted on event close
- Conditions: minimum unique participants or individual interaction threshold

### HTTP Endpoints
- `GET /health` — Uptime + DB status
- `GET /api/events/:eventId/track?user=<discordId>[&redirect=<url>]` — Event tracking with allowlisted redirects

## Discord.js Best Practices

This bot follows [Discord's developer documentation](https://discord.com/developers/docs) recommendations:

- **Slash commands only** — no message-prefix commands, ready for verification
- **`defaultMemberPermissions`** on admin commands — Discord hides them from non-admins natively
- **Autocomplete** for item names in `/market buy` — reduces failed lookups and API calls
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

## Project Structure

```
src/
├── commands/           # 7 slash commands (consolidated)
│   ├── admin.js        # /admin shop|config|event|grant
│   ├── market.js       # /market browse|buy|inventory
│   ├── balance.js      # /balance
│   ├── daily.js        # /daily
│   ├── leaderboard.js  # /leaderboard
│   ├── quests.js       # /quests
│   └── achievements.js # /achievements
├── config/
│   ├── defaultConfig.js
│   └── warframeTheme.js  # Colors, icons, terms, flavor text
├── db/prisma.js
├── events/             # Discord gateway event listeners
├── models/             # Achievement & quest template definitions
├── routes/             # Express HTTP routes
├── services/           # Business logic layer
├── utils/              # Embed builders, helpers
├── bot.js              # Client setup + sweepers + cron
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
| `DAILY_REWARD_AP` | Daily tribute reward (default: 100) |
| `DAILY_COOLDOWN_SECONDS` | Daily cooldown in seconds (default: 86400) |
| `EVENT_REDIRECT_ALLOWLIST` | Comma-separated allowed redirect hosts |

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
| `/balance` | Everyone | View Alliance Standing |
| `/leaderboard [page]` | Everyone | Top 25 Tenno |
| `/daily` | Everyone | Daily Tribute |
| `/market browse` | Everyone | Browse Tenno Market |
| `/market buy <item>` | Everyone | Purchase (with autocomplete) |
| `/market inventory` | Everyone | View Arsenal |
| `/quests` | Everyone | Codex Mission progress |
| `/achievements` | Everyone | Mastery Challenge progress |
| `/admin shop add\|edit\|remove\|restock` | ManageGuild | Shop CRUD |
| `/admin config get\|set` | ManageGuild | Runtime config |
| `/admin event create` | ManageGuild | Create Tactical Alert |
| `/admin grant ap` | ManageGuild | Direct AP grant |

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
