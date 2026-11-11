const pino = require('pino')
const config = require('./config')

const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport: config.production
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
})

const child = (module) => logger.child({ module })

module.exports = { logger, child }
