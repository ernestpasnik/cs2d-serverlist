const config = require('../config')
const ipinfo = require('../repositories/ipinfo')

const TTL_MS = 7 * 24 * 3600 * 1000

async function lookup(ip) {
  const cached = ipinfo.find(ip)
  if (cached) return cached
  if (!config.ipinfoKey) return null

  const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, {
    headers: { accept: 'application/json', authorization: `Bearer ${config.ipinfoKey}` },
    signal: AbortSignal.timeout(5000)
  })
  if (!res.ok) throw new Error(`ipinfo responded with ${res.status}`)

  const data = await res.json()
  const value = { country: data.country ?? null, city: data.city ?? null, org: data.org ?? null }
  ipinfo.save(ip, value, TTL_MS)
  return value
}

module.exports = { lookup }
