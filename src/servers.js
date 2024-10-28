const dgram = require('node:dgram')
const mmdbreader = require('maxmind-db-reader')
const countryFlagEmoji = require('country-flag-emoji')
const db = process.env.COUNTRYDB || '/usr/share/GeoIP/GeoLite2-Country.mmdb'
const countries = mmdbreader.openSync(db)
const server = dgram.createSocket('udp4')
const streams = require(__dirname + '/streams')
const usgnIp = process.env.USGNIP || '81.169.236.243'
const usgnPort = process.env.USGNPORT || 36963
let servers = []
let recvSize = 0
let sentSize = 0

function readFlag(flags, offset) {
  return !!(flags & (1 << offset))
}

function serverQuery(stream) {
  const res = {}
  let flags = stream.readByte()
  res.password = readFlag(flags, 0)
  res.usgnonly = readFlag(flags, 1)
  res.fow = readFlag(flags, 2)
  res.friendlyfire = readFlag(flags, 3)
  res.bots = readFlag(flags, 5)
  res.lua = readFlag(flags, 6)
  res.forcelight = readFlag(flags, 7)
  res.name = stream.readString(stream.readByte())
  res.map = stream.readString(stream.readByte())
  res.players = stream.readByte()
  res.maxplayers = stream.readByte()
  if (res.maxplayers == 0) return
  if (flags & 32) {
    res.gamemode = stream.readByte()
  } else {
    res.gamemode = 0
  }
  res.bots = stream.readByte()
  flags = stream.readByte()
  res.recoil = readFlag(flags, 0)
  res.offscreendamage = readFlag(flags, 1)
  res.hasdownloads = readFlag(flags, 2)
  res.playerlist = []
  const playerNum = stream.readByte(2)
  for (let i = 0; i < playerNum; i++) {
    res.playerlist.push({
      id: stream.readByte(),
      name: stream.readString(stream.readByte()),
      team: stream.readByte(),
      score: stream.readInt(),
      deaths: stream.readInt()
    })
  }
  return res
}

async function receivedServerlist(stream) {
  if (stream.readByte() != 20) {
    return
  }
  const serverNum = stream.readShort()
  for (let i = 0; i < serverNum; i++) {
    const oct4 = stream.readByte()
    const oct3 = stream.readByte()
    const oct2 = stream.readByte()
    const oct1 = stream.readByte()
    const port = stream.readShort()
    const ip = [oct1, oct2, oct3, oct4].join('.')
    const exists = servers.find(obj => obj.port === port && obj.ip === ip)
    if (exists) {
      continue
    }
    countries.getGeoData(ip, function(err, geodata) {
      const name = geodata?.country?.names?.en || 'Unknown'
      const code = geodata?.country?.iso_code || 'ZZ'
      const flag = countryFlagEmoji.get(code)?.emoji || '🏴󠁧󠁤󠀰󠀵󠁿'
      const geoip = { name, code, flag }
      const debug = {
        sent: 0, recv: 0,
        sentBytes: 0, recvBytes: 0,
        lastRequest: 0, ping: 0
      }
      servers.push({ ip, port, geoip, debug })
    })
  }
}

function receivedServerquery(stream, ip, port) {
  if (stream.readByte() != 251 || stream.readByte() != 1) {
    return
  }
  const data = serverQuery(stream)
  if (typeof data !== 'object') {
    return
  }
  const index = servers.findIndex(obj => obj.ip === ip && obj.port === port)
  if (index === -1) {
    return
  }
  servers[index].debug.recv += 1
  servers[index].debug.recvBytes += stream.getSize()
  servers[index].debug.ping = Date.now() - servers[index].debug.lastRequest
  servers[index] = {
    ...servers[index],
    ts: Math.floor(Date.now() / 1000),
    ...data
  }
}

function validateIPPortFormat(input) {
  const ipPortRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})$/
  return ipPortRegex.test(input)
}

server.on('message', (buf, rinfo) => {
  recvSize += rinfo.size
  const stream = new streams(buf)
  if (stream.readShort() != 1) {
    return
  }
  if (rinfo.port == usgnPort && rinfo.address == usgnIp) {
    receivedServerlist(stream)
  } else {
    receivedServerquery(stream, rinfo.address, rinfo.port)
  }
})

function serverlistRequest() {
  const ts = Math.floor(Date.now() / 1000)
  servers = servers.filter((e) => e.ts === undefined || (ts - e.ts) < 60)
  sentSize += 4
  server.send(Buffer.from([1, 0, 20, 1]), usgnPort, usgnIp)
  setTimeout(serverlistRequest, 60000)
}

function serverqueryRequest() {
  for (const e of servers) {
    sentSize += 8
    server.send(Buffer.from([1, 0, 251, 1, 245, 3, 251, 5]), e.port, e.ip)
    e.debug.sent += 1
    e.debug.sentBytes += 8
    e.debug.lastRequest = Date.now()
  }
  setTimeout(serverqueryRequest, 5000)
}

setTimeout(serverlistRequest, 1500)
setTimeout(serverqueryRequest, 3000)

module.exports = {
  getServers: function () {
    const t = Math.floor(Date.now() / 1000)
    const f = servers.filter((e) => e.ts !== undefined && t - e.ts < 60)
    const p = f.reduce((t, s) => t + (s.players - s.bots), 0)
    f.sort((a, b) => (((b.players-b.bots)*100)+b.bots) - (((a.players-a.bots)*100)+a.bots))
    return {
      servers: f,
      players: p
    }
  },
  getServer: function (addr) {
    if (!validateIPPortFormat(addr)) {
      return { error: 'Invalid address' }
    }
    const p = addr.split(':')
    const s = servers.find((o) => o.ip === p[0] && o.port === parseInt(p[1]))
    if (!s || s.ts === undefined) {
      return { error: 'Server does not exist' }
    }
    s.playerlist.sort((a, b) => b.score - a.score)
    return s
  },
  getStats: function () {
    return {
      recvSize: recvSize,
      sentSize: sentSize
    }
  }
}
