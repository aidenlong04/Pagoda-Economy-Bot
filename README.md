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

## System Requirements & Specs

### Minimum Hardware

| Resource | Minimum | Recommended | Notes |
|---|---|---|---|
| **CPU** | 1 vCPU | 2 vCPU | Node.js is single-threaded; 1 core for the bot, 1 for Postgres |
| **RAM** | 512 MB | 1 GB | Bot capped at 256 MB (V8 heap 128 MB) + Postgres capped at 256 MB |
| **Disk** | 5 GB NVMe/SSD | 10–15 GB NVMe/SSD | Alpine Docker images ~150 MB; DB data for hundreds of users < 100 MB |
| **Network** | 500 GB/mo | 1 TB/mo | Discord WebSocket + HTTP health checks; very low bandwidth |

> **Typical idle usage:** ~60–80 MB RSS for Node.js, ~40–60 MB for Postgres, near 0% CPU. Total system stays under 300 MB RAM except during message bursts.

### Software Requirements

| Software | Version | Required |
|---|---|---|
| **Node.js** | 20+ (LTS) | Yes |
| **PostgreSQL** | 16+ | Yes |
| **Docker & Docker Compose** | 24+ / v2+ | Recommended (simplifies deployment) |
| **Git** | 2.x | Yes |
| **PM2** | 5+ | Optional (alternative to Docker) |

### Operating System

The bot is fully Dockerized with **Alpine Linux** images (`node:20-alpine`, `postgres:16-alpine`). The host OS just needs to run Docker. Recommended options:

- **Ubuntu 22.04/24.04 LTS** — Best community support, most VPS providers default to this
- **Debian 12** — Minimal footprint, stable
- **Alpine Linux** — Smallest image if running bare metal

---

## VPS Hosting Guide

### DigitalOcean (Recommended)

DigitalOcean is an excellent choice for this bot — simple interface, fast NVMe SSDs on all plans, and per-second billing.

#### Recommended Plans

| Plan | Specs | Monthly Cost | Fit |
|---|---|---|---|
| **Basic $6** | 1 vCPU, 1 GB RAM, 25 GB SSD, 1 TB transfer | **$6/mo** | ✅ Minimum viable — runs both containers comfortably |
| **Basic $12** ⭐ | 1 vCPU, 2 GB RAM, 50 GB SSD, 2 TB transfer | **$12/mo** | ⭐ **Best value** — headroom for growth and log retention |
| **Basic $18** | 2 vCPU, 2 GB RAM, 60 GB SSD, 3 TB transfer | **$18/mo** | Good if running other services alongside the bot |
| **Premium AMD $7** | 1 vCPU, 1 GB RAM, 25 GB NVMe, 1 TB transfer | **$7/mo** | NVMe with dedicated AMD CPU — great for DB performance |

> **Our pick:** The **Basic $12/mo** droplet (1 vCPU / 2 GB RAM / 50 GB SSD) gives you plenty of room for the bot, Postgres, Docker overhead, and log files — all for the cost of two coffees.

#### DigitalOcean Quick Deploy

```bash
# 1. Create a droplet: Ubuntu 24.04 LTS, Basic $12/mo, nearest datacenter
# 2. SSH into your new droplet
ssh root@your-droplet-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh

# 4. Clone and deploy
git clone https://github.com/aidenlong04/Pagoda-Economy-Bot.git
cd Pagoda-Economy-Bot
cp .env.example .env
nano .env  # Fill in your Discord credentials (see Setup Guide below)

# 5. Launch
docker compose up -d --build

# 6. Verify
docker compose logs -f bot  # Watch for "Ready! Logged in as ..."
```

### Other VPS Providers

| Provider | Plan | Specs | Cost |
|---|---|---|---|
| **Hetzner CX22** | Shared | 2 vCPU, 4 GB RAM, 40 GB NVMe | ~€4/mo |
| **Vultr Cloud Compute** | Regular | 1 vCPU, 1 GB RAM, 25 GB NVMe | $5/mo |
| **Contabo VPS S** | Shared | 4 vCPU, 8 GB RAM, 50 GB NVMe | ~€6/mo |
| **Oracle Cloud Free Tier** | ARM | 1 OCPU, 1 GB RAM, 50 GB | Free forever |

---

## Database: PostgreSQL

This bot uses **PostgreSQL 16** via Prisma ORM — it is the ideal database for this workload:

