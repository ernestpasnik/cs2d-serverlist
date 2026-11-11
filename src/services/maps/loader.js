const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { setImmediate: yieldLoop } = require('node:timers/promises')
const config = require('../../config')
const { child } = require('../../logger')
const { MAP_NAME } = require('../../utils/patterns')
const maps = require('../../repositories/maps')
const { parseMap } = require('./parser')
const { renderMinimap } = require('./render')

const log = child('maps')
let stopped = false

function inside(base, relative) {
  if (!relative) return null
  const resolved = path.resolve(base, relative.replace(/\\/g, '/'))
  return resolved.startsWith(base + path.sep) ? resolved : null
}

async function fileSize(filePath) {
  if (!filePath) return null
  try {
    return (await fs.stat(filePath)).size
  } catch {
    return null
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectResources(entities) {
  const resources = []
  for (const { type, str } of entities) {
    if (![22, 23, 28].includes(type)) continue
    const resourcePath = str[0]?.trim().replace(/\\/g, '/')
    if (!resourcePath || resources.some((r) => r.path === resourcePath)) continue
    resources.push({ path: resourcePath, size: (await fileSize(inside(config.dirs.cs2d, resourcePath))) ?? 0 })
  }
  return resources.sort((a, b) => a.size - b.size)
}

async function writeMinimap(name, parsed) {
  const target = path.join(config.dirs.minimaps, `${name}.webp`)
  if (await exists(target)) return
  try {
    await fs.writeFile(target, await renderMinimap(parsed))
  } catch (err) {
    log.warn({ map: name, error: err.message }, 'minimap render failed')
  }
}

async function build(name, filePath, stat) {
  const buffer = await fs.readFile(filePath)
  const parsed = parseMap(buffer)
  const { header } = parsed

  const tileSize = await fileSize(inside(config.dirs.tiles, header.tileImg))
  if (tileSize === null) {
    log.warn({ map: name, tileset: header.tileImg }, 'tileset missing, map skipped')
    return null
  }

  const bgSize = (await fileSize(inside(config.dirs.backgrounds, header.bgImg))) ?? 0
  const resources = await collectResources(parsed.entities)
  const camera = parsed.entities.findLast((e) => e.type === 0)

  const data = {
    name,
    mapHash: crypto.createHash('sha256').update(buffer).digest('hex'),
    mapSize: buffer.length,
    mapWidth: header.mapWidth,
    mapHeight: header.mapHeight,
    tileImg: header.tileImg,
    tileFileSize: tileSize,
    tileCount: header.tileCount,
    bgImg: header.bgImg,
    bgSize,
    bgColor: `rgb(${header.bgRed}, ${header.bgGreen}, ${header.bgBlue})`,
    programUsed: header.programUsed,
    authorName: header.authorName,
    authorUSGN: header.authorUSGN,
    resources,
    map: parsed.map,
    tileMode: parsed.map.map((column) => column.map((id) => {
      const mode = parsed.tileMode[id] ?? 0
      return mode > 2 ? 0 : mode
    })),
    mapModifiers: parsed.mapModifiers,
    tileSize: header.use64pxTiles === 1 ? 64 : 32,
    entities: parsed.entities
  }
  if (camera) data.cam = [camera.x, camera.y]

  await writeMinimap(name, parsed)

  return { name, hash: data.mapHash, size: stat.size, mtimeMs: Math.trunc(stat.mtimeMs), data: JSON.stringify(data) }
}

async function load() {
  let files
  try {
    files = await fs.readdir(config.dirs.maps)
  } catch (err) {
    if (err.code === 'ENOENT') {
      log.warn({ dir: config.dirs.maps }, 'maps directory missing, skipping')
      return
    }
    throw err
  }
  await fs.mkdir(config.dirs.minimaps, { recursive: true })

  const started = performance.now()
  const known = maps.fingerprints()
  const present = new Set()
  const result = { parsed: 0, unchanged: 0, failed: 0 }

  for (const file of files) {
    if (stopped) return
    if (!file.endsWith('.map')) continue
    const name = file.slice(0, -4)
    if (!MAP_NAME.test(name)) continue
    present.add(name)

    try {
      const filePath = path.join(config.dirs.maps, file)
      const stat = await fs.stat(filePath)
      const previous = known.get(name)
      if (!config.maps.forceReload && previous && previous.size === stat.size && previous.mtimeMs === Math.trunc(stat.mtimeMs)) {
        result.unchanged++
        continue
      }
      const record = await build(name, filePath, stat)
      if (record) {
        maps.save(record)
        result.parsed++
      } else {
        maps.remove(name)
        result.failed++
      }
    } catch (err) {
      result.failed++
      log.error({ err, map: name }, 'map load failed')
    }
    await yieldLoop()
  }

  let removed = 0
  for (const name of known.keys()) {
    if (!present.has(name) && maps.remove(name)) removed++
  }

  log.info({ ...result, removed, ms: Math.round(performance.now() - started) }, 'maps loaded')
}

module.exports = { load, stop: () => { stopped = true } }
