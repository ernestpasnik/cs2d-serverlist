const scanner = require('../services/scanner')
const online = require('../services/online')
const stats = require('../services/stats')
const webhooks = require('../services/webhooks')
const leaderboards = require('../repositories/leaderboards')
const maps = require('../repositories/maps')
const { ADDRESS, MAP_NAME } = require('../utils/patterns')
const { formatTime, timeAgo, bytesToSize, getEmojiByCountry } = require('../utils/format')
const { notFound } = require('./helpers')

module.exports = async function pages(app) {
  app.get('/', (req, reply) => reply.view('servers', {
    title: null,
    description: 'Browse the most active CS2D servers with real-time stats including current map, player count, bots, and region. Access live data with our open JSON API.',
    url: req.url,
    srv: scanner.getRecentServers()
  }))

  app.get('/details/:address', (req, reply) => {
    const { address } = req.params
    const server = ADDRESS.test(address) ? scanner.getServer(address, true) : null
    if (!server) return notFound(req, reply)
    return reply.view('details', {
      title: server.name,
      description: `Get a full overview of the CS2D server "${server.name}", with stats like players, bots, map, region, and performance. View changes in real-time and historical trends.`,
      url: req.url,
      s: server,
      l: leaderboards.find(address),
      existingMap: maps.has(server.map),
      timeAgo,
      getEmojiByCountry
    })
  })

  app.get('/leaderboard/:address', (req, reply) => {
    const { address } = req.params
    const board = ADDRESS.test(address) ? leaderboards.find(address, 100) : null
    if (!board) return notFound(req, reply)
    return reply.view('leaderboard', {
      title: board.name,
      description: `Explore top CS2D players from "${board.name}" ranked by score, kills, deaths, MVPs, and other key stats. Stay up-to-date with daily refreshed leaderboard data.`,
      url: req.url,
      r: board,
      addr: address,
      formatTime,
      timeAgo
    })
  })

  app.get('/tools', (req, reply) => reply.view('tools.ejs', {
    title: 'Tools',
    description: 'Set up Discord alerts for CS2D servers with just a webhook. Stay notified when servers change maps or player counts. Works with any public or private server.',
    url: req.url,
    srv: scanner.getRecentServers()
  }))

  app.post('/tools', async (req, reply) => {
    const body = req.body ?? {}
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const servers = [...new Set([].concat(body.servers ?? []).filter((s) => typeof s === 'string'))]

    if (!servers.length) return { error: 'No servers selected.' }
    if (servers.length > webhooks.MAX_SERVERS) return { error: `Select up to ${webhooks.MAX_SERVERS} servers.` }
    if (!servers.every((s) => ADDRESS.test(s))) return { error: 'Invalid server address provided.' }
    if (!webhooks.URL_PATTERN.test(url)) return { error: 'Invalid webhook URL.' }

    try {
      return await webhooks.register(url, servers)
    } catch (err) {
      req.log.error({ err }, 'webhook registration failed')
      return { err: 'Could not reach Discord.' }
    }
  })

  app.get('/stats', (req, reply) => reply.view('stats', {
    title: 'Statistics',
    description: 'Dive into CS2D analytics showing global player trends, active server counts, favorite maps, top regions, and game mode breakdowns with updated numbers.',
    url: req.url,
    stats: stats.getStats({
      servers: scanner.getRecentServers(),
      traffic: scanner.traffic,
      online: online.get(),
      leaderboards: leaderboards.recent(5)
    }),
    timeAgo
  }))

  app.get('/profile/:userid(^\\d{1,10}$)', (req, reply) => {
    const type = req.query.type === '0' ? 0 : req.query.type === '1' ? 1 : null
    const entries = leaderboards.findPlayer(Number(req.params.userid), type)
    if (!entries.length) return notFound(req, reply)
    const { player } = entries[0]
    return reply.view('profile', {
      p: entries,
      total: leaderboards.summarizePlayer(entries),
      userid: req.params.userid,
      usertype: player.usertype,
      title: player.name,
      description: `${player.name}'s CS2D Profile – Track kills, deaths, MVPs, and time played. Review player activity across servers and maps for User ID ${player.userid}.`,
      url: req.url,
      formatTime
    })
  })

  app.get('/maps', (req, reply) => reply.view('maps.ejs', {
    title: 'Maps',
    description: 'Explore our curated list of CS2D maps featuring classic, competitive, and fun layouts. Perfect for team strategy, deathmatch chaos, or custom game modes.',
    maps: maps.names(),
    url: req.url
  }))

  app.get('/maps/:mapName', (req, reply) => {
    const { mapName } = req.params
    if (!MAP_NAME.test(mapName)) return reply.code(400).send({ error: 'Invalid map name' })
    const v = maps.detail(mapName)
    if (!v) return notFound(req, reply)
    return reply.view('map', {
      v,
      title: mapName,
      description: `Jump into action on ${mapName}. Designed for CS2D, it delivers unique layouts for tactical battles, fast-paced deathmatches, or objective-based gameplay.`,
      url: req.url,
      nextMap: v.nextMap,
      prevMap: v.prevMap,
      bytesToSize
    })
  })

  app.get('/api', (req, reply) => reply.view('api_docs', {
    title: 'API Documentation',
    description: 'Use our public CS2D API to fetch server status, player statistics, map data, and leaderboards. Fully open, with CORS support and no rate limits.',
    url: req.url
  }))
}
