const path = require('path')
const servers = require(path.join(__dirname, 'servers.js'))
const common = require(path.join(__dirname, 'common.js'))

function routes(fastify) {
  fastify.get('/', async (req, reply) => {
    const result = servers.getServers()
    const stats = servers.getStats()
    return reply.view('serverlist.ejs', {
      serversNum: result.servers.length,
      playersNum: result.players,
      servers: result.servers,
      uptime: common.secondsToUptime(process.uptime()),
      recv: common.bytesToSize(stats.recvSize),
      sent: common.bytesToSize(stats.sentSize)
    })
  })

  fastify.get('/details', async (req, reply) => {
    return reply.redirect('/')
  })

  fastify.get('/details/:address', async (req, reply) => {
    const result = servers.getServer(req.params.address)
    const stats = servers.getStats()
    if (result.error) {
      return reply.redirect('/')
    }
    const spectators = result.playerlist.filter(p => p.team === 0)
    return reply.view('details', {
      title: result.name,
      s: result,
      spectators: spectators,
      uptime: common.secondsToUptime(process.uptime()),
      recv: common.bytesToSize(stats.recvSize),
      sent: common.bytesToSize(stats.sentSize)
    })
  })

  fastify.get('/api', async (req, reply) => {
    const stats = servers.getStats()
    return reply.view('api', {
      title: 'API Documentation',
      example: servers.getServers().servers[0],
      uptime: common.secondsToUptime(process.uptime()),
      recv: common.bytesToSize(stats.recvSize),
      sent: common.bytesToSize(stats.sentSize),
      url: req.host
    })
  })

  fastify.get('/api/:address', async (req, reply) => {
    const result = servers.getServer(req.params.address)
    if (result.error) {
      return reply.status(404).send(result)
    }
    return reply.send(result)
  })
}

module.exports = routes
