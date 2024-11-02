const countCountries = (servers) => {
  return servers.reduce((acc, server) => {
    const countryName = server.geoip?.name
    if (countryName) {
      acc[countryName] = (acc[countryName] || 0) + 1
    }
    return acc
  }, {})
}

const countMaps = (servers) => {
  return servers.reduce((acc, server) => {
    const mapName = server.map
    if (mapName) {
      acc[mapName] = (acc[mapName] || 0) + 1
    }
    return acc
  }, {})
}

const getMemoryUsage = () => {
  const memoryUsage = process.memoryUsage()
  return {
    rss: bytesToSize(memoryUsage.rss)
  }
}

const bytesToSize = (b) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) return '0 B'
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return `${Math.round(b / Math.pow(1024, i))} ${sizes[i]}`
}

const secondsToUptime = (s) => {
  const secs = Math.round(s)
  const days = Math.floor(secs / (3600 * 24))
  const hours = Math.floor((secs % (3600 * 24)) / 3600)
  const minutes = Math.floor((secs % 3600) / 60)
  const seconds = secs % 60
  const d = days > 0 ? `${days} day${days !== 1 ? 's' : ''}, ` : ''
  const hh = hours.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  const ss = seconds.toString().padStart(2, '0')
  return `${d}${hh}:${mm}:${ss}`
}

const sortedCountries = (servers) => {
  const countryCount = countCountries(servers)
  return Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
}

const mostPopularMaps = (servers) => {
  const mapCount = countMaps(servers)
  return Object.entries(mapCount)
    .map(([map, count]) => ({ map, count }))
    .sort((a, b) => b.count - a.count)
}

module.exports = {
  bytesToSize,
  secondsToUptime,
  sortedCountries,
  mostPopularMaps,
  getMemoryUsage
}
