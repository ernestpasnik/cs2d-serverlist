const dgram = require('node:dgram')
const { IPinfoWrapper } = require('node-ipinfo')
const received = require('./received')
const stats = require('./stats')
const { getUnixTimestamp } = require('./utils')
const ipinfoWrapper = new IPinfoWrapper(process.env.IPINFO_APIKEY)
const servers = {}
const req = {
  serverlist: Buffer.from([1, 0, 20, 1]),
  serverquery: Buffer.from([1, 0, 251, 1, 248, 3, 251, 5])
}

async function addServer(ipPort) {
  const [ip, port] = ipPort.split(':')
  servers[ipPort] = {
    ip,
    port: parseInt(port),
    dbg: {
      sentPackets: 0,
      recvPackets: 0,
      sentBytes: 0,
      recvBytes: 0
    }
  }
  ipinfoWrapper.lookupIp(ip).then((ipInfo) => {
    if (servers[ipPort] && servers[ipPort].dbg) {
      servers[ipPort].dbg = {
        ...servers[ipPort].dbg,
        country_name: ipInfo.country,
        city: ipInfo.city,
        emoji_flag: ipInfo.countryFlag?.emoji,
        org: ipInfo.org,
        hostname: ipInfo.hostname
      }      
    }
  })
  

  const client = dgram.createSocket('udp4')
  client.on('message', (buf, rinfo) => {
    stats.increaseStatsRecvBytes(rinfo.size)
    const recv = received.serverquery(buf, rinfo.size)
    if (recv == null) return
    servers[ipPort].ts = getUnixTimestamp()
    servers[ipPort].dbg.recvPackets++
    servers[ipPort].dbg.recvBytes += rinfo.size
    servers[ipPort] = { ...servers[ipPort], ...recv }
  })

  client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
  servers[ipPort].dbg.sentPackets++
  servers[ipPort].dbg.sentBytes += 8
  stats.increaseStatsSentBytes(8)

  const interval = setInterval(() => {
    client.send(req.serverquery, servers[ipPort].port, servers[ipPort].ip)
    servers[ipPort].dbg.sentPackets++
    servers[ipPort].dbg.sentBytes += 8
    stats.increaseStatsSentBytes(8)
  }, 10000)

  servers[ipPort].client = client
  servers[ipPort].interval = interval
}

async function initialize() {
  const usgn = dgram.createSocket('udp4')

  usgn.on('message', (buf, rinfo) => {
    stats.increaseStatsRecvBytes(rinfo.size)
    received.serverlist(buf, rinfo.size).forEach(ipPort => {
      if (!servers[ipPort]) {
        addServer(ipPort)
      }
    })
  })

  stats.increaseStatsSentBytes(4)
  usgn.send(req.serverlist, 36963, '81.169.236.243')

  // Request CS2D server list every 5 minutes  
  setInterval(() => {
    stats.increaseStatsSentBytes(4)
    usgn.send(req.serverlist, 36963, '81.169.236.243')
  }, 300000)

  // Remove servers with no response or inactive for over a minute
  setInterval(cleanupServers, 60000)
}

function getServer(ipPort, full = false) {
  if (!servers[ipPort]) return false
  if (!servers[ipPort].ts) return false
  servers[ipPort].playerlist.sort((playerA, playerB) => playerB.score - playerA.score)
  if (full) return servers[ipPort]

  const { dbg, client, interval, playerlist, ...filteredServer } = servers[ipPort]
  return {
    ...filteredServer,
    playerlist
  }
}

function getRecentServers() {
  const oneMinuteAgo = getUnixTimestamp() - 60
  return Object.values(servers)
    .filter(s => s.ts && s.ts >= oneMinuteAgo)
    .map(({ client, interval, ...s }) => s)
    .sort((a, b) => {
      const aScore = (a.players - a.bots) * 100 + a.bots
      const bScore = (b.players - b.bots) * 100 + b.bots
      return bScore - aScore
    })
}

function cleanupServers() {
  const oneMinuteAgo = getUnixTimestamp() - 60
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

module.exports = {
  initialize,
  getServer,
  getRecentServers
}
