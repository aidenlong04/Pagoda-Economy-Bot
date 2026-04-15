# Privacy Policy — Pagoda Economy Bot

**Last Updated:** 2026-04-14

## Introduction

Pagoda Economy Bot ("the Bot") is a Discord bot that provides an in-server economy system themed around the Warframe universe. This Privacy Policy describes what data the Bot collects, how it is used, and your choices regarding that data.

## Data We Collect

The Bot collects only the minimum data necessary to provide its economy features:

| Data Type | What Is Stored | Why |
|---|---|---|
| Discord User ID | Your public Discord snowflake ID | To maintain your economy wallet, track quest progress, and identify you on leaderboards |
| Message Count | Aggregate count (not content) | To track quest progress (e.g., "Send 50 messages") |
| Voice Minutes | Aggregate minutes in voice channels | To track quest progress (e.g., "60 minutes in voice") |
| Reaction Count | Aggregate count | To track quest progress |
| Transaction History | Amount, type, timestamp | To maintain an auditable economy ledger |
| Purchase History | Item purchased, timestamp | To enforce one-time purchase limits |

### What We Do NOT Collect

- **Message content** — The Bot never reads, stores, or processes the text of your messages.
- **DM content** — The Bot does not read or store direct messages.
- **IP addresses** — The Bot does not log IP addresses from Discord interactions.
- **Personal information** — No email, name, age, or other personal identifiers are collected.

## How Data Is Used

All collected data is used exclusively to:

1. Maintain your in-server economy balance (Alliance Standing)
2. Track progress toward quests and achievements
3. Display leaderboards
4. Process shop purchases and event participation

Data is **never** sold, shared with third parties, or used for advertising purposes.

## Data Storage

- Data is stored in a PostgreSQL database accessible only to the bot operator.
- The database is not publicly accessible.
- Data is retained as long as the bot operates in your server.

## Data Deletion

You may request deletion of your data by contacting the server administrator or the bot operator. Upon request, all records associated with your Discord User ID will be permanently removed from the database.

## Data Retention

- Economy data is retained indefinitely while the bot is active in a server.
- When the bot is removed from a server, the server administrator may request a full data purge.

## Children's Privacy

The Bot does not knowingly collect data from users under 13 years of age, in accordance with Discord's Terms of Service which require users to be at least 13 years old.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be noted by updating the "Last Updated" date above.

## Contact

For questions about this Privacy Policy or data deletion requests, please open an issue at:
https://github.com/aidenlong04/Pagoda-Economy-Bot/issues
