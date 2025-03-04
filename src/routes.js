const path = require('path')
const servers = require(path.join(__dirname, 'servers.js'))
const common = require(path.join(__dirname, 'common.js'))

let requestCount = 0

function routes(fastify) {
  fastify.addHook('onRequest', (request, reply, done) => {
    requestCount++
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
    const result = servers.getServers().servers
    const stats = servers.getStats()
    return reply.view('stats', {
      title: 'Statistics',
      uptime: common.secondsToUptime(process.uptime()),
      recv: common.bytesToSize(stats.recvSize),
      sent: common.bytesToSize(stats.sentSize),
      requestCount: requestCount,
      locations: common.sortedCountries(result),
      maps: common.mostPopularMaps(result),
      memory: common.getMemoryUsage()
    })
  })

  fastify.get('/api/:addresses', async (req, reply) => {
    const addresses = req.params.addresses.split(',').map(address => address.trim())
    const results = addresses.map(address => servers.getServer(address))
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
