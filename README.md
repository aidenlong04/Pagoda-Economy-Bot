# Pagoda Economy Bot

A Warframe-themed Discord economy bot built around **Alliance Standing (AP)** — featuring atomic currency transactions, a configurable Tenno Market, Codex Missions (quests), Mastery Challenges (achievements), and Tactical Alert events with URL tracking.

Themed after the Warframe universe using data structures from [aidenlong04/warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull).

## Features

### Economy
- Integer-precision AP wallet with serializable transaction isolation
- `/balance` — View your Standing with a themed embed
- `/pay <user> <amount>` — Transfer AP to another Tenno
- `/leaderboard [page]` — Clan Leaderboard with top 25 per page
- `/daily` — Claim your Daily Tribute (configurable cooldown & reward)

### Tenno Market (Shop)
- `/shop` — Browse active items with stock, price, and action types
- `/buy <item>` — Purchase with role grant, custom message, or inventory item actions
- `/inventory` — View your Arsenal

### Admin Shop Management
- `/admin shop add` — Add items (role grant, custom response, inventory)
- `/admin shop edit` — Edit name, description, price, repeatable, active status
- `/admin shop remove` — Deactivate an item
- `/admin shop restock` — Add stock to an item

### Codex Missions (Quests)
- `/quests` — View active quest progress with visual progress bars
- Daily/Weekly/Custom quest types with auto-completion and AP rewards
- Warframe-themed quest names (Transmissions Intercepted, Signal Boost, Void Meditation)

### Mastery Challenges (Achievements)
- `/achievements` — View milestone progress with percentage completion
- Categories: Earning, Spending, Activity, Quest milestones
- One-time AP bonus + optional role badge on unlock

### Tactical Alerts (Events)
- `/event create` — Admin-only timed event creation
- URL endpoint tracking: `GET /api/events/:eventId/track?user=<discordId>`
- Channel interaction tracking (messages + reactions)
- Rich per-channel summary embeds posted on event close
- Conditions: minimum unique participants or individual interaction threshold

### Configuration
- `/config set <key> <value>` — Runtime config without redeployment
- `/config get <key>` — View current config value

### HTTP Endpoints
- `GET /health` — Uptime + DB status
- `GET /api/events/:eventId/track?user=<discordId>[&redirect=<url>]` — Event tracking

## Tech Stack

- **Runtime:** Node.js 18+
- **Discord:** discord.js v14
- **Database:** PostgreSQL + Prisma ORM
- **HTTP:** Express.js 5
- **Scheduler:** node-cron

## Project Structure

```
src/
├── commands/        # Slash command handlers
│   ├── admin.js     # /admin shop add|edit|remove|restock
│   ├── balance.js   # /balance
│   ├── buy.js       # /buy
│   ├── daily.js     # /daily
│   ├── shop.js      # /shop
│   └── ...
├── config/
│   ├── defaultConfig.js
│   └── warframeTheme.js  # Colors, icons, terms, flavor text
├── db/
│   └── prisma.js
├── events/          # Discord event listeners
├── models/          # Achievement & quest template definitions
├── routes/          # Express HTTP routes
├── services/        # Business logic (economy, shop, quest, achievement, event)
├── bot.js           # Discord client setup + cron
├── index.js         # Entry point
└── logger.js
prisma/
├── schema.prisma    # Full data model
├── migrations/      # PostgreSQL migrations
└── seed.js          # Default data (Warframe-themed)
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
| `/pay <user> <amount>` | Everyone | Transfer AP |
| `/leaderboard [page]` | Everyone | Top 25 Tenno |
| `/daily` | Everyone | Daily Tribute |
| `/shop` | Everyone | Browse Tenno Market |
| `/buy <item>` | Everyone | Purchase item |
| `/inventory` | Everyone | View Arsenal |
| `/quests` | Everyone | Codex Mission progress |
| `/achievements` | Everyone | Mastery Challenge progress |
| `/config set <key> <value>` | Admin | Set runtime config |
| `/config get <key>` | Admin | View config value |
| `/event create ...` | Admin | Create Tactical Alert |
| `/admin shop add ...` | Admin | Add shop item |
| `/admin shop edit ...` | Admin | Edit shop item |
| `/admin shop remove ...` | Admin | Deactivate shop item |
| `/admin shop restock ...` | Admin | Add stock to item |

## Warframe Data Reference

This bot's theming pulls from the [warframe-item-pull](https://github.com/aidenlong04/warframe-item-pull) project which aggregates data from:
- `@wfcd/items` — Warframe community item database
- `warframe-worldstate-data` — World state reference data
- `warframe-public-export-plus` — Official game export data
- Warframe drop tables API (`drops.warframestat.us`)
