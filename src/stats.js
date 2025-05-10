const { getPlayersOnline } = require('./players_online')
const { bytesToSize } = require('./utils/utils')

const stats = {
  sentBytes: 0,
  recvBytes: 0,
  sentPackets: 0,
  recvPackets: 0
}

const countServerStats = (servers) => {
  if (!Array.isArray(servers)) {
    return {
      totalServers: 0,
      totalPlayers: 0,
      totalBots: 0
    }
  }

  let totalServers = 0
  let totalPlayers = 0
  let totalBots = 0

  for (const server of servers) {
    totalServers++
    const bots = server.bots || 0
    const players = Math.max((server.players || 0) - bots, 0)
    totalPlayers += players
    totalBots += bots
  }

  return {
    totalServers,
    totalPlayers,
    totalBots
  }
}

const countCountries = (servers) => Object.values(servers).reduce((acc, server) => {
  const country = server.dbg.country
  if (country) acc[country] = (acc[country] || 0) + 1
  return acc
}, {})

const countMaps = (servers) => Object.values(servers).reduce((acc, server) => {
  const map = server.map
  if (map) acc[map] = (acc[map] || 0) + 1
  return acc
}, {})

const gamemodeCounts = (servers) => Object.values(servers).reduce((acc, server) => {
  const gamemode = server.gamemode
  if (gamemode !== undefined) acc[gamemode] = (acc[gamemode] || 0) + 1
  return acc
}, {})

const secondsToUptime = (s) => {
  const secs = Math.round(s)
  const d = Math.floor(secs / (3600 * 24))
  const h = Math.floor((secs % (3600 * 24)) / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return `${d > 0 ? `${d}d, ` : ''}${h}:${m}:${ss}`
}

const countOrganizations = (servers) => {
  const orgMap = {}

  for (const server of servers) {
    const fullOrg = server.dbg?.org
    if (!fullOrg || !fullOrg.startsWith('AS')) continue

    const [asn, ...nameParts] = fullOrg.split(' ')
    const name = nameParts.join(' ')
    if (!asn || !name) continue

    if (!orgMap[asn]) {
      orgMap[asn] = { org: name, count: 0 }
    }

    orgMap[asn].count++
  }

  return Object.entries(orgMap)
    .map(([asn, data]) => ({ asn, org: data.org, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

const topLocations = (servers) => Object.entries(countCountries(servers))
  .map(([country, count]) => ({ country, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)

const topMaps = (servers) => Object.entries(countMaps(servers))
  .map(([map, count]) => ({ map, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)

const topGamemodes = (servers) => {
  return [0, 1, 2, 3, 4].map(gm => ({
    gm,
    count: (gamemodeCounts(servers)[gm] || 0)
  })).sort((a, b) => b.count - a.count)
  .slice(0, 5)
}

const responseRatio = (serverList) => {
  const serverRatios = serverList.map(server => {
    const name = server.name
    const addr = `${server.ip}:${server.port}`
    const { sentPackets, recvPackets } = server.dbg || {}
    const ratio = sentPackets && recvPackets
      ? Math.floor((recvPackets / sentPackets) * 100)
      : 0

    return { addr, data: { name, ratio } }
  })

  return serverRatios
    .sort((a, b) => b.data.ratio - a.data.ratio)
    .slice(0, 5)
}

const sortedLeaderboardsByTS = (leaderboards) => {
  return Object.entries(leaderboards)
    .sort(([, a], [, b]) => b.ts - a.ts)
    .map(([addr, data]) => ({ addr, ...data }))
    .slice(0, 5)
}

function getStats(servers, leaderboards) {
  return {
    ...getPlayersOnline(),
    ...countServerStats(servers),
    gamemodes: topGamemodes(servers),
    maps: topMaps(servers),
    organizations: countOrganizations(servers),
    locations: topLocations(servers),
    uptime: secondsToUptime(process.uptime()),
    sentPackets: stats.sentPackets,
    recvPackets: stats.recvPackets,
    sentBytes: bytesToSize(stats.sentBytes),
    recvBytes: bytesToSize(stats.recvBytes),
    responses: responseRatio(servers),
    leaderboards: sortedLeaderboardsByTS(leaderboards)
  }
}

function increaseStatsSentBytes(bytes) {
  stats.sentBytes += bytes
  stats.sentPackets++
}

function increaseStatsRecvBytes(bytes) {
  stats.recvBytes += bytes
  stats.recvPackets++
}

module.exports = {
  getStats,
  increaseStatsSentBytes,
  increaseStatsRecvBytes
}
