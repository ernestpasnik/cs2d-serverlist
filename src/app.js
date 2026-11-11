const path = require('node:path')
const fastify = require('fastify')
const config = require('./config')
const { logger } = require('./logger')
const { mtimeUnix } = require('./utils/format')
const { notFound } = require('./routes/helpers')

async function buildApp() {
  const app = fastify({ loggerInstance: logger, trustProxy: true })

  await app.register(require('@fastify/cors'), { origin: '*', methods: ['GET', 'HEAD', 'OPTIONS'] })
  await app.register(require('@fastify/multipart'), { limits: { fileSize: 1048576, files: 1 } })
  await app.register(require('@fastify/formbody'))
  await app.register(require('@fastify/static'), {
    root: config.dirs.public,
    decorateReply: false,
    index: false,
    maxAge: config.production ? '1h' : 0
  })
  await app.register(require('@fastify/view'), {
    engine: { ejs: require('ejs') },
    root: config.dirs.views,
    layout: 'layout.ejs',
    defaultContext: {
      production: config.production,
      description: null,
      style: mtimeUnix(path.join(config.dirs.public, 'styles.css')),
      script: mtimeUnix(path.join(config.dirs.public, 'scripts.js'))
    }
  })

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-content-type-options', 'nosniff')
    reply.header('referrer-policy', 'strict-origin-when-cross-origin')
  })

  app.setNotFoundHandler((req, reply) => notFound(req, reply))
  app.setErrorHandler((err, req, reply) => {
    const status = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500
    if (status >= 500) req.log.error({ err }, 'request failed')
    const message = status >= 500 ? 'Internal server error' : err.message
    if (req.url.startsWith('/api')) return reply.code(status).send({ error: message })
    return reply.code(status).type('text/plain').send(message)
  })

  await app.register(require('./routes/pages'))
  await app.register(require('./routes/api'), { prefix: '/api' })

  return app
}

module.exports = { buildApp }
