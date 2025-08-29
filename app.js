require('dotenv').config()

const path = require('path')
const fastify = require('fastify')({
  trustProxy: true,
  logger: { level: process.env.LOG_LEVEL || 'info' }
})
const fastifyStatic = require('@fastify/static')
const redis = require('./src/utils/redis')
const { getMTimeUnix } = require('./src/utils/utils')

const CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT) || 3000,
  cacheTTL: Number(process.env.CACHE_TTL) || 3600,
  uploadLimit: 1 * 1024 * 1024,
}

const getFromCache = async (key) => {
  try {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (err) {
    fastify.log.error({ err, key }, 'Redis GET failed')
    return null
  }
}

const setToCache = async (key, value, ttl = CONFIG.cacheTTL) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch (err) {
    fastify.log.error({ err, key }, 'Redis SET failed')
  }
}

fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: CONFIG.uploadLimit, files: 1 }
})

fastify.register(require('@fastify/formbody'))

fastify.register(require('fastify-minify'), {
  global: true,
  cache: { get: getFromCache, set: setToCache }
})

fastify.register(fastifyStatic, { 
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
  decorateReply: false
})

fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: path.join(__dirname, 'views'),
  layout: 'layout.ejs',
  defaultContext: {
    production: process.env.NODE_ENV === 'production',
    description: null,
    style: getMTimeUnix('public/styles.css'),
    script: getMTimeUnix('public/scripts.js')
  },
})

require('./src/routes')(fastify)

let shuttingDown = false

const gracefulShutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  fastify.log.info(`Received ${signal}, shutting down...`)

  const timeout = setTimeout(() => {
    fastify.log.error('Force shutdown after 10s')
    process.exit(1)
  }, 10_000).unref()

  try {
    await fastify.close()
    fastify.log.info('Fastify closed')
    await redis.quit()
    fastify.log.info('Redis closed')
  } catch (err) {
    fastify.log.error({ err }, 'Error during shutdown')
  } finally {
    clearTimeout(timeout)
    process.exit(0)
  }
}

['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => gracefulShutdown(sig)))

const start = async () => {
  try {
    const address = await fastify.listen({ host: CONFIG.host, port: CONFIG.port })
    fastify.log.info(`Server listening on ${address}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
