const dgram = require('dgram')
const IPData = require('ipdata').default
const received = require('./received.js')
const common = require('./common.js')
const ipdata = new IPData(process.env.IPDATA_APIKEY)
const servers = {}
const stats = { sentPackets: 0, recvPackets: 0, sentBytes: 0, recvBytes: 0 }
const req = {
  serverlist: Buffer.from([1, 0, 20, 1]),
  serverquery: Buffer.from([1, 0, 251, 1, 248, 3, 251, 5])
}

async function addServer(ipPort) {
  const [ip, port] = ipPort.split(':')
  servers[ipPort] = {
    ip,
    port: parseInt(port),
    geoip: { code: 'ZZ', name: 'Unknown' },
    debug: {
      addedAt: Math.floor(Date.now() / 1000),
      sentPackets: 0,
      recvPackets: 0,
      sentBytes: 0,
      recvBytes: 0
    }
  }

  ipdata.lookup(ip, null, ['country_name', 'country_code']).then(d => {
    if (!servers[ipPort]) return
    servers[ipPort].geoip = {
      code: d.country_code || 'ZZ',
      name: d.country_name || 'Unknown'
    }
  })

  const client = dgram.createSocket('udp4')

  client.on('message', (buf, rinfo) => {
    stats.recvPackets++
    stats.recvBytes += rinfo.size

    const recv = received.serverquery(buf, rinfo.size)
    if (recv == null) return
    servers[ipPort].ts = Math.floor(Date.now() / 1000)
    servers[ipPort].debug.recvPackets++
    servers[ipPort].debug.recvBytes += rinfo.size
    servers[ipPort] = { ...servers[ipPort], ...recv }
  })

  client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
  servers[ipPort].debug.sentPackets++
  servers[ipPort].debug.sentBytes += 8
  stats.sentPackets++
  stats.sentBytes += 8

  const interval = setInterval(() => {
    client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
    servers[ipPort].debug.sentPackets++
    servers[ipPort].debug.sentBytes += 8
    stats.sentPackets++
    stats.sentBytes += 8
  }, 10000)

  servers[ipPort].client = client
  servers[ipPort].interval = interval
}

async function initialize() {
  const usgn = dgram.createSocket('udp4')

  usgn.on('message', (buf, rinfo) => {
    stats.recvPackets++
    stats.recvBytes += rinfo.size
    received.serverlist(buf, rinfo.size).forEach(ipPort => {
      if (!servers[ipPort]) {
        addServer(ipPort)
      }
    })
  })

  stats.sentPackets++
  stats.sentBytes += 4
  usgn.send(req.serverlist, 36963, '81.169.236.243')

  // Request CS2D server list every 15 minutes  
  setInterval(() => {
    stats.sentPackets++
    stats.sentBytes += 4
    usgn.send(req.serverlist, 36963, '81.169.236.243')
  }, 900000)

  // Remove servers with no response or inactive for over a minute
  setInterval(cleanupServers, 60000)
}

function getServer(ipPort) {
  if (!servers[ipPort]) return false
  const { debug, client, interval, playerlist, ...filteredServer } = servers[ipPort]

  if (playerlist) {
    playerlist.sort((playerA, playerB) => playerB.score - playerA.score)
  }

  return {
    ...filteredServer,
    playerlist
  }
}

function getRecentServers() {
  const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60
  let recentServers = []
  let totalServers = 0
  let totalPlayers = 0

  for (const ipPort in servers) {
    if (servers[ipPort].ts && servers[ipPort].ts >= oneMinuteAgo) {
      const { client, interval, ...filteredServer } = servers[ipPort]
      recentServers.push(filteredServer)
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

function cleanupServers() {
  const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60
  for (const ipPort in servers) {
    if (!servers[ipPort].ts || servers[ipPort].ts < oneMinuteAgo) {
      if (servers[ipPort].client) {
        servers[ipPort].client.close()
        clearInterval(servers[ipPort].interval)
      }
      delete servers[ipPort]
    }
  }
}

function getStats(result) {
  return {
    uptime: common.secondsToUptime(process.uptime()),
    sentPackets: stats.sentPackets,
    recvPackets: stats.recvPackets,
    sentBytes: common.bytesToSize(stats.sentBytes),
    recvBytes: common.bytesToSize(stats.recvBytes),
    locations: common.topLocations(result),
    gamemodes: common.topGamemodes(result),
    maps: common.topMaps(result),
    responses: common.responseRatio(result)
  }
}

module.exports = {
  initialize,
  getServer,
  getRecentServers,
  getStats
}
