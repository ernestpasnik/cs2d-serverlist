require('dotenv').config()
const fastify = require('fastify')({ trustProxy: true })
fastify.register(require('@fastify/multipart'))
fastify.register(require('@fastify/formbody'))
require('./src/routes.js')(fastify)

// Minify HTML content in production and serve static files in non-production
if (process.env.NODE_ENV === 'production') {
  fastify.register(require('fastify-minify'), { global: true })
} else {
  fastify.register(require('@fastify/static'), { root: __dirname + '/public' })
}

fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: {
    env: process.env.NODE_ENV || 'development',
    v: require('./package.json').version,
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
