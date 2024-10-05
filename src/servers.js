const dgram = require('node:dgram')
const mmdbreader = require('maxmind-db-reader')
const countryFlagEmoji = require('country-flag-emoji')
const db = process.env.COUNTRYDB || '/usr/share/GeoIP/GeoLite2-Country.mmdb'
const countries = mmdbreader.openSync(db)
const server = dgram.createSocket('udp4')
const streams = require(__dirname + '/streams')
const usgnAddress = process.env.USGNIP || '81.169.236.243'
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
    const ip = `${oct1}.${oct2}.${oct3}.${oct4}`
    const exists = servers.find(obj => obj.ip === ip && obj.port === port)
    if (exists) {
      continue
    }
    countries.getGeoData(ip, function(err, geodata) {
      let country = 'xx'
      let countryFlag = '🏴‍☠️'
      if (geodata) {
        country = geodata.country.iso_code
        countryFlag = countryFlagEmoji.get(country).emoji
      }
      servers.push({ ip, port, country, countryFlag })
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
  servers[index] = {
    ...servers[index],
    ...data,
    ts: Math.floor(Date.now() / 1000)
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
  if (rinfo.port == usgnPort && rinfo.address == usgnAddress) {
    receivedServerlist(stream)
  } else {
    receivedServerquery(stream, rinfo.address, rinfo.port)
  }
})

// Sending serverlist request every 60 seconds
function serverlistRequest() {
  const ts = Math.floor(Date.now() / 1000)
  servers = servers.filter((e) => e.ts === undefined || (ts - e.ts) < 60)
  sentSize += 4
  server.send(Buffer.from([1, 0, 20, 1]), usgnPort, usgnAddress)
  setTimeout(serverlistRequest, 60000)
}

// Sending serverquery requests every 10 seconds
function serverqueryRequest() {
  for (const e of servers) {
    sentSize += 8
    server.send(Buffer.from([1, 0, 251, 1, 245, 3, 251, 5]), e.port, e.ip)
  }
  setTimeout(serverqueryRequest, 10000)
}

serverlistRequest()
setTimeout(serverqueryRequest, 500)

module.exports = {
  getServers: function () {
    const t = Math.floor(Date.now() / 1000)
    const f = servers.filter((e) => e.ts !== undefined && t - e.ts < 60)
    const p = f.reduce((t, s) => t + (s.players - s.bots), 0)
    f.sort((a, b) => b.players - b.bots - (a.players - a.bots))
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
