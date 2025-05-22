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
      description: 'Browse the most active CS2D servers with real-time stats including current map, player count, bots, and region. Access live data with our open JSON API.',
      url: req.url,
      srv: sockets.getRecentServers()
    })
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = sockets.getServer(req.params.address, true)
    if (!result) return err404(req, reply)
    return reply.view('details', {
      title: result.name,
      description: `Get a full overview of the CS2D server "${result.name}", with stats like players, bots, map, region, and performance. View changes in real-time and historical trends.`,
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
      description: `Explore top CS2D players from "${top100.name}" ranked by score, kills, deaths, MVPs, and other key stats. Stay up-to-date with daily refreshed leaderboard data.`,
      url: req.url,
      r: top100,
      addr: req.params.address,
      formatTime,
      timeAgo
    })
  })

  fastify.get('/tools', async (req, reply) => {
    return reply.view('tools.ejs', {
      title: 'Tools',
      description: 'Set up Discord alerts for CS2D servers with just a webhook. Stay notified when servers change maps or player counts. Works with any public or private server.',
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
      description: 'Dive into CS2D analytics showing global player trends, active server counts, favorite maps, top regions, and game mode breakdowns with updated numbers.',
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
      description: `${p[0].player.name}'s CS2D Profile – Track kills, deaths, MVPs, and time played. Review player activity across servers and maps for User ID ${p[0].player.userid}.`,
      url: req.url,
      formatTime
    })
  })

  fastify.get('/maps', async (req, reply) => {
    return reply.view('maps.ejs', {
      title: 'Maps',
      description: `Explore our curated list of CS2D maps featuring classic, competitive, and fun layouts. Perfect for team strategy, deathmatch chaos, or custom game modes.`,
      maps: await maps.getAllMapNames(),
      url: req.url
    })
  })

  fastify.get('/maps/:mapName', async (req, reply) => {
    const mapName = req.params.mapName
    if (!/^(as_|cs_|de_|dm_|ctf_|dom_|con_|zm_|fy_|he_|ka_|awp_|aim_)[a-z0-9_]+$/.test(mapName)) {
      return reply.code(400).send({ error: 'Invalid map name' })
    }
    const dat = await redis.get(`map:${mapName}`)
    if (!dat) return err404(req, reply)
    const maplist = await maps.getAllMapNames()
    const index = maplist.indexOf(mapName)
    const nextMap = maplist[(index + 1) % maplist.length]
    const prevMap = maplist[(index - 1 + maplist.length) % maplist.length]
    if (index === -1) return err404(req, reply)
    return reply.view('map', {
      v: { ...JSON.parse(dat), nextMap, prevMap },
      title: mapName,
      description: `Jump into action on ${mapName}. Designed for CS2D, it delivers unique layouts for tactical battles, fast-paced deathmatches, or objective-based gameplay.`,
      url: req.url,
      nextMap, prevMap,
      bytesToSize
    })
  })

  fastify.get('/api', async (req, reply) => {
    return reply.view('api_docs', {
      title: 'API Documentation',
      description: 'Use our public CS2D API to fetch server status, player statistics, map data, and leaderboards. Fully open, with CORS support and no rate limits.',
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

  fastify.get('/api/maps/:mapName', async (req, reply) => {
    const mapName = req.params.mapName
    if (!/^(as_|cs_|de_|dm_|ctf_|dom_|con_|zm_|fy_|he_|ka_|awp_|aim_)[a-z0-9_]+$/.test(mapName)) {
      return reply.code(400).send({ error: 'Invalid map name' })
    }
    const dat = await redis.get(`map:${mapName}`)
    if (!dat) return err404(req, reply)
    const maplist = await maps.getAllMapNames()
    const index = maplist.indexOf(mapName)
    if (index === -1) return err404(req, reply)
    const mapData = JSON.parse(dat)
    const nextMap = maplist[(index + 1) % maplist.length]
    const prevMap = maplist[(index - 1 + maplist.length) % maplist.length]
    return reply.send({ ...mapData, nextMap, prevMap })
  })

  fastify.post('/api/upload', async (req, reply) => {
    let buff = null
    let port = null
    let sort = 1
    const parts = req.parts()

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') {
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
