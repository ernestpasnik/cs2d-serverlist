const dgram = require('dgram')
const IPData = require('ipdata').default
const ipdata = new IPData(process.env.IPDATA_APIKEY)
const fields = ['country_name', 'country_code', 'emoji_flag']
const received = require('./received.js')
const common = require('./common.js')
const servers = {}
const stats = {
  sentPackets: 0,
  recvPackets: 0,
  sentBytes: 0,
  recvBytes: 0
}
const req = {
  serverlist: Buffer.from([1, 0, 20, 1]),
  serverquery: Buffer.from([1, 0, 251, 1, 246, 3, 251, 5])
}

async function addServer(ipPort) {
  const [ip, port] = ipPort.split(':')
  servers[ipPort] = {
    ip,
    port: parseInt(port),
    geoip: {
      name: 'Unknown',
      code: 'ZZ',
      flag: '🏴'
    },
    debug: {
      addedAt: Math.floor(Date.now() / 1000),
      sentPackets: 0,
      recvPackets: 0,
      sentBytes: 0,
      recvBytes: 0
    }
  }

  ipdata.lookup(ip, null, fields).then(function(d) {
    servers[ipPort].geoip = {
      name: d.country_name || 'Unknown',
      code: d.country_code || 'ZZ',
      flag: d.emoji_flag || '🏴󠁧󠁤󠀰󠀵󠁿'
    }
  })

  const client = dgram.createSocket('udp4')

  client.on('message', (buf) => {
    const recv = received.serverquery(buf)
    if (recv == null) {
      return
    }
    servers[ipPort].ts = Math.floor(Date.now() / 1000)
    servers[ipPort].debug.recvPackets += 1
    servers[ipPort].debug.recvBytes += buf.length
    servers[ipPort] = { ...servers[ipPort], ...received.serverquery(buf) }
    stats.recvPackets += 1
    stats.recvBytes += 8
  })

  client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
  servers[ipPort].debug.sentPackets += 1
  servers[ipPort].debug.sentBytes += 8
  stats.sentPackets += 1
  stats.sentBytes += 8

  setInterval(() => {
    client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
    servers[ipPort].debug.sentPackets += 1
    servers[ipPort].debug.sentBytes += 8
    stats.sentPackets += 1
    stats.sentBytes += 8
  }, 10000)
}

async function initialize() {
  const usgn = dgram.createSocket('udp4')

  usgn.on('message', (buf, rinfo) => {
    received.serverlist(buf).forEach(ipPort => {
      if (!servers[ipPort]) {
        addServer(ipPort)
      }
    })
  })

  usgn.send(req.serverlist, 36963, '81.169.236.243')

  setInterval(() => {
    usgn.send(req.serverlist, 36963, '81.169.236.243')
  }, 60000)
}

function getServer(ipPort) {
  return servers[ipPort] || false
}

function getServers() {
  return servers
}

function getRecentServers() {
  const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60
  let recentServers = []
  let totalServers = 0
  let totalPlayers = 0

  for (const ipPort in servers) {
    if (servers[ipPort].ts && servers[ipPort].ts >= oneMinuteAgo) {
      recentServers.push(servers[ipPort])
      totalServers++
      totalPlayers += (servers[ipPort].players - servers[ipPort].bots)
    }
  }

  recentServers.sort((a, b) => {
    const aScore = (a.players - a.bots) * 100 + a.bots
    const bScore = (b.players - b.bots) * 100 + b.bots
    return bScore - aScore
  })
  
  const sortedServers = Object.fromEntries(
    recentServers.map(server => [`${server.ip}:${server.port}`, server])
  )  

  return {
    servers: sortedServers,
    serversNum: totalServers,
    playersNum: totalPlayers
  }
}

function getStats(result) {
  return {
    uptime: common.secondsToUptime(process.uptime()),
    sentPackets: stats.sentPackets,
    recvPackets: stats.recvPackets,
    sentBytes: common.bytesToSize(stats.sentBytes),
    recvBytes: common.bytesToSize(stats.recvBytes),
    locations: common.sortedCountries(result),
    gamemodes: common.mostPopularGamemode(result),
    highestResponseRatio: common.highestResponseRatio(result),
    maps: common.mostPopularMaps(result),
    mem: common.getMemoryUsage()
  }
}

module.exports = {
  initialize,
  getServer,
  getServers,
  getRecentServers,
  getStats
}
