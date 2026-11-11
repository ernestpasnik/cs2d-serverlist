const dgram = require('node:dgram')
const config = require('../config')
const { child } = require('../logger')
const { LIST_REQUEST, QUERY_REQUEST, parseServerList, parseServerQuery } = require('../protocol/packets')
const { loop } = require('../utils/loop')
const { runPool } = require('../utils/pool')
const { unix } = require('../utils/format')
const geo = require('./geo')

const log = child('scanner')
const GEO_RETRY_MS = 600000

const failed = (task) => (err) => log.error({ err, task }, 'task failed')
const toPublic = ({ dbg, addedAt, ...server }) => server
const activity = (s) => (s.players - s.bots) * 100 + s.bots

class Scanner {
  servers = new Map()
  pending = new Map()
  geo = new Map()
  traffic = { sentBytes: 0, recvBytes: 0, sentPackets: 0, recvPackets: 0 }
  socket = null
  loops = []
  closed = false

  start() {
    this.socket = dgram.createSocket('udp4')
    this.socket.on('message', (buffer, rinfo) => this.#receive(buffer, rinfo))
    this.socket.on('error', (err) => log.error({ err }, 'udp socket error'))

    this.loops = [
      loop(() => this.#send(LIST_REQUEST, config.master.port, config.master.host), config.scanner.listIntervalMs, failed('list')),
      loop(() => this.#scan(), config.scanner.intervalMs, failed('scan')),
      loop(() => this.#cleanup(), 60000, failed('cleanup'), { immediate: false })
    ]
    log.info({ concurrency: config.scanner.concurrency, intervalMs: config.scanner.intervalMs }, 'scanner started')
  }

  async stop() {
    this.closed = true
    for (const waiter of this.pending.values()) {
      clearTimeout(waiter.timer)
      waiter.resolve()
    }
    this.pending.clear()
    await Promise.all(this.loops.map((l) => l.stop()))
    this.socket?.close()
    log.info('scanner stopped')
  }

  getServer(addr, full = false) {
    const server = this.servers.get(addr)
    if (!server?.ts) return false
    return full ? server : toPublic(server)
  }

  getRecentServers() {
    return [...this.servers.values()].filter((s) => s.ts).sort((a, b) => activity(b) - activity(a))
  }

  listPublic() {
    return this.getRecentServers().map(toPublic)
  }

  #send(buffer, port, host) {
    if (this.closed) return
    this.traffic.sentPackets++
    this.traffic.sentBytes += buffer.length
    this.socket.send(buffer, port, host, (err) => {
      if (err) log.debug({ host, port, error: err.message }, 'udp send failed')
    })
  }

  async #scan() {
    const addrs = [...this.servers.keys()]
    if (!addrs.length) return
    const started = performance.now()
    await runPool(addrs, config.scanner.concurrency, (addr) => this.#query(addr), failed('query'))
    log.debug({ servers: addrs.length, ms: Math.round(performance.now() - started) }, 'scan cycle complete')
  }

  #query(addr) {
    const server = this.servers.get(addr)
    if (!server || this.closed) return Promise.resolve()

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(addr)
        resolve()
      }, config.scanner.timeoutMs)
      this.pending.set(addr, { resolve, timer, sentAt: performance.now() })
      server.dbg.sentPackets++
      server.dbg.sentBytes += QUERY_REQUEST.length
      this.#send(QUERY_REQUEST, server.port, server.ip)
    })
  }

  #receive(buffer, rinfo) {
    this.traffic.recvPackets++
    this.traffic.recvBytes += buffer.length

    if (rinfo.address === config.master.host && rinfo.port === config.master.port) {
      this.#registerList(buffer)
      return
    }

    const addr = `${rinfo.address}:${rinfo.port}`
    const server = this.servers.get(addr)
    if (!server) return

    const data = parseServerQuery(buffer)
    if (!data) return

    Object.assign(server, data, { ts: unix() })
    server.dbg.recvPackets++
    server.dbg.recvBytes += buffer.length

    const waiter = this.pending.get(addr)
    if (waiter) {
      clearTimeout(waiter.timer)
      this.pending.delete(addr)
      server.dbg.latency = Math.round(performance.now() - waiter.sentAt)
      waiter.resolve()
    }

    this.#applyGeo(server)
  }

  #registerList(buffer) {
    const list = parseServerList(buffer)
    if (!list) return

    let added = 0
    for (const addr of list) {
      if (this.servers.has(addr)) continue
      if (this.servers.size >= config.scanner.maxServers) {
        log.warn({ max: config.scanner.maxServers }, 'server limit reached')
        break
      }
      const split = addr.lastIndexOf(':')
      this.servers.set(addr, {
        ip: addr.slice(0, split),
        port: Number(addr.slice(split + 1)),
        ts: 0,
        addedAt: unix(),
        dbg: { sentPackets: 0, recvPackets: 0, sentBytes: 0, recvBytes: 0, latency: null, country: null, city: null, org: null }
      })
      added++
    }
    log.info({ received: list.length, added, tracked: this.servers.size }, 'server list updated')
  }

  #applyGeo(server) {
    const state = this.geo.get(server.ip)

    if (state?.value) {
      if (server.dbg.org !== state.value.org || server.dbg.country !== state.value.country) {
        Object.assign(server.dbg, state.value)
      }
      return
    }
    if (state && (state.busy || state.retryAt > Date.now())) return

    const entry = state ?? { value: null, busy: false, retryAt: 0 }
    this.geo.set(server.ip, entry)
    entry.busy = true

    geo.lookup(server.ip)
      .then((value) => {
        if (value) entry.value = value
        else entry.retryAt = Date.now() + GEO_RETRY_MS
      })
      .catch((err) => {
        entry.retryAt = Date.now() + GEO_RETRY_MS
        log.warn({ ip: server.ip, error: err.message }, 'geo lookup failed')
      })
      .finally(() => {
        entry.busy = false
      })
  }

  #cleanup() {
    const limit = unix() - config.scanner.staleAfterSec
    let removed = 0
    for (const [addr, server] of this.servers) {
      if ((server.ts || server.addedAt) < limit) {
        this.servers.delete(addr)
        removed++
      }
    }
    if (!removed) return

    const live = new Set(Array.from(this.servers.values(), (s) => s.ip))
    for (const ip of this.geo.keys()) if (!live.has(ip)) this.geo.delete(ip)
    log.info({ removed, tracked: this.servers.size }, 'stale servers removed')
  }
}

module.exports = new Scanner()
