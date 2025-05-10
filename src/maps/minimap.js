const { createCanvas } = require('canvas')
const { PNG } = require('pngjs')

class Minimap {
  generate(parsed) {
    return new Promise((resolve, reject) => {
      try {
        const mapWidth = parsed.header.mapWidth
        const mapHeight = parsed.header.mapHeight
        const scaledWidth = mapWidth * 2
        const scaledHeight = mapHeight * 2

        const canvas = createCanvas(scaledWidth, scaledHeight)
        const ctx = canvas.getContext('2d')

        const colors = {
          wall: '#FFFFFF',
          obstacle: '#7D7D7D',
          default: 'transparent',
          water: '#006496',
          deadly: '#FF0000'
        }

        const tileModes = parsed.tileModes
        const map = parsed.map

        for (let x = 0; x < mapWidth; x++) {
          for (let y = 0; y < mapHeight; y++) {
            const tile = map[x][y]
            const tileMode = tileModes[tile] ?? 0

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
            ctx.fillRect(x * 2, y * 2, 2, 2)
          }
        }

        parsed.entities.forEach(v => {
          if (v.type == 0) {
            ctx.fillStyle = '#ed5141' // Terrorist
          } else if (v.type == 1) {
            ctx.fillStyle = '#4ca3ff' // Counter-Terrorist
          } else {
            return
          }
          ctx.fillRect(v.x * 2, v.y * 2, 2, 2)
        })

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
