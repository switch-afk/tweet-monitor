require("dotenv").config();
const https = require("https");
const WebSocket = require("ws");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const CONFIG = {
  TWITTER_API_KEY: process.env.TWITTER_API_KEY,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
  DISCORD_ROLE_ID: process.env.DISCORD_ROLE_ID,
};

const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let discordReady = false;
let ws = null;
let reconnectTimeout = null;

function decodeHtmlEntities(text) {
  if (!text) return text;
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function resolveUrl(shortUrl) {
  return new Promise((resolve) => {
    try {
      const url = new URL(shortUrl);
      const lib = url.protocol === "https:" ? https : require("http");
      const req = lib.request(shortUrl, { method: "HEAD", timeout: 5000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(shortUrl);
        }
        req.destroy();
      });
      req.on("error", () => resolve(shortUrl));
      req.on("timeout", () => { req.destroy(); resolve(shortUrl); });
      req.end();
    } catch {
      resolve(shortUrl);
    }
  });
}

async function expandTcoLinks(text) {
  if (!text) return text;
  const tcoRegex = /https?:\/\/t\.co\/[a-zA-Z0-9]+/g;
  const matches = text.match(tcoRegex);
  if (!matches) return text;

  const unique = [...new Set(matches)];
  const resolved = await Promise.all(unique.map((url) => resolveUrl(url)));

  let result = text;
  for (let i = 0; i < unique.length; i++) {
    if (resolved[i] !== unique[i]) {
      result = result.replaceAll(unique[i], resolved[i]);
    }
  }
  return result;
}

discord.once("ready", () => {
  discordReady = true;
  connectWebSocket();
});

async function sendTweetToDiscord(tweet) {
  if (!discordReady) return;

  const channel = await discord.channels.fetch(CONFIG.DISCORD_CHANNEL_ID);
  if (!channel) return;

  const author = tweet.author || {};
  const username = author.userName || author.username || "unknown";
  const displayName = author.name || username;
  const profilePic = author.profilePicture || author.avatar || null;

  let tweetText = decodeHtmlEntities(tweet.text || "");
  tweetText = await expandTcoLinks(tweetText);

  const embed = new EmbedBuilder()
    .setColor(0x1da1f2)
    .setAuthor({
      name: `${displayName} (@${username})`,
      iconURL: profilePic || undefined,
      url: `https://x.com/${username}`,
    })
    .setDescription(tweetText);

  if (tweet.media?.length > 0) {
    const img = tweet.media.find((m) => m.type === "photo" || m.media_url_https);
    if (img) embed.setImage(img.media_url_https || img.url);
  } else if (tweet.extendedEntities?.media?.length > 0) {
    const img = tweet.extendedEntities.media[0];
    if (img.media_url_https) embed.setImage(img.media_url_https);
  }

  await channel.send({
    content: `<@&${CONFIG.DISCORD_ROLE_ID}>`,
    embeds: [embed],
  });
}

function connectWebSocket() {
  if (ws) {
    try { ws.close(); } catch (_) {}
  }

  ws = new WebSocket("wss://ws.twitterapi.io/twitter/tweet/websocket", {
    headers: { "x-api-key": CONFIG.TWITTER_API_KEY },
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event_type === "tweet") {
        const tweets = msg.tweets || [];
        for (const tweet of tweets) {
          sendTweetToDiscord(tweet).catch(() => {});
        }
      }
    } catch {}
  });

  ws.on("close", () => scheduleReconnect());
  ws.on("error", () => {});
}

function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => connectWebSocket(), 10000);
}

process.on("SIGINT", () => {
  if (ws) ws.close();
  discord.destroy();
  process.exit(0);
});

discord.login(CONFIG.DISCORD_BOT_TOKEN);