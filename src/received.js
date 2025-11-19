'use strict'

const Streams = require('./utils/streams')

function serverlist(buf, size) {
  const d = new Streams(buf, size)
  
  if (d.readShort() !== 1 || d.readByte() !== 20) {
    return
  }
  
  const serverCount = d.readShort()
  const servers = new Array(serverCount)
  
  for (let i = 0; i < serverCount; i++) {
    const oct4 = d.readByte()
    const oct3 = d.readByte()
    const oct2 = d.readByte()
    const oct1 = d.readByte()
    const port = d.readShort()
    
    servers[i] = `${oct1}.${oct2}.${oct3}.${oct4}:${port}`
  }
  
  return servers
}

function serverquery(buf, size) {
  const d = new Streams(buf, size)
  
  if (d.readShort() !== 1 || d.readByte() !== 251 || d.readByte() !== 1) {
    return
  }
  
  const r = {}
  
  const flags1 = d.readByte()
  
  if (!(flags1 & 0x10)) {
    return
  }
  
  r.password = !!(flags1 & 0x01)
  r.usgnonly = !!(flags1 & 0x02)
  r.fow = !!(flags1 & 0x04)
  r.friendlyfire = !!(flags1 & 0x08)
  r.lua = !!(flags1 & 0x40)
  r.forcelight = !!(flags1 & 0x80)
  
  r.name = d.readSString()
  r.map = d.readSString()
  r.players = d.readByte()
  r.maxplayers = d.readByte()
  r.gamemode = (flags1 & 0x20) ? d.readByte() : 0
  r.bots = d.readByte()
  
  const flags2 = d.readByte()
  r.recoil = !!(flags2 & 0x01)
  r.offscreendamage = !!(flags2 & 0x02)
  r.hasdownloads = !!(flags2 & 0x04)
  
  d.skip(2)
  
  const playerCount = d.readByte()
  r.playerlist = new Array(playerCount)
  
  for (let i = 0; i < playerCount; i++) {
    r.playerlist[i] = {
      id: d.readByte(),
      name: d.readSString(),
      team: d.readByte(),
      score: d.readInt(),
      deaths: d.readInt()
    }
  }
  
  return r
}

module.exports = {
  serverlist,
  serverquery
}