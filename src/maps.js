const fs = require('fs')
const path = require('path')
const minimap = require('./maps/minimap')
const redis = require('./utils/redis')

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    // Check if the minimap already exists in Redis
    const existingMinimap = await redis.get(`minimap:${mapName}`)
    if (existingMinimap) return

    // If not in Redis, generate the minimap
    const generator = new minimap(mapPath)
    const minimapImage = await generator.generate()
    await redis.set(`minimap:${mapName}`, minimapImage)
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
