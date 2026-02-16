# tweet-monitor

Discord bot that monitors tweets in real-time via [TwitterAPI.io](https://twitterapi.io) WebSocket and forwards them to a Discord channel with a role ping.

## Demo

<iframe width="1446" height="813" src="https://www.youtube.com/embed/usPyGJnF8rY" title="Tweet Monitor - Real-Time Twitter Notifications for Discord" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Setup

```bash
git clone https://github.com/switch-afk/tweet-monitor.git
cd tweet-monitor
npm install
cp .env.example .env
```

Fill in `.env` with your values (see Environment Variables section), then:

```bash
node index.js
```

Or with PM2:

```bash
pm2 start index.js --name tweet-monitor
```

## Environment Variables

The app reads configuration from environment variables. Copy `.env.example` to `.env` and fill these values:

- `TWITTER_API_KEY`: Your API key for TwitterAPI.io (used to authenticate the WebSocket).
- `DISCORD_BOT_TOKEN`: Your Discord bot token (from the Discord Developer Portal).
- `DISCORD_CHANNEL_ID`: The numeric ID of the Discord channel to post tweets into.
- `DISCORD_ROLE_ID`: The ID of the role to ping when a tweet matches (optional; set to a role ID to mention it).

Example `.env` (already provided in `.env.example`):

```dotenv
TWITTER_API_KEY=your_twitterapi_io_api_key_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here
DISCORD_ROLE_ID=your_discord_role_id_here
```

## Configuration

Set up your tweet filter rules at [twitterapi.io/tweet-filter-rules](https://twitterapi.io/tweet-filter-rules) and make sure at least one rule is active.

## Bot Permissions

The Discord bot needs: **Send Messages**, **Embed Links**, **Mention Everyone**

## Running with PM2 (recommended for production)

PM2 keeps the bot running and restarts it if it crashes. Start with:

```bash
pm2 start index.js --name tweet-monitor
```

To view logs:

```bash
pm2 logs tweet-monitor
```

To stop or restart:

```bash
pm2 stop tweet-monitor
pm2 restart tweet-monitor
```

Deploying updates on a server (example):

```bash
# on the server where the bot runs
cd /path/to/tweet-monitor
git pull origin main
npm install --production
pm2 restart tweet-monitor
```