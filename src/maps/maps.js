const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Parser = require('./parser')
const Minimap = require('./minimap')
const redis = require('../utils/redis')

const maplist = []

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const minimapExists = (outputPath) => {
  return fs.existsSync(outputPath)
}

const generateAndStoreMinimap = async (mapName, mapPath, square) => {
  try {
    // const existingMap = await redis.exists(`map:${mapName}`)
    // if (existingMap) return

    const buffer = fs.readFileSync(mapPath)
    const parsed = new Parser(buffer).parse()

    const outputDir = 'public/minimap'
    ensureDirectoryExists(outputDir)

    const squareMinimapPath = `${outputDir}/${mapName}-square.webp`
    const minimapPath = `${outputDir}/${mapName}.webp`

    // It's for discord
    if (!minimapExists(squareMinimapPath)) {
      await new Minimap().generate(parsed, true, squareMinimapPath, 256)
    }
    
    if (!minimapExists(minimapPath)) {
      await new Minimap().generate(parsed, false, minimapPath)
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    parsed.sha256 = hash
    await redis.set(`map:${mapName}`, JSON.stringify(parsed))
  } catch (err) {
    console.error(mapName, err)
  }
}

const generateMinimapsForAllMaps = async (directory) => {
  try {
    const files = fs.readdirSync(directory)
    const mapFiles = files.filter(file => path.extname(file) === '.map')
    console.time('generateMinimapsForAllMaps')
    for (const mapFile of mapFiles) {
      const mapPath = path.join(directory, mapFile)
      const mapName = path.basename(mapFile, '.map')
      await generateAndStoreMinimap(mapName, mapPath, false)
      maplist.push(mapName)
    }
    console.timeEnd('generateMinimapsForAllMaps')
  } catch (err) {
    console.error(err)
  }
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
