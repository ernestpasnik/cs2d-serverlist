const fs = require('fs')
const path = require('path')
const Parser = require('./parser')
const Minimap = require('./minimap')
const redis = require('../utils/redis')

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    const existingMap = await redis.exists(`map:${mapName}`)
    if (existingMap) return

    const buffer = fs.readFileSync(mapPath)
    const parsed = new Parser(buffer).parse()
    parsed.minimap = await new Minimap().generate(parsed)
    await redis.set(`map:${mapName}`, JSON.stringify(parsed))
  } catch (err) {
    console.error(mapName, err)
  }
}

const generateMinimapsForAllMaps = async (directory) => {
  try {
    const files = fs.readdirSync(directory)
    const mapFiles = files.filter(file => path.extname(file) === '.map')
    for (const mapFile of mapFiles) {
      const mapPath = path.join(directory, mapFile)
      const mapName = path.basename(mapFile, '.map')
      await generateAndStoreMinimap(mapName, mapPath)
    }
  } catch (err) {
    console.error(err)
  }
}

if (process.env.CS2D_DIRECTORY) {
  const mapsPath = path.join(process.env.CS2D_DIRECTORY, 'maps')
  generateMinimapsForAllMaps(mapsPath)
}
