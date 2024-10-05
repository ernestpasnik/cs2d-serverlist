require('dotenv').config()
const path = require('path')
const fastify = require('fastify')({ trustProxy: true })
const servers = require(path.join(__dirname, 'src', 'servers.js'))
const common = require(path.join(__dirname, 'src', 'common.js'))

fastify.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  },
  root: 'views'
})

fastify.register(require('fastify-minify'), {
  cache: 2000,
  global: true
})

fastify.get('/', async function (req, reply) {
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

fastify.get('/details', async function (req, reply) {
  return reply.redirect('/')
})

fastify.get('/details/:address', async function (req, reply) {
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

fastify.get('/api', async function (req, reply) {
  const stats = servers.getStats()
  return reply.view('api', {
    title: 'API Documentation',
    example: servers.getServers().servers[0],
    uptime: common.secondsToUptime(process.uptime()),
    recv: common.bytesToSize(stats.recvSize),
    sent: common.bytesToSize(stats.sentSize),
    host: req.hostname,
    prot: req.protocol
  })
})

fastify.get('/api/:address', async function (req, reply) {
  const result = servers.getServer(req.params.address)
  if (result.error) {
    return reply.status(404).send(result)
  }
  return reply.send(result)
})

fastify.listen({ port: process.env.PORT || 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})
