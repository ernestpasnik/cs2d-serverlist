const fs = require('fs').promises
const path = require('path')
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

async function loadAndRender(cs2dDir) {
  let files = 0
  const startTime = Date.now()
  const mapsDir = path.join(cs2dDir, 'maps')

  try {
    await fs.access(cs2dDir)
    await fs.access(mapsDir)
  } catch {
    return
  }

  const minimaps = 'public/cs2d/minimaps'
  const mapexports = 'public/cs2d/mapexports'

  await fs.mkdir(minimaps, { recursive: true })
  await fs.mkdir(mapexports, { recursive: true })

  const allFiles = await fs.readdir(mapsDir)
  const mapFiles = allFiles.filter(file => file.endsWith('.map'))

  const limit = pLimit(4)

  const tasks = mapFiles.map(mapFile => limit(async () => {
    const mapPath = path.join(mapsDir, mapFile)
    const mapName = path.parse(mapFile).name

    const buf = await fs.readFile(mapPath)
    const obj = new Parser(buf).parse()

    obj.mapHash = crypto.createHash('sha256').update(buf).digest('hex')

    const mapStats = await fs.stat(mapPath)
    obj.mapSize = mapStats.size

    let fullPath = path.join(cs2dDir, 'gfx', 'tiles', obj.header.tilesetImage)
    try {
      const stat = await fs.stat(fullPath)
      obj.tilesetSize = stat.size
    } catch {
      obj.tilesetSize = 0
    }

    fullPath = path.join(cs2dDir, 'gfx', 'backgrounds', obj.header.backgroundImage)
    try {
      const stat = await fs.stat(fullPath)
      obj.bgSize = stat.size
    } catch {
      obj.bgSize = 0
    }

    obj.resources = []
    for (const { type, str } of obj.entities) {
      if (![22, 23, 28].includes(type)) continue
      const resourcePath = str[0]?.replace(/\\/g, '/')
      if (!resourcePath || obj.resources.some(r => r.path === resourcePath)) continue

      fullPath = path.join(cs2dDir, resourcePath)
      let size = 0
      try {
        const stat = await fs.stat(fullPath)
        size = stat.size
      } catch {
        size = 0
      }
      obj.resources.push({ path: resourcePath, size })
    }

    obj.resources.sort((a, b) => a.size - b.size)

    await redis.set(`map:${mapName}`, JSON.stringify(obj))

    const minimapPath = path.join(minimaps, `${mapName}.webp`)
    try {
      await fs.access(minimapPath)
    } catch {
      const content = await render.minimap(obj, mapName)
      await fs.writeFile(minimapPath, content)
      files++
    }

    const mapexportPath = path.join(mapexports, `${mapName}.webp`)
    try {
      await fs.access(mapexportPath)
    } catch {
      const content = await render.mapexport(obj, mapName, cs2dDir)
      await fs.writeFile(mapexportPath, content)
      files++
    }
  }))

  await Promise.all(tasks)

  if (files === 0) return

  const elapsed = (Date.now() - startTime) / 1000
  const minutes = Math.floor(elapsed / 60)
  const seconds = (elapsed % 60).toFixed(2)
  const time = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  console.log(`Successfully rendered ${files} files in ${time}`)
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