| Requirement | Why PostgreSQL |
|---|---|
| **AP balance tracking** | `Serializable` transaction isolation prevents double-spending race conditions |
| **Leaderboards** | `ORDER BY balance DESC` with `SKIP/TAKE` pagination — native SQL strength |
| **Quest progress** | Composite unique indexes (`userId, questId`) enforce one progress row per user-quest |
| **Event interactions** | Composite index on `(eventId, userId, timestamp)` for fast aggregation |
| **Shop transactions** | ACID transactions ensure balance deduction + purchase + inventory update are atomic |
| **Concurrent writes** | Connection pool (5 connections, 10s timeout) handles message bursts without contention |

The `docker-compose.yml` ships with production-tuned Postgres settings optimized for NVMe:

```
shared_buffers=64MB, work_mem=4MB, max_connections=20,
random_page_cost=1.1, checkpoint_completion_target=0.9
```

> **Why not SQLite?** No concurrent write support — deadlocks under message bursts.
> **Why not MongoDB?** No native multi-document ACID — economy bots need atomicity.
> **Why not Redis?** Volatile by default — user balances would be lost on restart.

## Tech Stack

- **Runtime:** Node.js 20+
- **Discord:** discord.js v14
- **Database:** PostgreSQL 16 + Prisma ORM (serializable isolation)
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

## Setup Guide

### Step 1 — Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g., "Pagoda Economy Bot")
3. Go to **Bot** tab → click **Reset Token** → copy and save the token
4. Enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Manage Roles`, `Send Messages`, `Embed Links`, `Read Message History`, `Add Reactions`, `Use Slash Commands`
6. Copy the generated URL → open it → invite the bot to your server
7. Copy these IDs (enable Developer Mode in Discord Settings → Advanced):
   - **Client ID** — from the Developer Portal → General Information
   - **Guild ID** — right-click your server name → Copy Server ID

### Step 2 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DISCORD_TOKEN=your-bot-token-here
DISCORD_CLIENT_ID=your-client-id-here
DISCORD_GUILD_ID=your-server-id-here
DATABASE_URL=postgresql://postgres:postgres@db:5432/pagoda_economy?schema=public&connection_limit=5&pool_timeout=10
PORT=3000
ADMIN_ROLE_ID=                          # Optional: role ID for admin commands
REGISTER_COMMANDS_ON_START=true
LEADERBOARD_WEBHOOK_URL=                # Optional: webhook URL for persistent leaderboard
LEADERBOARD_CHANNEL_ID=                 # Optional: channel ID for leaderboard
EVENT_REDIRECT_ALLOWLIST=example.com    # Comma-separated allowed redirect hosts
```

> **Note:** If running without Docker, change `db` in `DATABASE_URL` to `localhost`.

### Step 3 — Deploy

#### Option A: Docker (Recommended)

```bash
git clone https://github.com/aidenlong04/Pagoda-Economy-Bot.git
cd Pagoda-Economy-Bot
cp .env.example .env
nano .env  # Fill in your values

# Build and start both containers (bot + Postgres)
docker compose up -d --build

# Check logs
docker compose logs -f bot

# Stop
docker compose down

# Update
git pull && docker compose up -d --build
```

Docker Compose handles everything: Postgres provisioning, Prisma migrations, seed data, and the bot itself.

#### Option B: Local / Bare Metal

Requires Node.js 20+ and PostgreSQL 16+ installed locally.

```bash
git clone https://github.com/aidenlong04/Pagoda-Economy-Bot.git
cd Pagoda-Economy-Bot
npm install
cp .env.example .env
nano .env  # Fill in your values (use localhost for DATABASE_URL)

# Run Prisma setup (generate client, run migrations, seed data)
./setup.sh

# Start the bot
npm start
```

#### Option C: PM2 (Production Process Manager)

For bare-metal deployments with auto-restart and log rotation:

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start src/index.js --name pagoda-economy-bot

# Enable startup on system boot
pm2 startup
pm2 save

# Log rotation
pm2 install pm2-logrotate

# View logs
pm2 logs pagoda-economy-bot

# Restart after updates
git pull && npm install && pm2 restart pagoda-economy-bot
```

### Step 4 — Verify

1. The bot should appear online in your Discord server
2. Type `/standing` — you should see your AP balance embed
3. Type `/market` — you should see the Tenno Market
4. Check health endpoint: `curl http://localhost:3000/health`

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
