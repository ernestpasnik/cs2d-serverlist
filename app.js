require('dotenv').config()
const fastify = require('fastify')({ trustProxy: true })
const package = require('./package.json')
const routes = require('./src/routes.js')
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000
console.log(`NODE_ENV=${process.env.NODE_ENV}`)

if (process.env.NODE_ENV !== 'production') {
  // In production, use Nginx or another web server to serve static files
  fastify.register(require('@fastify/static'), {
    root: `${__dirname}/public`
  })
}

fastify.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: {
    version: package.version,
    env: process.env.NODE_ENV
  }
})

fastify.register(require('fastify-minify'), {
  global: true
})

routes(fastify)

fastify.listen({ host, port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTP Server listening on ${address}`)
})
