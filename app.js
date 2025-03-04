require('dotenv').config()
const fastify = require('fastify')()
const package = require(`${__dirname}/package.json`)
const routes = require(`${__dirname}/src/routes.js`)
const opt = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 3000
}

let minify = true
let version = package.version
if (process.env.NODE_ENV === 'development') {
  minify = false
  version = Math.floor(Date.now() / 1000)
}

fastify.register(require('@fastify/static'), {
  root: `${__dirname}/public`
})

fastify.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  },
  root: 'views',
  layout: 'layout.ejs',
  defaultContext: {
    version: version,
    env: process.env.NODE_ENV
  }
})

fastify.register(require('fastify-minify'), {
  global: minify
})

routes(fastify)

fastify.listen({ host: opt.host, port: opt.port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTP Server listening on ${address}`)
})
