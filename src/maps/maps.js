const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Parser = require('./parser')
const Minimap = require('./minimap')
const redis = require('../utils/redis')
const { bytesToSize } = require('../utils/utils')
require('./mapexport')

const maplist = []

function getSize(path) {
  const bytes = fs.existsSync(path) ? fs.statSync(path).size : 0
  const size = bytesToSize(bytes)
  return { bytes, size }
}

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    const buffer = fs.readFileSync(mapPath)
    const parsed = new Parser(buffer).parse()

    const minimapPath = path.join(mapsDir, `${mapName}-minimap.webp`)
    if (!fs.existsSync(minimapPath)) {
      try {
        const startTime = Date.now()
        const webpBuffer = await new Minimap().generate(parsed)
        fs.writeFileSync(minimapPath, webpBuffer)
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`[✓] ${mapName}-minimap.webp rendered in ${elapsed}s`)
      } catch (e) {
        console.error(`[!] Failed to render ${mapName}-minimap.webp:`, e.message)
      }
    }

    parsed.resources = []
    parsed.tilesetSize = getSize(`${process.env.CS2D_DIRECTORY}/gfx/tiles/${parsed.header.tilesetImage}`)
    parsed.backgroundSize = getSize(`${process.env.CS2D_DIRECTORY}/gfx/backgrounds/${parsed.header.backgroundImage}`)
    parsed.file = {
      name: `${mapName}.map`,
      ...getSize(`${process.env.CS2D_DIRECTORY}/maps/${mapName}.map`),
      hash: crypto.createHash('sha256').update(buffer).digest('hex')
    }
    parsed.entities.forEach(v => {
      if (v.type == 11) {
        parsed.nobuying = true
      } else if (v.type == 12) {
        parsed.noweapons = true
      } else if ([22, 23, 28].includes(v.type)) {
        const path = v.str[0].replace(/\\/g, '/')
        if (!path) return
        if (parsed.resources.some(r => r.path === path)) return
        parsed.resources.push({
          path,
          ...getSize(`${process.env.CS2D_DIRECTORY}/${path}`)
        })
      } else if (v.type == 70) {
        parsed.teleporters = true
      }
    })
    parsed.resources.sort((a, b) => b.bytes - a.bytes)
    await redis.set(`map:${mapName}`, JSON.stringify(parsed))
  } catch (err) {
    console.error(mapName, err)
  }
}

const generateMinimapsForAllMaps = async (directory) => {
  let i = 0
  const startTime = performance.now()
  try {
    const files = fs.readdirSync(directory)
    const mapFiles = files.filter(file => path.extname(file) === '.map')
    for (const mapFile of mapFiles) {
      const mapPath = path.join(directory, mapFile)
      const mapName = path.basename(mapFile, '.map')
      maplist.push(mapName)

      // Skip generation if the map data is already cached in Redis
      //if (await redis.exists(`map:${mapName}`)) continue
      await generateAndStoreMinimap(mapName, mapPath)
      i++
    }
  } catch (err) {
    console.error(err)
  }

  const endTime = performance.now()
  const duration = Math.round(endTime - startTime)
  if (i > 0) console.log(`Parsed ${i} maps in ${duration} ms`)
}

const cs2dPath = process.env.CS2D_DIRECTORY || 'public/cs2d'
const mapsDir = path.join(cs2dPath, 'maps')
fs.mkdirSync(mapsDir, { recursive: true })
generateMinimapsForAllMaps(mapsDir)

module.exports = {
  maplist
}
