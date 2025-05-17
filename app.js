require('dotenv').config()
const redis = require('./src/utils/redis')
const { getMTimeUnix } = require('./src/utils/utils')
const fastify = require('fastify')({ trustProxy: true })

const getFromCache = async (key) => {
  const cachedValue = await redis.get(key)
  return cachedValue ? JSON.parse(cachedValue) : null
}

const setToCache = async (key, value) => {
  await redis.set(key, JSON.stringify(value), 'EX', 3600)
}

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 1048576,  // 1 MB in bytes
    files: 1,           // Max number of file fields
  }
})
fastify.register(require('@fastify/formbody'))
require('./src/routes')(fastify)

const production = process.env.NODE_ENV === 'production'
if (production) {
  fastify.register(require('fastify-minify'), {
    global: true,
    cache: {
      get: getFromCache,
      set: setToCache
    }
  })
} else {
  const fastifyStatic = require('@fastify/static')
  fastify.register(fastifyStatic, { root: __dirname + '/public',  })
}

fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: {
    production,
    description: null,
    style: getMTimeUnix('public/css/main.min.css'),
    script: getMTimeUnix('public/js/main.min.js')
  },
})

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true
  const timeout = setTimeout(() => {
    console.warn('Forcefully shutting down after 10 seconds')
    process.exit(1)
  }, 10000)
  timeout.unref()
  try {
    await fastify.close()
    console.log('Closed out remaining connections')
    await redis.quit()
    console.log('Redis connection closed')
  } catch (err) {
    console.error('Error while shutting down:', err)
  }
  clearTimeout(timeout)
  process.exit(0)
}

let isShuttingDown = false
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

fastify.listen({
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 3000
}, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server listening on ${address}`)
})
