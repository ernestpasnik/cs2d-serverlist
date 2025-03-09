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
const stats = { bytes: { sent: 0, recv: 0 }, packets: { sent: 0, recv: 0 } }

function serverQuery(d) {
  const r = {}
  let flags = d.readByte()

  // Skip parsing if versions don't match
  if (Boolean(flags & 16) == false) return

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

async function receivedServerlist(buf) {
  const d = new streams(buf)
  if (d.readShort() != 1 || d.readByte() != 20) {
    console.error(`Invalid server list header received from USGN`)
  }

  const serverNum = d.readShort()
  for (let i = 0; i < serverNum; i++) {
    const oct4 = d.readByte()
    const oct3 = d.readByte()
    const oct2 = d.readByte()
    const oct1 = d.readByte()
    const port = d.readShort()
    const ip = [oct1, oct2, oct3, oct4].join('.')
    let i = servers.findIndex(obj => obj.port === port && obj.ip === ip)
    if (i > -1) {
      continue
    }

    // Send 3 requests to each server, 1 second apart
    let queryCount = 1
    const interval = setInterval(() => {
      stats.packets.sent += 1
      stats.bytes.sent += 8
      server.send(bufServerQuery, port, ip)
      queryCount += 1
      if (queryCount > 3) {
        clearInterval(interval)
      }
    }, 1000)

  }
}

async function receivedServerquery(buf, ip, port) {
  const d = new streams(buf)
  if (d.readShort() != 1 || d.readByte() != 251 || d.readByte() != 1) {
    console.error(`Invalid server query header received from ${ip}:${port}`)
  }
  const data = serverQuery(d)
  if (!data) return

  let i = servers.findIndex(obj => obj.ip === ip && obj.port === port)
  if (i === -1) {
    const geoip = { name: 'Unknown', code: 'ZZ', flag: '🏴' }
    i = servers.push({ ip, port, geoip }) - 1
    ipdata.lookup(ip, null, fields).then(function(d) {
      servers[i].geoip = {
        name: d.country_name || 'Unknown',
        code: d.country_code || 'ZZ',
        flag: d.emoji_flag || '🏴󠁧󠁤󠀰󠀵󠁿'
      }
    })
  }

  const serverData = servers[i]
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
  if (rinfo.port == usgnPort && rinfo.address == usgnIp) {
    receivedServerlist(buf)
  } else {
    receivedServerquery(buf, rinfo.address, rinfo.port)
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

async function serverlistRequest() {
  stats.packets.sent += 1
  stats.bytes.sent += 4
  server.send(bufServerList, usgnPort, usgnIp)
  setTimeout(serverlistRequest, 60000)
}

async function serverqueryRequest() {
  for (const e of servers) {
    stats.packets.sent += 1
    stats.bytes.sent += 8
    server.send(bufServerQuery, e.port, e.ip)
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
