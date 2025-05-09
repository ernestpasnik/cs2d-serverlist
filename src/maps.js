const fs = require('fs')
const path = require('path')
const minimap = require('./maps/minimap')
const maps = {}

const generateAndStoreMinimap = async (mapName, mapPath) => {
  try {
    const generator = new minimap(mapPath)
    maps[mapName] = await generator.generate()
  } catch (err) {
    console.error(mapName, err)
  }
}

const generateMinimapsForAllMaps = async (directory) => {
  try {
    console.time('Minimaps generation completed')
    const files = fs.readdirSync(directory)
    const mapFiles = files.filter(file => path.extname(file) === '.map')

    let parsedMapsCount = 0
    for (const mapFile of mapFiles) {
      const mapPath = path.join(directory, mapFile)
      const mapName = path.basename(mapFile, '.map')
      await generateAndStoreMinimap(mapName, mapPath)
      parsedMapsCount++
    }

    console.timeEnd('Minimaps generation completed')
    console.log(`Total maps parsed: ${parsedMapsCount}`)
  } catch (err) {
    console.error(err)
  }
}

if (process.env.CS2D_DIRECTORY) {
  const mapsPath = path.join(process.env.CS2D_DIRECTORY, 'maps')
  generateMinimapsForAllMaps(mapsPath)
}

module.exports = { maps }
