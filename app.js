require('dotenv').config()
const fastify = require('fastify')({ trustProxy: true })
const version = require('./package.json').version
require('./src/routes.js')(fastify)

if (process.env.NODE_ENV === 'production') {
  // Minify HTML content in production
  fastify.register(require('fastify-minify'), {
    global: true
  })
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

const opt = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 3000
}
fastify.listen(opt, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server listening on ${address}`)
})
