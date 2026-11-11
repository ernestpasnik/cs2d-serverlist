const db = require('../db')
const config = require('../config')
const { unix } = require('../utils/format')

const RANGES = {
  '1h': { span: 3600, bucket: 60 },
  '6h': { span: 21600, bucket: 60 },
  '24h': { span: 86400, bucket: 300 },
  '7d': { span: 604800, bucket: 1800 },
  '30d': { span: 2592000, bucket: 7200 },
  '90d': { span: 7776000, bucket: 21600 },
  '1y': { span: 31536000, bucket: 86400 }
}
const GLOBAL_RANGES = Object.keys(RANGES)
const DETAIL_RANGES = GLOBAL_RANGES.filter((name) => RANGES[name].span <= config.retention.detailDays * 86400)
const DIM_KINDS = { maps: 'map', countries: 'country', gamemodes: 'gamemode' }

const insertGlobal = db.prepare(`
  INSERT OR REPLACE INTO snapshots (ts, servers, players, bots, steam_online, usgn_online, sent_bytes, recv_bytes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertServer = db.prepare(`
  INSERT OR REPLACE INTO snapshot_servers (addr_id, ts, players, bots, maxplayers) VALUES (?, ?, ?, ?, ?)
`)
const insertDim = db.prepare(`
  INSERT OR REPLACE INTO snapshot_dims (ts, kind, key, servers, players) VALUES (?, ?, ?, ?, ?)
`)
const selectAddr = db.prepare('SELECT id FROM snapshot_addrs WHERE addr = ?').pluck()
const insertAddr = db.prepare('INSERT INTO snapshot_addrs (addr) VALUES (?)')
const selectRanking = db.prepare(`
  SELECT key, SUM(servers) AS serverMinutes, SUM(players) AS playerMinutes, MAX(players) AS peakPlayers
  FROM snapshot_dims WHERE kind = ? AND ts >= ?
  GROUP BY key ORDER BY playerMinutes DESC, serverMinutes DESC LIMIT ?
`)
const deleteServers = db.prepare('DELETE FROM snapshot_servers WHERE ts < ?')
const deleteDims = db.prepare('DELETE FROM snapshot_dims WHERE ts < ?')
const deleteGlobal = db.prepare('DELETE FROM snapshots WHERE ts < ?')

const series = {}
for (const [name, { bucket }] of Object.entries(RANGES)) {
  series[name] = {
    global: db.prepare(`
      SELECT (ts / ${bucket}) * ${bucket} AS ts,
        ROUND(AVG(servers), 1) AS servers, ROUND(AVG(players), 1) AS players, MAX(players) AS peakPlayers,
        ROUND(AVG(bots), 1) AS bots, ROUND(AVG(steam_online)) AS steamOnline, ROUND(AVG(usgn_online)) AS usgnOnline
      FROM snapshots WHERE ts >= ? GROUP BY 1 ORDER BY 1
    `),
    server: db.prepare(`
      SELECT (ts / ${bucket}) * ${bucket} AS ts,
        ROUND(AVG(players), 1) AS players, MAX(players) AS peakPlayers, ROUND(AVG(bots), 1) AS bots, MAX(maxplayers) AS maxPlayers
      FROM snapshot_servers WHERE addr_id = ? AND ts >= ? GROUP BY 1 ORDER BY 1
    `)
  }
}

const addrIds = new Map()

function addrId(addr, create = false) {
  let id = addrIds.get(addr)
  if (id !== undefined) return id
  id = selectAddr.get(addr)
  if (id === undefined && create) id = Number(insertAddr.run(addr).lastInsertRowid)
  if (id === undefined) return null
  addrIds.set(addr, id)
  return id
}

const record = db.transaction((ts, summary, servers, dims) => {
  insertGlobal.run(
    ts, summary.servers, summary.players, summary.bots,
    summary.steamOnline, summary.usgnOnline, summary.sentBytes, summary.recvBytes
  )
  for (const s of servers) insertServer.run(addrId(s.addr, true), ts, s.players, s.bots, s.maxplayers)
  for (const d of dims) insertDim.run(ts, d.kind, d.key, d.servers, d.players)
})

const prune = db.transaction((now) => ({
  servers: deleteServers.run(now - config.retention.detailDays * 86400).changes,
  dims: deleteDims.run(now - config.retention.detailDays * 86400).changes,
  global: deleteGlobal.run(now - config.retention.globalDays * 86400).changes
}))

function globalSeries(range) {
  return series[range].global.all(unix() - RANGES[range].span)
}

function serverSeries(addr, range) {
  const id = addrId(addr)
  if (id === null) return null
  return series[range].server.all(id, unix() - RANGES[range].span)
}

function ranking(kind, range, limit) {
  return selectRanking.all(DIM_KINDS[kind], unix() - RANGES[range].span, limit)
}

module.exports = {
  RANGES,
  GLOBAL_RANGES,
  DETAIL_RANGES,
  DIM_KINDS,
  record,
  prune,
  globalSeries,
  serverSeries,
  ranking
}
