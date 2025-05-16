const sharp = require('sharp')
const { createCanvas, loadImage } = require('canvas')

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
            case 1:  color = colors.wall; break
            case 2:  color = colors.obstacle; break
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

  async mapexport(dat, mapName, cs2dDir) {
    try {
      const TILE_SIZE = dat.header.use64pxTiles === 1 ? 64 : 32
      const { floor, walls, obstacles } = this._generateLayers(dat.map, dat.tileModes)

      const width = floor[0].length * TILE_SIZE
      const height = floor.length * TILE_SIZE
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')

      const originalTileset = await loadImage(`${cs2dDir}/gfx/tiles/${dat.header.tilesetImage}`)
      const tempCanvas = createCanvas(originalTileset.width, originalTileset.height)
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(originalTileset, 0, 0)
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imgData.data
      for (let i = 0, len = data.length; i < len; i += 4) {
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 255) {
          data[i + 3] = 0
        }
      }
      tempCtx.putImageData(imgData, 0, 0)

      const tilesetCols = tempCanvas.width / TILE_SIZE
      const drawTile = async (tileId, x, y) => {
        const sx = (tileId % tilesetCols) * TILE_SIZE
        const sy = Math.floor(tileId / tilesetCols) * TILE_SIZE

        ctx.save()

        const px = x * TILE_SIZE + TILE_SIZE / 2
        const py = y * TILE_SIZE + TILE_SIZE / 2
        ctx.translate(px, py)

        if (dat.header.useModifiers) {
          switch (dat.modifiers[x][y]) {
            case 1:
              ctx.rotate(Math.PI / 2)
              break
            case 2:
              ctx.rotate(Math.PI)
              break
            case 3:
              ctx.rotate(-Math.PI / 2)
              break
          }
        }

        ctx.drawImage(tempCanvas, sx, sy, TILE_SIZE, TILE_SIZE, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE)
        ctx.restore()
      }

      for (let y = 0; y < floor.length; y++) {
        for (let x = 0; x < floor[y].length; x++) {
          await drawTile(floor[y][x], x, y, 0, 0)
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      for (let y = 0; y < walls.length; y++) {
        for (let x = 0; x < walls[y].length; x++) {
          if (x + 1 < floor[y].length && floor[y][x + 1] == -1) continue
          if (y + 1 < floor.length && x + 1 < floor[y + 1].length && floor[y + 1][x + 1] == -1) continue
          if (y + 1 < floor.length && floor[y + 1][x] == -1) continue
          if (walls[y][x]) ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE)
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      for (let y = 0; y < obstacles.length; y++) {
        for (let x = 0; x < obstacles[y].length; x++) {
          if (x + 1 < floor[y].length && floor[y][x + 1] == -1) continue
          if (y + 1 < floor.length && x + 1 < floor[y + 1].length && floor[y + 1][x + 1] == -1) continue
          if (y + 1 < floor.length && floor[y + 1][x] == -1) continue
          if (obstacles[y][x]) ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE)
        }
      }

      for (let y = 0; y < walls.length; y++) {
        for (let x = 0; x < walls[y].length; x++) {
          const id = walls[y][x]
          if (id) await drawTile(id, x, y)
        }
      }

      for (let y = 0; y < obstacles.length; y++) {
        for (let x = 0; x < obstacles[y].length; x++) {
          const id = obstacles[y][x]
          if (id) await drawTile(id, x, y)
        }
      }

      const imageData = ctx.getImageData(0, 0, width, height)
      return await sharp(imageData.data, {
        raw: {
          width: width,
          height: height,
          channels: 4
        }
      }).trim().webp({ lossless: true }).toBuffer()
    } catch (e) {
      console.error(`Error rendering mapexport for ${mapName}: ${e.message}`)
    }
  }

  _generateLayers(map, tileModes) {
    const height = map[0].length
    const width = map.length

    const floor = Array.from({ length: height }, () => Array(width).fill(0))
    const walls = Array.from({ length: height }, () => Array(width).fill(0))
    const obstacles = Array.from({ length: height }, () => Array(width).fill(0))

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = map[x][y]
        const mode = tileModes[tileId]

        if (tileId == 0) {
          floor[y][x] = -1
        } else if (mode == 1) {
          walls[y][x] = tileId
        } else if (mode == 2) {
          obstacles[y][x] = tileId
        } else {
          floor[y][x] = tileId
        }
      }
    }

    return { floor, walls, obstacles }
  }
}

module.exports = Render
