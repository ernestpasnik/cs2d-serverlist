require('dotenv').config()
const path = require('path')
const fastify = require('fastify')({ trustProxy: true })
const routes = require(path.join(__dirname, 'src', 'routes.js'))
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public')
})

fastify.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  },
  root: 'views'
})

fastify.register(require('fastify-minify'), {
  cache: 10000,
  global: true
})

routes(fastify)

fastify.listen({ host: host, port: port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTP Server listening on ${host}:${port}`)
})
