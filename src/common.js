const countCountries = (servers) => Object.values(servers).reduce((acc, server) => {
  const country = server.geoip?.name
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

const getMemoryUsage = () => bytesToSize(process.memoryUsage().rss)

const bytesToSize = (b) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) return '0 B'
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return `${Math.round(b / Math.pow(1024, i))} ${sizes[i]}`
}

const secondsToUptime = (s) => {
  const secs = Math.round(s)
  const d = Math.floor(secs / (3600 * 24))
  const h = Math.floor((secs % (3600 * 24)) / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return `${d > 0 ? `${d}d, ` : ''}${h}:${m}:${ss}`
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

const responseRatio = (servers) => {
  const serverRatios = Object.values(servers).map(server => {
    const name = server.name
    const { sentPackets, recvPackets } = server.debug || {}
    const ratio = sentPackets && recvPackets ? Math.floor((recvPackets / sentPackets) * 100) : 0
    return { name, ratio }
  })
  return serverRatios.sort((a, b) => b.ratio - a.ratio)
    .map(({ name, ratio }) => ({ name, ratio: `${ratio}%` }))
    .slice(0, 5)
}

module.exports = {
  topLocations,
  topGamemodes,
  topMaps,
  bytesToSize,
  secondsToUptime,
  getMemoryUsage,
  responseRatio
}
