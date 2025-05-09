const fs = require('fs')
const mapParser = require('./utils/mapParser')

const mapPath = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\CS2D\\maps\\de_dust.map'

console.time('mapParsing')

try {
  const buffer = fs.readFileSync(mapPath)
  const parser = new mapParser(buffer)
  const map = parser.parse()
  console.log(map)
} catch (err) {
  console.error('Failed to load map:', err.message)
}

console.timeEnd('mapParsing')
