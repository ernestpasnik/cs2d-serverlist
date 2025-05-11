const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Parser = require('./parser')
const Minimap = require('./minimap')
const redis = require('../utils/redis')

const maplist = []

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    const buffer = fs.readFileSync(mapPath)
    const parsed = new Parser(buffer).parse()
    parsed.minimap = await new Minimap().generate(parsed)
    parsed.sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
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
      if (await redis.exists(`map:${mapName}`)) continue
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
