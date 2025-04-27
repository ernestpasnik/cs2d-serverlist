const streams = require('./streams.js')

function serverlist(buf, size) {
  const d = new streams(buf, size)
  if (d.readShort() != 1 || d.readByte() != 20) return
  return Array.from({ length: d.readShort() }, () => {
    const oct4 = d.readByte()
    const oct3 = d.readByte()
    const oct2 = d.readByte()
    const oct1 = d.readByte()
    const port = d.readShort()
    return `${oct1}.${oct2}.${oct3}.${oct4}:${port}`
  })
}

function serverquery(buf, size) {
  const d = new streams(buf, size)
  if (d.readShort() != 1 || d.readByte() != 251 || d.readByte() != 1) return
  let flags = d.readByte()
  
  // Validate version
  if (Boolean(flags & 16) == false) return

  const r = {}
  r.password = Boolean(flags & 1)
  r.usgnonly = Boolean(flags & 2)
  r.fow = Boolean(flags & 4)
  r.friendlyfire = Boolean(flags & 8)
  r.lua = Boolean(flags & 64)
  r.forcelight = Boolean(flags & 128)
  r.name = d.readString(d.readByte())
  r.map = d.readString(d.readByte())
  r.players = d.readByte()
  r.maxplayers = d.readByte()
  r.gamemode = (flags & 32) ? d.readByte() : 0
  r.bots = d.readByte()
  flags = d.readByte()
  r.recoil = Boolean(flags & 1)
  r.offscreendamage = Boolean(flags & 2)
  r.hasdownloads = Boolean(flags & 4)
  r.playerlist = Array.from({ length: d.readByte(2) }, () => ({
    id: d.readByte(),
    name: d.readString(d.readByte()),
    team: d.readByte(),
    score: d.readInt(),
    deaths: d.readInt()
  }))
  return r
}

module.exports = {
  serverlist,
  serverquery
}
