const config = require('./config')
const { child } = require('./logger')
const db = require('./db')
const { buildApp } = require('./app')
const scanner = require('./services/scanner')
const online = require('./services/online')
const snapshotter = require('./services/snapshotter')
const webhooks = require('./services/webhooks')
const mapLoader = require('./services/maps/loader')

const log = child('main')
let app = null
let closing = false

async function shutdown(reason, code = 0) {
  if (closing) return
  closing = true
  log.info({ reason }, 'shutting down')

  setTimeout(() => {
    log.error('forced exit after timeout')
    process.exit(1)
  }, 10000).unref()

  try {
    mapLoader.stop()
    await app?.close()
    await Promise.all([scanner.stop(), online.stop(), snapshotter.stop(), webhooks.stop()])
    db.pragma('optimize')
    db.close()
  } catch (err) {
    log.error({ err }, 'shutdown failed')
    code = 1
  }
  process.exit(code)
}

async function main() {
  app = await buildApp()
  scanner.start()
  online.start()
  snapshotter.start()
  webhooks.start()
  await app.listen({ host: config.host, port: config.port })
  mapLoader.load().catch((err) => log.error({ err }, 'map loading failed'))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'uncaught exception')
  shutdown('uncaughtException', 1)
})
process.on('unhandledRejection', (err) => {
  log.fatal({ err }, 'unhandled rejection')
  shutdown('unhandledRejection', 1)
})

main().catch((err) => {
  log.fatal({ err }, 'startup failed')
  process.exit(1)
})
