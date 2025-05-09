const fs = require('fs')
const { createCanvas } = require('canvas')
const { PNG } = require('pngjs')
const CS2DMapParser = require('./parser')

class Minimap {
  constructor(mapPath) {
    this.mapPath = mapPath
  }

  generate() {
    return new Promise((resolve, reject) => {
      try {
        const buffer = fs.readFileSync(this.mapPath)
        const parser = new CS2DMapParser(buffer)
        const parsed = parser.parse()

        const mapWidth = parsed.header.mapWidth
        const mapHeight = parsed.header.mapHeight
        const scaledWidth = mapWidth * 3
        const scaledHeight = mapHeight * 3

        const canvas = createCanvas(scaledWidth, scaledHeight)
        const ctx = canvas.getContext('2d')

        const colors = {
          wall: '#FFFFFF',
          obstacle: '#7D7D7D',
          default: '#323232',
          water: '#006496',
          deadly: '#FF0000'
        }

        const tileModes = parsed.tileModes
        const map = parsed.map

        for (let x = 0; x < mapWidth; x++) {
          for (let y = 0; y < mapHeight; y++) {
            const tile = map[x][y]
            const tileMode = tileModes[tile] ?? 0  // Fallback to default mode if out of range

            let color
            switch (tileMode) {
              case 1:
                color = colors.wall
                break
              case 2:
                color = colors.obstacle
                break
              case 14:
                color = colors.water
                break
              case 50:
              case 51:
              case 52:
              case 53:
                color = colors.deadly
                break
              default:
                color = colors.default
            }

            ctx.fillStyle = color
            ctx.fillRect(x * 3, y * 3, 3, 3)
          }
        }

        // Canvas outputs BGRA, PNG wants RGBA
        const raw = canvas.toBuffer('raw')
        const rgba = Buffer.alloc(raw.length)

        for (let i = 0; i < raw.length; i += 4) {
          rgba[i] = raw[i + 2]     // R
          rgba[i + 1] = raw[i + 1] // G
          rgba[i + 2] = raw[i]     // B
          rgba[i + 3] = raw[i + 3] // A
        }

        const png = new PNG({
          width: scaledWidth,
          height: scaledHeight
        })

        png.data = rgba

        const chunks = []
        png.pack()
          .on('data', chunk => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)))
          .on('error', err => reject(err))

      } catch (err) {
        reject(new Error('Failed to generate minimap: ' + err.message))
      }
    })
  }
}

module.exports = Minimap
