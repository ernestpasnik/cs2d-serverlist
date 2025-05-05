require('dotenv').config()
const { getMTimeUnix } = require('./src/utils')
const fastify = require('fastify')({ trustProxy: true })
const Redis = require('ioredis')
const redis = new Redis()

const getFromCache = async (key) => {
  const cachedValue = await redis.get(key)
  return cachedValue ? JSON.parse(cachedValue) : null
}

const setToCache = async (key, value) => {
  await redis.set(key, JSON.stringify(value), 'EX', 3600)
}

fastify.register(require('@fastify/multipart'))
fastify.register(require('@fastify/formbody'))
require('./src/routes')(fastify)

if (process.env.NODE_ENV === 'production') {
  fastify.register(require('fastify-minify'), {
    global: true,
    cache: {
      get: getFromCache,
      set: setToCache
    }
  })
} else {
  fastify.register(require('@fastify/static'), { root: __dirname + '/public' })
}

fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: {
    style: getMTimeUnix('public/style.css'),
    script: getMTimeUnix('public/script.js')
  },
})

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
