require('dotenv').config()
const fastify = require('fastify')({ trustProxy: true })
const version = require('./package.json').version
require('./src/routes.js')(fastify)
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000

if (process.env.NODE_ENV === 'production') {
  // Minify HTML content in production
  fastify.register(require('fastify-minify'))
} else {
  // Serve static files in non-production
  fastify.register(require('@fastify/static'), {
    root: `${__dirname}/public`
  })
}

fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: { v: version }
})

fastify.listen({ host, port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTP Server listening on ${address}`)
})
