const { child } = require('../logger')
const { loop } = require('../utils/loop')
const { unix } = require('../utils/format')
const config = require('../config')
const scanner = require('./scanner')
const online = require('./online')
const { tally } = require('./stats')
const snapshots = require('../repositories/snapshots')
const ipinfo = require('../repositories/ipinfo')

const log = child('snapshots')
const MAX_AGE_SEC = 60

const dimRows = (kind, map) => [...map].map(([key, value]) => ({ kind, key: String(key), servers: value.servers, players: value.players }))

function collect() {
  const ts = Math.round(Date.now() / 60000) * 60
  const now = unix()
  const servers = scanner.getRecentServers().filter((s) => now - s.ts <= MAX_AGE_SEC)
  if (!servers.length) {
    log.debug('no live servers, snapshot skipped')
    return
  }

  const t = tally(servers)
  const counts = online.raw()

  snapshots.record(
    ts,
    {
      servers: t.servers,
      players: t.players,
      bots: t.bots,
      steamOnline: counts.steam,
      usgnOnline: counts.unrealSoftware,
      sentBytes: scanner.traffic.sentBytes,
      recvBytes: scanner.traffic.recvBytes
    },
    servers.map((s) => ({
      addr: `${s.ip}:${s.port}`,
      players: Math.max(s.players - s.bots, 0),
      bots: s.bots,
      maxplayers: s.maxplayers
    })),
    [...dimRows('map', t.maps), ...dimRows('country', t.countries), ...dimRows('gamemode', t.gamemodes)]
  )
  log.debug({ ts, servers: t.servers, players: t.players }, 'snapshot recorded')

  if (ts % 3600 === 0) {
    const removed = snapshots.prune(now)
    const geo = ipinfo.prune()
    log.info({ ...removed, geo, detailDays: config.retention.detailDays }, 'retention applied')
  }
}

class Snapshotter {
  task = null

  start() {
    this.task = loop(collect, () => 60000 - (Date.now() % 60000), (err) => log.error({ err }, 'snapshot failed'), { immediate: false })
  }

  stop() {
    return this.task?.stop()
  }
}

module.exports = new Snapshotter()
