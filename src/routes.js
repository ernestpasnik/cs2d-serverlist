const redis = require('./utils/redis')
const sockets = require('./sockets')
const leaderboard = require('./leaderboard')
const tools = require('./tools')
const stats = require('./stats/stats')
const profile = require('./profile')
const { formatTime, timeAgo, getEmojiByCountry, bytesToSize } = require('./utils/utils')
sockets.initialize()

const maps = require('./maps/maps')
try {
  maps.loadAndRender()
} catch (error) {
  console.log(error)
}

function err404(req, reply) {
  return reply.status(404).view('404', {
    title: '404 Not Found',
    url: req.url
  })
}

function routes(fastify) {
  fastify.get('/', async (req, reply) => {
    return reply.view('servers', {
      title: null,
      description: 'Browse the list of active CS2D servers with detailed stats on map, player count, bots, and region. Access server data with our open API.',
      url: req.url,
      srv: sockets.getRecentServers()
    })
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = sockets.getServer(req.params.address, true)
    if (!result) return err404(req, reply)
    return reply.view('details', {
      title: result.name,
      description: `View active CS2D server details for ${result.name} including map, player count, bots, and region. Quickly access stats and performance data.`,
      url: req.url,
      s: result,
      l: await leaderboard.getLeaderboard(req.params.address),
      existingMap: await redis.exists(`map:${result.map}`),
      timeAgo,
      getEmojiByCountry
    })
  })

  fastify.get('/leaderboard/:address', async (req, reply) => {
    const result = await leaderboard.getLeaderboard(req.params.address)
    if (!result) return err404(req, reply)

    const top100 = {...result, players: result.players.slice(0, 100) }
    return reply.view('leaderboard', {
      title: top100.name,
      description: `Browse the top-performing CS2D players for ${top100.name} based on server stats, including rankings, scores, and player achievements.`,
      url: req.url,
      r: top100,
      addr: req.params.address,
      formatTime,
      timeAgo
    })
  })

  fastify.get('/maps', async (req, reply) => {
    return reply.view('maps.ejs', {
      title: 'Maps',
      maps: await maps.getAllMapNames(),
      url: req.url
    })
  })

  fastify.get('/tools', async (req, reply) => {
    return reply.view('tools.ejs', {
      title: 'Tools',
      description: 'Monitor CS2D server stats and updates in your Discord server. Easily add your webhook URL for automatic notifications.',
      url: req.url,
      srv: sockets.getRecentServers()
    })
  })

  fastify.post('/tools', async (req, reply) => {
    const { url = '', servers = [] } = req.body
    if (!Array.isArray(servers)) servers = typeof servers === 'string' ? [servers] : []
    if (servers.length === 0) return reply.send({ error: 'No servers selected.' })

    const ipPortRegex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/
    if (servers.some(server => typeof server !== 'string' || !ipPortRegex.test(server))) {
      return reply.send({ error: 'Invalid server address provided.' })
    }

    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}$/
    if (typeof url !== 'string' || !discordWebhookRegex.test(url)) {
      return reply.send({ error: 'Invalid webhook URL.' })
    }

    const dcRes = await tools.addWebhook(url, servers)
    return reply.send(dcRes)
  })

  fastify.get('/stats', async (req, reply) => {
    const servers = sockets.getRecentServers()
    const leaderboards = await leaderboard.getLeaderboards()
    return reply.view('stats', {
      title: 'Statistics',
      description: 'Explore CS2D statistics: active players, server count, game modes, regions, and the most popular maps in a detailed breakdown.',
      url: req.url,
      stats: stats.getStats(servers, leaderboards),
      timeAgo
    })
  })

  fastify.get('/profile/:userid(^\\d+$)', async (req, reply) => {
    const leaderboards = await leaderboard.getLeaderboards()
    const p = profile.findPlayerByUserId(req.params.userid, leaderboards)
    if (p.length == 0) return err404(req, reply)
    return reply.view('profile', {
      p,
      total: profile.calculatePlayerStats(p),
      userid: req.params.userid,
      usertype: p[0].player.usertype,
      title: p[0].player.name,
      description: `${p[0].player.name}'s CS2D Profile: Discover stats for ${p[0].player.name} (User ID: ${p[0].player.userid}). View performance with impressive kills, deaths, assists, MVPs, and time played. Explore activity across various servers and maps.`,
      url: req.url,
      formatTime
    })
  })

  fastify.get('/maps/:mapName', async (req, reply) => {
    const mapName = req.params.mapName
    if (!/^[a-zA-Z0-9_-]+$/.test(mapName)) {
      return reply.code(400).send({ error: 'Invalid map name' })
    }

    const dat = await redis.get(`map:${mapName}`)
    if (!dat) return err404(req, reply)

    const maplist = await maps.getAllMapNames()
    const currentIndex = maplist.indexOf(mapName)
    if (currentIndex === -1) return err404(req, reply)
    const nextIndex = (currentIndex + 1) % maplist.length
    const prevIndex = (currentIndex - 1 + maplist.length) % maplist.length

    return reply.view('map', {
      v: JSON.parse(dat),
      title: mapName,
      description: `Explore a variety of custom maps for intense, action-packed gameplay—whether you prefer tactical team combat, deathmatches, or creative environments, we have maps for every style.`,
      url: req.url,
      nextMap: maplist[nextIndex],
      prevMap: maplist[prevIndex],
      bytesToSize
    })
  })

  fastify.get('/api', async (req, reply) => {
    return reply.view('api_docs', {
      title: 'API Documentation',
      description: 'Access CS2D server and leaderboard data with our open API. Free, unlimited access with CORS support and easy integration.',
      url: req.url
    })
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

  fastify.post('/api/upload', async (req, reply) => {
    let buff = null
    let port = null
    let sort = 1
    const parts = req.parts()

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') {
        // Check if the file has a .dat extension
        const filename = part.filename
        const fileExtension = filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
        if (fileExtension.toLowerCase() !== 'dat') {
          return reply.code(400).send({ error: 'Invalid file type. Only .dat files are allowed.' })
        }
        buff = await part.toBuffer()
      } else if (part.type === 'field') {
        if (part.fieldname === 'port') {
          port = Number(part.value)
        } else if (part.fieldname === 'sort') {
          const s = Number(part.value)
          if ([0, 1, 2].includes(s)) sort = s
        }
      }
    }

    if (!port) return reply.code(500).send({ error: 'Port is required' })

    const addr = `${req.ip}:${port}`
    const result = sockets.getServer(addr)
    if (!result) return reply.code(500).send({ error: 'No valid servers found' })

    leaderboard.parse(result.name, addr, sort, buff)
    return reply.send({ error: false, message: 'Upload completed successfully' })
  })

  fastify.setNotFoundHandler(async (req, reply) => {
    return err404(req, reply)
  })
}

module.exports = routes
