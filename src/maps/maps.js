const fs = require('fs')
const crypto = require('crypto')
const redis = require('../utils/redis')
const Parser = require('./parser')
const Render = require('./render')
const render = new Render()

async function loadAndRender() {
  const mapsDir = 'public/cs2d/maps'
  if (!fs.existsSync(mapsDir)) {
    console.warn(`Maps directory "${mapsDir}" does not exist, skipping loading maps`)
    return
  }
  const minimaps = 'public/cs2d/minimaps'
  fs.mkdirSync(minimaps, { recursive: true })

  const keys = await redis.keys('map:*')
  if (keys.length) {
    await redis.del(...keys)
  }


  let parsedFiles = 0
  const start = performance.now()
  
  const allFiles = fs.readdirSync(mapsDir)
  const mapFiles = allFiles.filter(file => file.endsWith('.map'))
  for (const mapFile of mapFiles) {
    const mapName = mapFile.slice(0, -4)
    if (!/^[a-zA-Z0-9 _-]+$/.test(mapName)) {
      console.warn(`Skipping ${mapName} invalid name`)
      continue
    }
    const buffer = fs.readFileSync(`public/cs2d/maps/${mapName}.map`)
    const parsed = new Parser(buffer).parse()
    const obj = {}
    obj.name = mapName
    obj.mapHash = crypto.createHash('sha256').update(buffer).digest('hex')
    obj.mapSize = buffer.length
    obj.mapWidth = parsed.header.mapWidth
    obj.mapHeight = parsed.header.mapHeight
    obj.tileImg = parsed.header.tileImg
    const tileImgPath = `public/cs2d/gfx/tiles/${parsed.header.tileImg}`
    if (!fs.existsSync(tileImgPath)) {
      console.warn(`Tileset Image ${parsed.header.tileImg} doesn't exist for ${mapName}`)
      continue
    }

    obj.tileFileSize = fs.statSync(tileImgPath).size
    obj.tileCount = parsed.header.tileCount
    obj.bgImg = parsed.header.bgImg
    obj.bgSize = 0


    if (parsed.header.bgImg) {
      const bgImgPath = `public/cs2d/gfx/backgrounds/${parsed.header.bgImg}`
      if (fs.existsSync(bgImgPath)) {
        obj.bgSize = fs.statSync(bgImgPath).size
      }
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
        const stat = fs.statSync(`public/cs2d/${resourcePath}`)
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
    obj.entities = parsed.entities

    if (!fs.existsSync(`${minimaps}/${mapName}.webp`)) {
      const dataToSave = await render.minimap(parsed, mapName);
      fs.writeFileSync(`${minimaps}/${mapName}.webp`, dataToSave);
    }

    await redis.set(`map:${mapName}`, JSON.stringify(obj))
    parsedFiles++;
  }

  const ms = Math.round(performance.now() - start)
  console.log(`Parsed ${parsedFiles} map files in ${ms} ms`)
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
