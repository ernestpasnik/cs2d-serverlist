const sockets = require('./sockets.js')

let requests = 0
sockets.initialize()

function routes(fastify) {
  fastify.addHook('onRequest', (request, reply, done) => {
    requests++
    done()
  })

  fastify.get('/', async (req, reply) => {
    return reply.view('servers.ejs', {
      res: sockets.getRecentServers()
    })
  })

  fastify.get('/details', async (req, reply) => {
    return reply.redirect('/')
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = sockets.getServer(req.params.address)
    if (!result) {
      return reply.redirect('/')
    }
    return reply.view('details', {
      title: result.name,
      s: result,
      spectators: result.playerlist.filter(p => p.team === 0)
    })
  })

  fastify.get('/stats', async (req, reply) => {
    return reply.view('stats', {
      title: 'Statistics ',
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
    return reply.status(404).view('404', {
      title: 'Error 404',
      redirect: true,
      url: `${req.protocol}://${req.host}`
    })
  })
}

module.exports = routes
