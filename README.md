# tweet-monitor

Discord bot that monitors tweets in real-time via [TwitterAPI.io](https://twitterapi.io) WebSocket and forwards them to a Discord channel with a role ping.

## Setup

```bash
git clone https://github.com/switch-afk/tweet-monitor.git
cd tweet-monitor
npm install
cp .env.example .env
```

Fill in `.env` with your values, then:

```bash
node index.js
```

Or with PM2:

```bash
pm2 start index.js --name tweet-monitor
```

## Configuration

Set up your tweet filter rules at [twitterapi.io/tweet-filter-rules](https://twitterapi.io/tweet-filter-rules) and make sure at least one rule is active.

## Bot Permissions

The Discord bot needs: **Send Messages**, **Embed Links**, **Mention Everyone**