const sharp = require('sharp')

class Render {
  async minimap(dat, mapName) {
    try {
      const mapWidth = dat.header.mapWidth
      const mapHeight = dat.header.mapHeight
      const scale = 4
      const scaledWidth = mapWidth * scale
      const scaledHeight = mapHeight * scale

      const colors = {
        wall: [255, 255, 255, 255],
        obstacle: [125, 125, 125, 255],
        default: [0, 0, 0, 0],
        water: [0, 100, 150, 255],
        deadly: [255, 0, 0, 255],
        t: [237, 81, 65, 255],
        ct: [76, 163, 255, 255],
        bspot: [255, 255, 123, 255]
      }

      const tileModes = dat.tileModes
      const map = dat.map

      const imageData = Buffer.allocUnsafe(scaledWidth * scaledHeight * 4)

      function setPixel(x, y, color) {
        const idx = (y * scaledWidth + x) * 4
        imageData[idx] = color[0]
        imageData[idx + 1] = color[1]
        imageData[idx + 2] = color[2]
        imageData[idx + 3] = color[3]
      }

      for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
          const tile = map[x][y]
          const tileMode = tileModes[tile] ?? 0

          let color
          switch (tileMode) {
            case 1: color = colors.wall; break
            case 2: color = colors.obstacle; break
            case 14: color = colors.water; break
            case 50:
            case 51:
            case 52:
            case 53: color = colors.deadly; break
            default: color = colors.default
          }

          for (let dx = 0; dx < scale; dx++) {
            for (let dy = 0; dy < scale; dy++) {
              setPixel(x * scale + dx, y * scale + dy, color)
            }
          }
        }
      }

      for (const entity of dat.entities) {
        let color
        if (entity.type === 0) {
          color = colors.t
        } else if (entity.type === 1) {
          color = colors.ct
        } else if (entity.type === 5) {
          color = colors.bspot
        } else {
          continue
        }

        for (let dx = 0; dx < scale; dx++) {
          for (let dy = 0; dy < scale; dy++) {
            setPixel(entity.x * scale + dx, entity.y * scale + dy, color)
          }
        }
      }

      return await sharp(imageData, {
        raw: {
          width: scaledWidth,
          height: scaledHeight,
          channels: 4
        }
      }).trim().webp({ lossless: true }).toBuffer()
    } catch (e) {
      console.error(`Error rendering minimap for ${mapName}: ${e.message}`)
    }
  }
}

module.exports = Render
