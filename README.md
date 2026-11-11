# CS2D Server List

[![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://cs2d.pp.ua)

Monitoring service for CS2D game servers. It tracks live server state, stores per-minute history for charts, parses player leaderboards and map files, and exposes everything through a CORS-enabled public JSON API.

![CS2D Server List Preview](https://i.imgur.com/YQzKxmI.png)

## Features

- Live server status: players, bots, map, game mode, region and latency
- Per-minute snapshots with global, per-server, map, country and game mode history
- Leaderboards uploaded by servers, with player profiles across servers
- Map parser with generated minimaps
- Discord webhook alerts that keep a single message updated
- Public JSON API with CORS support

## Requirements

- Node.js 22 or newer
- An IPInfo API key (optional, enables country, city and network data)

SQLite is embedded through `better-sqlite3`; no external database is needed.

## Quick start

```bash
git clone https://github.com/ernestpasnik/cs2d-serverlist.git
cd cs2d-serverlist
npm install
cp .env.example .env
npm start
```

For development with automatic restarts and pretty logs use `npm run dev`.

## Configuration

All settings are read from environment variables or a `.env` file.

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Listen address |
| `PORT` | `3000` | Listen port |
| `NODE_ENV` | `development` | Set to `production` for JSON logs and static caching |
| `LOG_LEVEL` | `info` | Pino log level |
| `BASE_URL` | `https://cs2d.pp.ua` | Public URL used in Discord embeds |
| `DB_PATH` | `data/cs2d.db` | SQLite database file |
| `IPINFO_APIKEY` | empty | IPInfo token; geolocation is skipped without it |
| `SCAN_CONCURRENCY` | `10` | Maximum servers queried at the same time |
| `SCAN_INTERVAL_MS` | `10000` | Minimum time between scan cycles |
| `SCAN_TIMEOUT_MS` | `1500` | Per-server response timeout |
| `MAX_SERVERS` | `2000` | Upper limit of tracked servers |
| `RETENTION_DETAIL_DAYS` | `14` | Retention of per-server and breakdown snapshots |
| `RETENTION_GLOBAL_DAYS` | `365` | Retention of global snapshots |
| `MAPS_FORCE_RELOAD` | `0` | Set to `1` to re-parse all maps on startup |

## Architecture

```
src/
  index.js          process lifecycle and graceful shutdown
  app.js            Fastify setup, plugins, error handling
  config.js         environment configuration
  logger.js         structured logging (pino)
  db/               SQLite connection and versioned migrations
  protocol/         binary reader and CS2D UDP packet parsers
  repositories/     SQL access, one module per aggregate
  services/         scanner, snapshots, leaderboards, webhooks, maps
  routes/           HTML pages and JSON API
  utils/            formatting, concurrency and helper functions
```

The scanner keeps a single UDP socket, refreshes the master server list every five minutes and queries tracked servers in rounds with a fixed concurrency limit. Servers that stop responding for two minutes are dropped.

Once per minute the snapshotter stores global totals, per-server player counts and map, country and game mode breakdowns in SQLite. Old rows are pruned hourly according to the retention settings.

## API

All endpoints are prefixed with `/api` and return JSON.

| Endpoint | Description |
| --- | --- |
| `GET /api/servers` | All live servers |
| `GET /api/:addr` | One server, or several as `ip:port,ip:port` (up to 50) |
| `GET /api/maps/:mapName` | Map details with neighbouring maps |
| `GET /api/history?range=24h` | Global series: servers, players, bots, online counts |
| `GET /api/history/:addr?range=24h` | Player series for one server |
| `GET /api/rankings/:kind?range=24h&limit=10` | Top `maps`, `countries` or `gamemodes` by player minutes |
| `POST /api/upload` | Leaderboard upload (multipart) |

History ranges: `1h`, `6h`, `24h`, `7d`, `30d`, `90d`, `1y` for the global series. Per-server history and rankings accept the ranges that fit within `RETENTION_DETAIL_DAYS`. Player counts exclude bots.

### Leaderboard upload

The request is a multipart form with a `.dat` file in `file`, the server `port`, and an optional `sort` mode (`0`, `1` or `2`, default `1`). The server is identified by the request IP and the given port, and must be currently listed. Player ids are stored as USGN ids or 32-bit Steam account ids.

## Data

Everything is stored in a single SQLite file in WAL mode. Back it up with the SQLite online backup API or by copying the database together with its `-wal` file while the service is stopped.

## License

Released under the [MIT License](LICENSE).
