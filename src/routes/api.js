const scanner = require('../services/scanner')
const leaderboard = require('../services/leaderboard')
const maps = require('../repositories/maps')
const snapshots = require('../repositories/snapshots')
const { ADDRESS, MAP_NAME } = require('../utils/patterns')

const { RANGES, GLOBAL_RANGES, DETAIL_RANGES, DIM_KINDS } = snapshots
const MAX_ADDRESSES = 50

const rangeQuery = (names, extra = {}) => ({
  querystring: {
    type: 'object',
    properties: {
      range: { type: 'string', enum: names, default: names.includes('24h') ? '24h' : names[0] },
      ...extra
    },
    additionalProperties: false
  }
})

const cacheable = (reply) => reply.header('cache-control', 'public, max-age=30')

module.exports = async function api(app) {
  app.get('/servers', async () => scanner.listPublic())

  app.get('/history', { schema: rangeQuery(GLOBAL_RANGES) }, async (req, reply) => {
    const { range } = req.query
    cacheable(reply)
    return { range, bucket: RANGES[range].bucket, points: snapshots.globalSeries(range) }
  })

  app.get('/history/:addr', { schema: rangeQuery(DETAIL_RANGES) }, async (req, reply) => {
    const { addr } = req.params
    const { range } = req.query
    const points = ADDRESS.test(addr) ? snapshots.serverSeries(addr, range) : null
    if (!points) return reply.code(404).send({ error: 'No history for this server' })
    cacheable(reply)
    return { addr, range, bucket: RANGES[range].bucket, points }
  })

  app.get('/rankings/:kind', {
    schema: {
      params: { type: 'object', properties: { kind: { type: 'string', enum: Object.keys(DIM_KINDS) } } },
      ...rangeQuery(DETAIL_RANGES, { limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 } })
    }
  }, async (req, reply) => {
    const { kind } = req.params
    const { range, limit } = req.query
    cacheable(reply)
    return { kind, range, items: snapshots.ranking(kind, range, limit) }
  })

  app.get('/maps/:mapName', async (req, reply) => {
    const { mapName } = req.params
    if (!MAP_NAME.test(mapName)) return reply.code(400).send({ error: 'Invalid map name' })
    const map = maps.detail(mapName)
    if (!map) return reply.code(404).send({ error: 'Map not found' })
    return map
  })

  app.get('/:addr', async (req, reply) => {
    const addrs = [...new Set(req.params.addr.split(',').map((a) => a.trim()))].slice(0, MAX_ADDRESSES)
    const found = addrs.filter((a) => ADDRESS.test(a)).map((a) => scanner.getServer(a)).filter(Boolean)
    if (!found.length) return reply.code(404).send({ error: 'No valid servers found' })
    return found.length === 1 ? found[0] : found
  })

  app.post('/upload', async (req, reply) => {
    let buffer = null
    let invalidType = false
    let port = 0
    let sort = 1

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        if (part.fieldname === 'file' && /\.dat$/i.test(part.filename)) buffer = await part.toBuffer()
        else {
          invalidType ||= part.fieldname === 'file'
          part.file.resume()
        }
      } else if (part.fieldname === 'port') {
        port = Number(part.value)
      } else if (part.fieldname === 'sort') {
        const value = Number(part.value)
        if ([0, 1, 2].includes(value)) sort = value
      }
    }

    if (invalidType) return reply.code(400).send({ error: 'Invalid file type. Only .dat files are allowed.' })
    if (!buffer) return reply.code(400).send({ error: 'File is required' })
    if (!Number.isInteger(port) || port < 1 || port > 65535) return reply.code(400).send({ error: 'Port is required' })

    const addr = `${req.ip.replace(/^::ffff:/, '')}:${port}`
    const server = scanner.getServer(addr)
    if (!server) return reply.code(404).send({ error: 'No valid servers found' })

    try {
      leaderboard.ingest({ addr, name: server.name, sort, buffer })
    } catch (err) {
      if (!(err instanceof leaderboard.InvalidUpload)) throw err
      req.log.warn({ addr }, 'invalid leaderboard upload')
      return reply.code(400).send({ error: err.message })
    }
    return { error: false, message: 'Upload completed successfully' }
  })
}
