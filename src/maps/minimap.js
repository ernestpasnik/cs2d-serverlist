const sharp = require('sharp')

class Minimap {
  generate(parsed, square, outputPath = null, minWidthHeight = 0) {
    return new Promise((resolve, reject) => {
      try {
        const mapWidth = parsed.header.mapWidth
        const mapHeight = parsed.header.mapHeight
        const scale = 4

        let scaledWidth = mapWidth * scale
        let scaledHeight = mapHeight * scale
        const maxDim = Math.max(scaledWidth, scaledHeight)

        let finalWidth = square ? maxDim : scaledWidth
        let finalHeight = square ? maxDim : scaledHeight

        finalWidth = Math.max(minWidthHeight, finalWidth)
        finalHeight = Math.max(minWidthHeight, finalHeight)

        const offsetX = Math.floor((finalWidth - scaledWidth) / 2)
        const offsetY = Math.floor((finalHeight - scaledHeight) / 2)

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

        const tileModes = parsed.tileModes
        const map = parsed.map
        const imageData = Buffer.alloc(finalWidth * finalHeight * 4, 0)

        const drawBlock = (x, y, color) => {
          for (let dx = 0; dx < scale; dx++) {
            for (let dy = 0; dy < scale; dy++) {
              const px = offsetX + x * scale + dx
              const py = offsetY + y * scale + dy
              if (px < 0 || py < 0 || px >= finalWidth || py >= finalHeight) continue

              const idx = (py * finalWidth + px) * 4
              imageData[idx] = color[0]
              imageData[idx + 1] = color[1]
              imageData[idx + 2] = color[2]
              imageData[idx + 3] = color[3]
            }
          }
        }

        for (let x = 0; x < mapWidth; x++) {
          for (let y = 0; y < mapHeight; y++) {
            const tile = map[x][y]
            const tileMode = tileModes[tile] ?? 0

            let color = colors.default
            switch (tileMode) {
              case 1: color = colors.wall; break
              case 2: color = colors.obstacle; break
              case 14: color = colors.water; break
              case 50:
              case 51:
              case 52:
              case 53: color = colors.deadly; break
            }

            if (color !== colors.default) {
              drawBlock(x, y, color)
            }
          }
        }

        for (const entity of parsed.entities) {
          let color = null
          if (entity.type === 0) color = colors.t
          else if (entity.type === 1) color = colors.ct
          else if (entity.type === 5) color = colors.bspot

          if (color) {
            drawBlock(entity.x, entity.y, color)
          }
        }

        let image = sharp(imageData, {
          raw: {
            width: finalWidth,
            height: finalHeight,
            channels: 4
          }
        }).webp({ lossless: true })

        // Step 1: Trim the image first
        image = image.trim()

        // Step 2: Ensure minimum width/height
        image = image.ensureAlpha()  // Make sure there's an alpha channel for transparency

        // Step 3: If the image needs to be larger, we center it
        if (minWidthHeight > 0) {
          image = image.resize({
            width: Math.max(minWidthHeight, finalWidth),
            height: Math.max(minWidthHeight, finalHeight),
            fit: 'contain', // Ensure the image fits within the bounds without distorting
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
          })
        }

        if (outputPath) {
          image
            .toFile(outputPath)
            .then(() => resolve(outputPath))
            .catch(err => reject(new Error('Sharp save failed: ' + err.message)))
        } else {
          image
            .toBuffer()
            .then(resolve)
            .catch(err => reject(new Error('Sharp buffer failed: ' + err.message)))
        }

      } catch (err) {
        reject(new Error('Failed to generate minimap: ' + err.message))
      }
    })
  }
}

module.exports = Minimap
