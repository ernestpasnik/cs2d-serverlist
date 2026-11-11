module.exports = [
  `
  CREATE TABLE ipinfo (
    ip TEXT PRIMARY KEY,
    country TEXT,
    city TEXT,
    org TEXT,
    expires_at INTEGER NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE maps (
    name TEXT PRIMARY KEY,
    hash TEXT NOT NULL,
    size INTEGER NOT NULL,
    mtime_ms INTEGER NOT NULL,
    data TEXT NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE leaderboards (
    addr TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_mode INTEGER NOT NULL,
    ts INTEGER NOT NULL,
    usgn_users INTEGER NOT NULL,
    steam_users INTEGER NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE leaderboard_players (
    addr TEXT NOT NULL REFERENCES leaderboards(addr) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    name TEXT NOT NULL,
    usertype INTEGER NOT NULL,
    userid INTEGER NOT NULL,
    score INTEGER NOT NULL,
    kills INTEGER NOT NULL,
    deaths INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    mvps INTEGER NOT NULL,
    time INTEGER NOT NULL,
    PRIMARY KEY (addr, rank)
  ) WITHOUT ROWID;
  CREATE INDEX leaderboard_players_user ON leaderboard_players (userid, usertype);

  CREATE TABLE webhooks (
    url TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    servers TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE snapshots (
    ts INTEGER PRIMARY KEY,
    servers INTEGER NOT NULL,
    players INTEGER NOT NULL,
    bots INTEGER NOT NULL,
    steam_online INTEGER,
    usgn_online INTEGER,
    sent_bytes INTEGER NOT NULL,
    recv_bytes INTEGER NOT NULL
  );

  CREATE TABLE snapshot_addrs (
    id INTEGER PRIMARY KEY,
    addr TEXT NOT NULL UNIQUE
  );

  CREATE TABLE snapshot_servers (
    addr_id INTEGER NOT NULL,
    ts INTEGER NOT NULL,
    players INTEGER NOT NULL,
    bots INTEGER NOT NULL,
    maxplayers INTEGER NOT NULL,
    PRIMARY KEY (addr_id, ts)
  ) WITHOUT ROWID;
  CREATE INDEX snapshot_servers_ts ON snapshot_servers (ts);

  CREATE TABLE snapshot_dims (
    ts INTEGER NOT NULL,
    kind TEXT NOT NULL,
    key TEXT NOT NULL,
    servers INTEGER NOT NULL,
    players INTEGER NOT NULL,
    PRIMARY KEY (kind, key, ts)
  ) WITHOUT ROWID;
  CREATE INDEX snapshot_dims_ts ON snapshot_dims (ts);
  `
]
