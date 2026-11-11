const crypto = require('node:crypto')
const config = require('../config')
const { child } = require('../logger')
const { loop } = require('../utils/loop')
const { runPool } = require('../utils/pool')
const scanner = require('./scanner')
const store = require('../repositories/webhooks')
const maps = require('../repositories/maps')

const log = child('webhooks')
const MAX_SERVERS = 10
const URL_PATTERN = /^https:\/\/discord\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,100}$/
const GONE_CODES = new Set([10008, 10015])

const label = (url) => crypto.createHash('sha256').update(url).digest('hex').slice(0, 8)

function buildEmbeds(addrs) {
  const embeds = []
  for (const addr of addrs) {
    const server = scanner.getServer(addr)
    if (!server) continue

    const players = `${server.players || 0}/${server.maxplayers || 0}` +
      (server.bots ? ` (${server.bots} bot${server.bots !== 1 ? 's' : ''})` : '')

    const embed = {
      title: server.name || 'Unknown Server',
      url: `${config.baseUrl}/details/${addr}`,
      color: 0x3498db,
      fields: [
        { name: 'Players', value: players, inline: true },
        { name: 'Map', value: server.map || 'Unknown', inline: true }
      ],
      timestamp: new Date(server.ts * 1000).toISOString()
    }
    if (maps.has(server.map)) embed.thumbnail = { url: `${config.baseUrl}/cs2d/minimaps/${server.map}.webp` }
    embeds.push(embed)
  }
  return embeds
}

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json }
}

async function register(url, servers) {
  const embeds = buildEmbeds(servers)
  if (!embeds.length) return { err: 'Selected servers are not online.' }

  const res = await call('POST', `${url}?wait=true`, { embeds })
  if (!res.json?.id) return { err: res.json?.message || 'Invalid response.' }

  store.save(url, res.json.id, servers)
  log.info({ webhook: label(url), servers: servers.length }, 'webhook registered')
  return { msg: 'Webhook added successfully.' }
}

async function refresh(hook) {
  const embeds = buildEmbeds(hook.servers)
  const body = embeds.length
    ? { content: '', embeds }
    : { content: 'Tracked servers are currently offline.', embeds: [] }

  const res = await call('PATCH', `${hook.url}/messages/${hook.messageId}`, body)
  if (res.ok) return

  if (res.status === 404 || GONE_CODES.has(res.json?.code)) {
    store.remove(hook.url)
    log.info({ webhook: label(hook.url) }, 'webhook removed')
    return
  }
  log.warn({ webhook: label(hook.url), status: res.status }, 'webhook update rejected')
}

async function refreshAll() {
  const hooks = store.all()
  if (!hooks.length) return
  await runPool(hooks, 5, refresh, (err, hook) => log.warn({ webhook: label(hook.url), error: err.message }, 'webhook update failed'))
}

let task = null

module.exports = {
  MAX_SERVERS,
  URL_PATTERN,
  register,
  start: () => {
    task = loop(refreshAll, 10000, (err) => log.error({ err }, 'webhook refresh failed'))
  },
  stop: () => task?.stop()
}
