const path = require('path')
const servers = require(path.join(__dirname, 'servers.js'))
let requests = 0

function routes(fastify) {
  fastify.addHook('onRequest', (request, reply, done) => {
    requests++
    done()
  })

  fastify.get('/', async (req, reply) => {
    const result = servers.getServers()
    return reply.view('serverlist.ejs', {
      serversNum: result.servers.length,
      playersNum: result.players,
      servers: result.servers
    })
  })

  fastify.get('/details', async (req, reply) => {
    return reply.redirect('/')
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = servers.getServer(req.params.address)
    if (result.error) {
      return reply.redirect('/')
    }
    const spectators = result.playerlist.filter(p => p.team === 0)
    return reply.view('details', {
      title: result.name,
      s: result,
      spectators: spectators
    })
  })

  fastify.get('/api', async (req, reply) => {
    return reply.view('api', {
      title: 'API Docs',
      url: `${req.protocol}://${req.host}`
    })
  })

  fastify.get('/stats', async (req, reply) => {
    return reply.view('stats', {
      title: 'Statistics',
      stats: servers.getStats(),
      requests: requests
    })
  })

  fastify.get('/api/:addr', async (req, reply) => {
    const addr = req.params.addr.split(',').map(addr => addr.trim())
    const results = addr.map(addr => servers.getServer(addr))
    const successfulResults = results.filter(result => !result.error)
    if (successfulResults.length === 0) {
      return reply.status(404).send({ error: 'No valid servers found' })
    }
    if (successfulResults.length === 1) {
      return reply.send(successfulResults[0])
    }
    return reply.send(successfulResults)
  })

  fastify.setNotFoundHandler(async (req, reply) => {
    return reply.status(404).view('404', {
      title: 'Error 404'
    })
  })
}

module.exports = routes
