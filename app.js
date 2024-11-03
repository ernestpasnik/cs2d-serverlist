require('dotenv').config()
const path = require('path')
const pjson = require('./package.json')
const fastify = require('fastify')({ trustProxy: true })
const routes = require(path.join(__dirname, 'src', 'routes.js'))
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000
const env = process.env.NODE_ENV || 'development'
const nodeVersion = process.versions.node
console.log(`Current Environment: ${env}`)
console.log(`Node.js Version: ${nodeVersion}`)

if (env !== 'production') {
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public')
  })
}

fastify.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  },
  root: 'views',
  layout: 'layout.ejs',
  maxCache: 5000,
  defaultContext: {
    version: pjson.version
  }
})

fastify.register(require('fastify-minify'), {
  cache: 5000,
  global: true
})

routes(fastify)

fastify.listen({ host: host, port: port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTP Server address: ${host}:${port}`)
})
