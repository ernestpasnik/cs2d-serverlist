const { child } = require('../logger')
const config = require('../config')
const { loop } = require('../utils/loop')

const log = child('online')

const SOURCES = {
  steam: {
    url: 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=666220',
    parse: async (res) => (await res.json())?.response?.player_count ?? null
  },
  unrealSoftware: {
    url: `http://${config.master.host}/users.php?p=1`,
    parse: async (res) => {
      const match = (await res.text()).match(/(\d+)\s+Users?/i)
      return match ? Number.parseInt(match[1], 10) : null
    }
  }
}

class OnlineCounter {
  counts = { steam: null, unrealSoftware: null }
  task = null

  start() {
    this.task = loop(() => this.#poll(), 300000, (err) => log.error({ err }, 'poll failed'))
  }

  stop() {
    return this.task?.stop()
  }

  raw() {
    return { ...this.counts }
  }

  get() {
    return { steam: this.counts.steam ?? 'N/A', unrealSoftware: this.counts.unrealSoftware ?? 'N/A' }
  }

  async #poll() {
    await Promise.all(Object.keys(SOURCES).map((name) => this.#fetch(name)))
  }

  async #fetch(name) {
    const source = SOURCES[name]
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const value = await source.parse(res)
      if (value !== null) this.counts[name] = value
    } catch (err) {
      log.warn({ source: name, error: err.message }, 'player count fetch failed')
    }
  }
}

module.exports = new OnlineCounter()
