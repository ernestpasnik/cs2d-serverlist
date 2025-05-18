const fs = require('fs').promises
const crypto = require('crypto')
const redis = require('../utils/redis')
const Parser = require('./parser')
const Render = require('./render')
const render = new Render()

function pLimit(concurrency) {
  const queue = []
  let activeCount = 0

  const next = () => {
    if (queue.length === 0) return
    if (activeCount >= concurrency) return

    activeCount++
    const { fn, resolve, reject } = queue.shift()

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--
        next()
      })
  }

  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    next()
  })
}

async function loadAndRender() {
  let files = 0
  const startTime = Date.now()
  const mapsDir = 'public/cs2d/maps'
  try {
    await fs.access(mapsDir)
  } catch {
    console.warn(`Maps directory "${mapsDir}" does not exist, skipping loading maps`)
    return
  }

  const minimaps = 'public/cs2d/minimaps'
  await fs.mkdir(minimaps, { recursive: true })

  const allFiles = await fs.readdir(mapsDir)
  const mapFiles = allFiles.filter(file => file.endsWith('.map'))

  const limit = pLimit(4)
  const tasks = mapFiles.map(mapFile => limit(async () => {
    const mapName = mapFile.slice(0, -4)
    const buf = await fs.readFile(`public/cs2d/maps/${mapName}.map`)
    const obj = new Parser(buf).parse()
    obj.mapHash = crypto.createHash('sha256').update(buf).digest('hex')
    obj.mapSize = buf.length

    try {
      const stat = await fs.stat(`public/cs2d/gfx/tiles/${obj.header.tileImg}`)
      obj.tilesetSize = stat.size
    } catch {
      obj.tilesetSize = 0
      console.warn(`Tileset Image ${obj.header.tileImg} doesnt exist for ${mapName}`)
      return;
    }

    try {
      const stat = await fs.stat(`public/cs2d/gfx/backgrounds/${obj.header.bgImg}`)
      obj.bgSize = stat.size
    } catch {
      obj.bgSize = 0
    }

    obj.resources = []
    for (const { type, x, y, str } of obj.entities) {
      if (type == 0) {
        obj.cam = [x, y]
      }
      if (![22, 23, 28].includes(type)) continue
      const resourcePath = str[0]?.replace(/\\/g, '/')
      if (!resourcePath || obj.resources.some(r => r.path === resourcePath)) continue

      let size = 0
      try {
        const stat = await fs.stat(`public/cs2d/${resourcePath}`)
        size = stat.size
      } catch {
        size = 0
      }
      obj.resources.push({ path: resourcePath, size })
    }

    obj.resources.sort((a, b) => a.size - b.size)


    obj.tm = Array.from({ length: obj.header.mapWidth }, () => new Array(obj.header.mapHeight).fill(0))
    for (let x = 0; x < obj.header.mapWidth; x++) {
      for (let y = 0; y < obj.header.mapHeight; y++) {
        const tileId = obj.map[x][y]
        const mode = obj.tileMode[tileId] ?? 0
        if (mode > 2) {
          obj.tm[x][y] = 0
        } else {
          obj.tm[x][y] = mode
        }
      }
    }

    obj.canvas = {
      map: obj.map,
      mapWidth: obj.header.mapWidth,
      mapHeight: obj.header.mapHeight,
      mapModifiers: obj.mapModifiers,
      tileSize: obj.header.use64pxTiles === 1 ? 64 : 32,
      tileMode: obj.tm,
      tileImg: obj.header.tileImg || '',
      bgImg: obj.bgSize > 0 && obj.header.bgImg ? obj.header.bgImg : null,
      bgRGB: `rgb(${obj.header.bgRed},${obj.header.bgGreen},${obj.header.bgBlue})`,
      cam: obj.cam || []
    }
    await redis.set(`map:${mapName}`, JSON.stringify(obj))

    const minimapPath = `public/cs2d/minimaps/${mapName}.webp`
    try {
      await fs.access(minimapPath)
    } catch {
      const content = await render.minimap(obj, mapName)
      await fs.writeFile(minimapPath, content)
      files++
    }
  }))

  await Promise.all(tasks)

  if (files === 0) return

  const elapsed = (Date.now() - startTime) / 1000
  const minutes = Math.floor(elapsed / 60)
  const seconds = (elapsed % 60).toFixed(2)
  const time = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  console.log(`Successfully rendered ${files} minimaps in ${time}`)
}

async function getAllMapNames() {
  const keys = await redis.keys('map:*')
  return keys
    .map(key => key.replace('map:', ''))
    .sort((a, b) => a.localeCompare(b))
}

async function getMap(name) {
  const data = await redis.get(`map:${name}`)
  return data ? JSON.parse(data) : null
}

module.exports = { loadAndRender, getAllMapNames, getMap }
