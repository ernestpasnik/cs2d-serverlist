const Reader = require('../protocol/reader')
const { child } = require('../logger')
const { steam64To32 } = require('../utils/steam')
const { unix } = require('../utils/format')
const leaderboards = require('../repositories/leaderboards')

const log = child('leaderboard')
const HEADER = 'userstats steam'
const MAX_PLAYERS = 50000
const SCORERS = [
  (p) => p.score + p.kills - p.deaths,
  (p) => p.assists + p.kills - p.deaths,
  (p) => p.score + p.assists + p.deaths
]

class InvalidUpload extends Error {}

function parse(buffer) {
  const r = new Reader(buffer)
  if (r.readLine() !== HEADER) throw new InvalidUpload('Invalid file')

  const players = []
  let usgnUsers = 0
  let steamUsers = 0

  while (players.length < MAX_PLAYERS) {
    const name = r.readLine()
    if (!name.trim()) break

    const usertype = r.readByte()
    const rawId = r.readInt64()
    const player = {
      name,
      usertype,
      userid: usertype === 0 ? Number(rawId) : steam64To32(rawId),
      score: r.readInt(),
      kills: r.readInt(),
      deaths: r.readInt(),
      assists: r.readInt(),
      mvps: r.readInt(),
      time: r.readInt()
    }
    if (r.overrun) break

    if (usertype === 0) usgnUsers++
    else steamUsers++
    players.push(player)
  }

  return { players, usgnUsers, steamUsers }
}

function ingest({ addr, name, sort, buffer }) {
  const started = performance.now()
  const { players, usgnUsers, steamUsers } = parse(buffer)
  const score = SCORERS[sort] ?? SCORERS[1]
  players.sort((a, b) => score(b) - score(a))

  leaderboards.save({ addr, name, sortMode: sort, ts: unix(), usgnUsers, steamUsers, players })
  log.info({ addr, players: players.length, ms: Math.round(performance.now() - started) }, 'leaderboard stored')
}

module.exports = { ingest, InvalidUpload }
