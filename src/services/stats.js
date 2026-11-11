const { bytesToSize, formatUptime } = require('../utils/format')

const bump = (map, key, players) => {
  if (key === undefined || key === null || key === '') return
  const entry = map.get(key)
  if (entry) {
    entry.servers++
    entry.players += players
  } else {
    map.set(key, { servers: 1, players })
  }
}

function tally(servers) {
  const t = { servers: 0, players: 0, bots: 0, maps: new Map(), countries: new Map(), gamemodes: new Map(), orgs: new Map() }

  for (const server of servers) {
    const bots = server.bots || 0
    const humans = Math.max((server.players || 0) - bots, 0)
    t.servers++
    t.players += humans
    t.bots += bots
    bump(t.maps, server.map, humans)
    bump(t.countries, server.dbg?.country, humans)
    bump(t.gamemodes, server.gamemode, humans)

    const org = server.dbg?.org
    if (!org?.startsWith('AS')) continue
    const split = org.indexOf(' ')
    if (split < 0 || split === org.length - 1) continue
    const asn = org.slice(0, split)
    const entry = t.orgs.get(asn)
    if (entry) entry.count++
    else t.orgs.set(asn, { org: org.slice(split + 1), count: 1 })
  }

  return t
}

const top = (map, limit = 5) => [...map]
  .map(([key, value]) => ({ key, count: value.servers }))
  .sort((a, b) => b.count - a.count)
  .slice(0, limit)

function responseRatio(servers) {
  return servers
    .map((server) => {
      const { sentPackets, recvPackets } = server.dbg
      const ratio = sentPackets && recvPackets ? Math.floor((recvPackets / sentPackets) * 100) : 0
      return { addr: `${server.ip}:${server.port}`, data: { name: server.name, ratio } }
    })
    .sort((a, b) => b.data.ratio - a.data.ratio)
    .slice(0, 5)
}

function getStats({ servers, traffic, online, leaderboards }) {
  const t = tally(servers)
  return {
    ...online,
    totalServers: t.servers,
    totalPlayers: t.players,
    totalBots: t.bots,
    gamemodes: [0, 1, 2, 3, 4]
      .map((gm) => ({ gm, count: t.gamemodes.get(gm)?.servers ?? 0 }))
      .sort((a, b) => b.count - a.count),
    maps: top(t.maps).map(({ key, count }) => ({ map: key, count })),
    organizations: [...t.orgs]
      .map(([asn, value]) => ({ asn, org: value.org, count: value.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    locations: top(t.countries).map(({ key, count }) => ({ country: key, count })),
    uptime: formatUptime(process.uptime()),
    sentPackets: traffic.sentPackets,
    recvPackets: traffic.recvPackets,
    sentBytes: bytesToSize(traffic.sentBytes),
    recvBytes: bytesToSize(traffic.recvBytes),
    responses: responseRatio(servers),
    leaderboards
  }
}

module.exports = { tally, getStats }
