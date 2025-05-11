const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Parser = require('./parser')
const Minimap = require('./minimap')
const redis = require('../utils/redis')
const { bytesToSize } = require('../utils/utils')

const maplist = []

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    const buffer = fs.readFileSync(mapPath)
    const parsed = new Parser(buffer).parse()
    parsed.minimap = await new Minimap().generate(parsed)
    parsed.sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
    parsed.resources = []

    parsed.entities.forEach(v => {
      if (v.type == 11) {
        parsed.nobuying = true
      } else if (v.type == 12) {
        parsed.noweapons = true
      } else if ([22, 23, 28].includes(v.type)) {
        const path = v.settings.string[0].replace(/\\/g, '/')
        if (!path) return

        const exists = parsed.resources.some(r => r.path === path)
        if (exists) return

        const p = `${process.env.CS2D_DIRECTORY}/${path}`
        const bytes = fs.existsSync(p) ? fs.statSync(p).size : 0
        const size = bytesToSize(bytes)
        parsed.resources.push({ path, bytes, size })
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

function loadMaps() {
  if (process.env.CS2D_DIRECTORY) {
    const mapsPath = path.join(process.env.CS2D_DIRECTORY, 'maps')
    generateMinimapsForAllMaps(mapsPath)
  }
}

module.exports = {
  loadMaps,
  maplist
}
