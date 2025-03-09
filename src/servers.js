const dgram = require('node:dgram')
const IPData = require('ipdata').default
const ipdata = new IPData(process.env.IPDATA_APIKEY)
const fields = ['country_name', 'country_code', 'emoji_flag']
const server = dgram.createSocket('udp4')
const streams = require(__dirname + '/streams')
const common = require(__dirname + '/common.js')
const usgnIp = '81.169.236.243'
const usgnPort = 36963
const bufServerList = Buffer.from([1, 0, 20, 1])
// Bytes 246 and 3 as a SHORT (UInt16LE) represent version 1014
const bufServerQuery = Buffer.from([1, 0, 251, 1, 246, 3, 251, 5])
const servers = []
const stats = {
  bytes: { sent: 0, recv: 0 },
  packets: { sent: 0, recv: 0 }
}

function serverQuery(stream) {
  const res = {}
  let flags = stream.readByte()
  // Skip parsing if versions don't match
  if (Boolean(flags & 16) === false) return

  res.password = Boolean(flags & 1)
  res.usgnonly = Boolean(flags & 2)
  res.fow = Boolean(flags & 4)
  res.friendlyfire = Boolean(flags & 8)
  res.lua = Boolean(flags & 64)
  res.forcelight = Boolean(flags & 128)
  res.name = stream.readString(stream.readByte())
  res.map = stream.readString(stream.readByte())
  res.players = stream.readByte()
  res.maxplayers = stream.readByte()
  res.gamemode = (flags & 32) ? stream.readByte() : 0
  res.bots = stream.readByte()
  flags = stream.readByte()
  res.recoil = Boolean(flags & 1)
  res.offscreendamage = Boolean(flags & 2)
  res.hasdownloads = Boolean(flags & 4)
  res.playerlist = Array.from({ length: stream.readByte(2) }, () => ({
    id: stream.readByte(),
    name: stream.readString(stream.readByte()),
    team: stream.readByte(),
    score: stream.readInt(),
    deaths: stream.readInt()
  }))
  return res
}

function receivedServerlist(stream) {
  if (stream.readByte() !== 20) return
  const serverNum = stream.readShort()
  for (let i = 0; i < serverNum; i++) {
    const oct4 = stream.readByte()
    const oct3 = stream.readByte()
    const oct2 = stream.readByte()
    const oct1 = stream.readByte()
    const port = stream.readShort()
    const ip = [oct1, oct2, oct3, oct4].join('.')
    stats.bytes.sent += 8
    stats.packets.sent += 1
    server.send(bufServerQuery, port, ip)
  }
}

function receivedServerquery(stream, ip, port) {
  if (stream.readByte() !== 251 || stream.readByte() !== 1) return
  const data = serverQuery(stream)
  if (!data) return

  let i = servers.findIndex(obj => obj.ip === ip && obj.port === port)
  if (i === -1) {
    const geoip = { name: 'Unknown', code: 'ZZ', flag: '🏴' }
    const debug = {
      sent: 1, recv: 0,
      sentBytes: 8, recvBytes: 0,
      lastRequest: Date.now(), ping: 0
    }
    i = servers.push({ ip, port, geoip, debug }) - 1
    ipdata.lookup(ip, null, fields).then(function(data) {
      servers[i].geoip = {
        name: data.country_name || 'Unknown',
        code: data.country_code || 'ZZ',
        flag: data.emoji_flag || '🏴󠁧󠁤󠀰󠀵󠁿'
      }
    })
  }

  const serverData = servers[i]
  serverData.debug.recv += 1
  serverData.debug.recvBytes += stream.getSize()
  serverData.debug.ping = Date.now() - serverData.debug.lastRequest
  servers[i] = {
    ...serverData,
    ts: Math.floor(Date.now() / 1000),
    ...data
  }
}

function validateIPPortFormat(input) {
  const ipPortRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})$/
  return ipPortRegex.test(input)
}

server.on('message', (buf, rinfo) => {
  stats.bytes.recv += rinfo.size
  stats.packets.recv += 1
  const stream = new streams(buf)
  if (stream.readShort() !== 1) return
  if (rinfo.port == usgnPort && rinfo.address == usgnIp) {
    receivedServerlist(stream)
  } else {
    receivedServerquery(stream, rinfo.address, rinfo.port)
  }
})

server.on('listening', () => {
  const host = server.address().address
  const port = server.address().port
  console.log(`UDP Server listening on ${host}:${port}`)
  serverlistRequest()
  setTimeout(serverqueryRequest, 10000)
})

server.on('error', (err) => {
  console.error(`UDP Server error:\n${err.stack}`)
  server.close()
})

server.bind(process.env.UDP_PORT || 36963, process.env.UDP_HOST || '0.0.0.0')

function serverlistRequest() {
  stats.packets.sent += 1
  stats.bytes.sent += 4
  server.send(bufServerList, usgnPort, usgnIp)
  setTimeout(serverlistRequest, 60000)
}

function serverqueryRequest() {
  for (const e of servers) {
    stats.packets.sent += 1
    stats.bytes.sent += 8
    server.send(bufServerQuery, e.port, e.ip)
    e.debug.sent += 1
    e.debug.sentBytes += 8
    e.debug.lastRequest = Date.now()
  }
  setTimeout(serverqueryRequest, 10000)
}

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
    const result = this.getServers().servers
    return {
      uptime: common.secondsToUptime(process.uptime()),
      bytes: {
        recv: common.bytesToSize(stats.bytes.recv),
        sent: common.bytesToSize(stats.bytes.sent)
      },
      packets: {
        recv: stats.packets.recv,
        sent: stats.packets.sent
      },
      locations: common.sortedCountries(result),
      maps: common.mostPopularMaps(result),
      memory: common.getMemoryUsage()
    }
  }
}
