const fs = require('fs')
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
    const buffer = await fs.readFile(`public/cs2d/maps/${mapName}.map`)
    const parsed = new Parser(buffer).parse()
    const obj = {}
    obj.name = mapName
    obj.mapHash = crypto.createHash('sha256').update(buffer).digest('hex')
    obj.mapSize = buffer.length
    obj.mapWidth = parsed.header.mapWidth
    obj.mapHeight = parsed.header.mapHeight
    obj.tileImg = parsed.header.tileImg
    if (existsSync(`public/cs2d/gfx/tiles/${parsed.header.tileImg}`)) {
      obj.tilesetSize = statSync(`public/cs2d/gfx/tiles/${parsed.header.tileImg}`).size
    } else {
      obj.tilesetSize = 0
      console.warn(`Tileset Image ${parsed.header.tileImg} doesnt exist for ${mapName}`)
      return;
    }
    obj.tileCount = parsed.header.tileCount
    obj.bgImg = parsed.header.bgImg
    if (existsSync(`public/cs2d/gfx/backgrounds/${parsed.header.bgImg}`)) {
      obj.bgSize = statSync(`public/cs2d/gfx/backgrounds/${parsed.header.bgImg}`).size
    } else {
      obj.bgSize = 0
    }
    obj.bgColor = `rgb(${parsed.header.bgRed}, ${parsed.header.bgGreen}, ${parsed.header.bgBlue})`
    obj.programUsed = parsed.header.programUsed
    obj.authorName = parsed.header.authorName
    obj.authorUSGN = parsed.header.authorUSGN
    obj.resources = []
    for (const { type, x, y, str } of parsed.entities) {
      if (type == 0) {
        obj.cam = [x, y]
      }
      if (![22, 23, 28].includes(type)) continue
      const resourcePath = str[0]?.trim().replace(/\\/g, '/')
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

    obj.map = parsed.map
    obj.tileMode = Array.from({ length: parsed.header.mapWidth }, () => new Array(parsed.header.mapHeight).fill(0))
    for (let x = 0; x < parsed.header.mapWidth; x++) {
      for (let y = 0; y < parsed.header.mapHeight; y++) {
        const tileId = parsed.map[x][y]
        const mode = parsed.tileMode[tileId] ?? 0
        if (mode > 2) {
          obj.tileMode[x][y] = 0
        } else {
          obj.tileMode[x][y] = mode
        }
      }
    }
    obj.mapModifiers = parsed.mapModifiers
    obj.tileSize = parsed.header.use64pxTiles === 1 ? 64 : 32
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
