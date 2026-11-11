const Reader = require('./reader')

const LIST_REQUEST = Buffer.from([1, 0, 20, 1])
const QUERY_REQUEST = Buffer.from([1, 0, 251, 1, 248, 3, 251, 5])
const PLAYER_MIN_BYTES = 11

function parseServerList(buffer) {
  const r = new Reader(buffer)
  if (r.readShort() !== 1 || r.readByte() !== 20) return null

  const count = r.readShort()
  const servers = []
  for (let i = 0; i < count && r.remaining() >= 6; i++) {
    const o4 = r.readByte()
    const o3 = r.readByte()
    const o2 = r.readByte()
    const o1 = r.readByte()
    servers.push(`${o1}.${o2}.${o3}.${o4}:${r.readShort()}`)
  }
  return servers
}

function parseServerQuery(buffer) {
  const r = new Reader(buffer)
  if (r.readShort() !== 1 || r.readByte() !== 251 || r.readByte() !== 1) return null

  const flags1 = r.readByte()
  if (!(flags1 & 0x10)) return null

  const server = {
    password: !!(flags1 & 0x01),
    usgnonly: !!(flags1 & 0x02),
    fow: !!(flags1 & 0x04),
    friendlyfire: !!(flags1 & 0x08),
    lua: !!(flags1 & 0x40),
    forcelight: !!(flags1 & 0x80),
    name: r.readSString(),
    map: r.readSString(),
    players: r.readByte(),
    maxplayers: r.readByte(),
    gamemode: flags1 & 0x20 ? r.readByte() : 0,
    bots: r.readByte()
  }

  const flags2 = r.readByte()
  server.recoil = !!(flags2 & 0x01)
  server.offscreendamage = !!(flags2 & 0x02)
  server.hasdownloads = !!(flags2 & 0x04)
  r.skip(2)
  if (r.overrun) return null

  const count = r.readByte()
  const playerlist = []
  for (let i = 0; i < count && r.remaining() >= PLAYER_MIN_BYTES; i++) {
    const player = {
      id: r.readByte(),
      name: r.readSString(),
      team: r.readByte(),
      score: r.readInt(),
      deaths: r.readInt()
    }
    if (r.overrun) break
    playerlist.push(player)
  }
  playerlist.sort((a, b) => b.score - a.score)
  server.playerlist = playerlist

  return server
}

module.exports = { LIST_REQUEST, QUERY_REQUEST, parseServerList, parseServerQuery }
