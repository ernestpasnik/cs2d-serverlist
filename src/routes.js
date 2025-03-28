const sockets = require('./sockets.js')

let requests = 0
sockets.initialize()

function err404(req, reply) {
  return reply.status(404).view('404', {
    title: '404 Not Found',
    url: `${req.protocol}://${req.host}`
  })
}

function routes(fastify) {
  fastify.addHook('onRequest', (req, reply, done) => {
    requests++
    done()
  })

  fastify.get('/', async (req, reply) => {
    return reply.view('servers.ejs', {
      res: sockets.getRecentServers()
    })
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = sockets.getServer(req.params.address)
    if (!result) {
      return err404(req, reply)
    }
    return reply.view('details', {
      title: result.name,
      s: result
    })
  })

  fastify.get('/stats', async (req, reply) => {
    return reply.view('stats', {
      title: 'Statistics',
      stats: sockets.getStats(sockets.getRecentServers().servers),
      requests: requests
    })
  })

  fastify.get('/api', async (req, reply) => {
    return reply.view('api', {
      title: 'API Documentation',
      url: `${req.protocol}://${req.host}`
    })
  })

  fastify.get('/api/stats', async (req, reply) => {
    const recentServers = sockets.getRecentServers()
    const players = recentServers.playersNum
    const servers = recentServers.serversNum
    const request = requests
    const stats = sockets.getStats(recentServers.servers)
    return reply.send({
      players,
      servers,
      request,
      ...stats
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

  fastify.setNotFoundHandler(async (req, reply) => {
    return err404(req, reply)
  })
}

module.exports = routes
