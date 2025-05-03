const sockets = require('./sockets')
const leaderboard = require('./leaderboard')
const webhooks = require('./webhooks')
const stats = require('./stats')
const { escapeQuotes, formatTime, timeAgo } = require('./utils')
sockets.initialize()

function err404(req, reply) {
  return reply.status(404).view('404', {
    title: '404 Not Found',
    description: 'The page you\'re looking for doesn\'t exist.',
    keywords: '404, page not found',
    url: req.url
  })
}

function routes(fastify) {
  fastify.get('/', async (req, reply) => {
    return reply.view('servers.ejs', {
      title: null,
      description: 'Browse the list of active CS2D servers with detailed stats on map, player count, bots, and region. Access server data with our open API.',
      keywords: `CS2D, server list, active servers, server stats, map, player count, bots, region, API, server data`,
      url: req.url,
      srv: sockets.getRecentServers()
    })
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = sockets.getServer(req.params.address, true)
    if (!result) {
      return err404(req, reply)
    }
    return reply.view('details', {
      title: escapeQuotes(result.name),
      description: `View active CS2D server details for ${escapeQuotes(result.name)} including map, player count, bots, and region. Quickly access stats and performance data.`,
      keywords: `CS2D, ${escapeQuotes(result.name)}, server stats, map, player count, bots, region, server performance`,
      url: req.url,
      s: result,
      l: leaderboard.getLeaderboard(req.params.address),
      timeAgo
    })
  })

  fastify.get('/leaderboard/:address', async (req, reply) => {
    const result = leaderboard.getLeaderboard(req.params.address)
    if (!result) {
      return err404(req, reply)
    }
    return reply.view('leaderboard', {
      title: escapeQuotes(result.name),
      description: `Browse the top-performing CS2D players for "${escapeQuotes(result.name)}" based on server stats, including rankings, scores, and player achievements.`,
      keywords: `CS2D, ${escapeQuotes(result.name)}, leaderboard, top players, rankings, scores, player achievements`,
      url: req.url,
      r: result,
      addr: req.params.address,
      formatTime,
      timeAgo
    })
  })

  fastify.get('/webhooks', async (req, reply) => {
    return reply.view('webhooks.ejs', {
      title: 'Webhooks',
      description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
      keywords: 'CS2D, webhooks, Discord, server updates, server notifications, webhook URL',
      url: req.url,
      srv: sockets.getRecentServers()
    })
  })

  fastify.post('/webhooks', async (req, reply) => {
    const url = req.body.url || ''
    let servers = req.body.servers || []
    if (!Array.isArray(servers)) {
      if (typeof servers === 'string') {
        servers = [servers]
      } else {
        servers = []
      }
    }
    
    if (servers.length < 1) {
      return reply.view('webhooks.ejs', {
        title: 'Webhooks',
        description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
        keywords: 'CS2D, webhooks, Discord, server updates, server notifications, webhook URL',
        url: req.url,
        srv: sockets.getRecentServers(),
        err: 'You didn\'t select any servers.'
      })
    }
  
    const ipPortRegex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/
    for (const server of servers) {
      if (typeof server !== 'string' || !ipPortRegex.test(server)) {
        return reply.view('webhooks.ejs', {
          title: 'Webhooks',
          description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
          keywords: 'CS2D, webhooks, Discord, server updates, server notifications, webhook URL',
          url: req.url,
          srv: sockets.getRecentServers(),
          err: 'You provided an invalid server address.'
        })
      }
    }
  
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}$/
    if (typeof url !== 'string' || !discordWebhookRegex.test(url)) {
      return reply.view('webhooks.ejs', {
        title: 'Webhooks',
        description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
        keywords: 'CS2D, webhooks, Discord, server updates, server notifications, webhook URL',
        url: req.url,
        srv: sockets.getRecentServers(),
        err: 'You provided an invalid webhook URL.'
      })
    }

    const dcRes = await webhooks.addWebhook(url, servers)
    return reply.view('webhooks.ejs', {
      title: 'Webhooks',
      description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
      keywords: 'CS2D, webhooks, Discord, server updates, server notifications, webhook URL',
      url: req.url,
      srv: sockets.getRecentServers(),
      ...dcRes
    })
  })

  fastify.get('/stats', async (req, reply) => {
    const servers = sockets.getRecentServers()
    const leaderboards = leaderboard.getLeaderboards()
    return reply.view('stats', {
      title: 'Statistics',
      description: 'Explore CS2D statistics: active players, server count, game modes, regions, and the most popular maps in a detailed breakdown.',
      keywords: 'CS2D, statistics, active players, server count, game modes, regions, maps, player stats',
      url: req.url,
      stats: stats.getStats(servers, leaderboards),
      timeAgo
    })
  })

  fastify.get('/api', async (req, reply) => {
    return reply.view('api', {
      title: 'API Documentation',
      description: 'Access CS2D server and leaderboard data with our open API. Free, unlimited access with CORS support and easy integration.',
      keywords: 'CS2D, API, server data, leaderboard, CORS, free API, server integration',
      url: req.url
    })
  })

  fastify.post('/api/upload', async (req, reply) => {
    let fileBuffer = null
    let port = null
    let sort = 1
    const parts = req.parts()
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') {
        fileBuffer = await part.toBuffer()
      } else if (part.type === 'field') {
        if (part.fieldname === 'port') {
          port = Number(part.value)
        } else if (part.fieldname === 'sort') {
          const s = Number(part.value)
          if ([0, 1, 2].includes(s)) sort = s
        }
      }
    }
    if (!port) {
      return reply.code(500).send({ error: 'Port is required' })
    }
    const addr = `${req.ip}:${port}`
    const result = sockets.getServer(addr)
    if (!result) {
      return reply.code(500).send({ error: 'No valid servers found' })
    }
    try {
      leaderboard.parse(result.name, addr, sort, fileBuffer)
    } catch (err) {
      return reply.code(500).send({ error: err.message })
    }
    return reply.send({ error: false })
  })

  fastify.get('/api/:addr', async (req, reply) => {
    const addr = req.params.addr.split(',').map(addr => addr.trim())
    const results = addr.map(addr => sockets.getServer(addr))
    const successfulResults = results.filter(result => result !== false)
    if (successfulResults.length === 0) {
      return reply.status(404).send({ error: 'No valid servers found' })
    }
    if (successfulResults.length === 1) {
      return reply.send(results[0])
    }
    return reply.send(successfulResults)
  })

  fastify.setNotFoundHandler(async (req, reply) => {
    return err404(req, reply)
  })
}

module.exports = routes
