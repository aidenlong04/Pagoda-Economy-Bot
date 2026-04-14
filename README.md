# Pagoda-Economy-Bot

Discord economy bot centered around **Alliance Standing (AP)** with economy, quests, achievements, shop, and timed event tracking.

## Features

- AP wallet + atomic transactions + transaction logging
- `/balance`, `/pay`, `/leaderboard`, `/daily`
- Configurable shop with role/custom/inventory purchase actions
- Quest progress tracking (`/quests`) with daily/weekly/custom support
- Achievement milestones (`/achievements`) with AP and optional role rewards
- Event system with URL click tracking endpoint
  - `GET /api/events/:eventId/track?user=<discordId>[&redirect=<url>]` (returns JSON acknowledgement and optional validated `redirectUrl`)
- Health endpoint: `GET /health`
- Runtime config command: `/config set <key> <value>`

## Tech Stack

- Node.js 18+
- discord.js v14
- PostgreSQL + Prisma
- Express.js
- node-cron

## Project Structure

- `src/commands/` slash commands
- `src/events/` Discord event listeners
- `src/models/` model constants/templates
- `src/routes/` HTTP routes
- `src/services/` business logic
- `prisma/` schema, migrations, seed

## Environment Variables

Copy `.env.example` to `.env` and fill values:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DATABASE_URL`
- `PORT`
- `BOT_LOG_CHANNEL_ID` (optional)
- `ADMIN_ROLE_ID` (optional)
- `REGISTER_COMMANDS_ON_START`
- `DAILY_REWARD_AP`
- `DAILY_COOLDOWN_SECONDS`
- `EVENT_REDIRECT_ALLOWLIST` (comma-separated allowed external redirect hosts)

## Local Setup

```bash
npm install
cp .env.example .env
./setup.sh
npm start
```

## Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

## Setup Script

`setup.sh` performs:

1. Prisma client generation
2. Migration deployment
3. Seed data insertion

## Commands

- `/balance`
- `/pay user amount`
- `/leaderboard [page]`
- `/daily`
- `/shop`
- `/buy item`
- `/inventory`
- `/quests`
- `/achievements`
- `/config set key value` (admin)
- `/event create ...` (admin)

## PM2 Recommendation

```bash
pm2 start src/index.js --name pagoda-economy-bot
pm2 save
pm2 startup
```

Enable log rotation:

```bash
pm2 install pm2-logrotate
```
