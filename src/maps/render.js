const sharp = require('sharp')
const { createCanvas, loadImage } = require('canvas')

class Render {
  constructor() {
    this.shadowCanvas = null
  }

  async ensureShadowCanvas() {
    if (this.shadowCanvas === null) {
      console.log('loading shadow canvas...')
      const shadowSheet = await loadImage('public/shadowmap.png')
      this.shadowCanvas = createCanvas(shadowSheet.width, shadowSheet.height)
      const ctx = this.shadowCanvas.getContext('2d')
      ctx.drawImage(shadowSheet, 0, 0)

      const imgData = ctx.getImageData(0, 0, this.shadowCanvas.width, this.shadowCanvas.height)
      ctx.putImageData(imgData, 0, 0)
    }
  }

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

  async mapexport(dat, mapName, cs2dDir) {
    try {
      const TILE_SIZE = dat.header.use64pxTiles === 1 ? 64 : 32
      const { floor, walls, obstacles, zdr } = this._generateLayers(dat.map, dat.tileModes)

      await this.ensureShadowCanvas()

      const drawShadow = (col, row, x, y) => {
        const sx = col * TILE_SIZE
        const sy = row * TILE_SIZE
        ctx.save()
        ctx.globalAlpha = 0.8
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(
          this.shadowCanvas,
          sx, sy, TILE_SIZE, TILE_SIZE,
          x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE
        )
        ctx.restore()
      }



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

      function getShadowTile(leftTopTile, topTile, leftTile) {
        for (const [lt, t, l, shadow] of combinations) {
          if (leftTopTile === lt && topTile === t && leftTile === l) return shadow
        }
        return null
      }


      let leftTopTile
      let topTile
      let leftTile

      //leftTop, top, left
      const TILE_FLOOR = 0
      const TILE_WALL = 1
      const TILE_OBSTACLE = 2
      const combinations = [
        [TILE_FLOOR, TILE_FLOOR, TILE_FLOOR, null],
        [TILE_FLOOR, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 4 }],
        [TILE_FLOOR, TILE_FLOOR, TILE_WALL, { col: 0, row: 4 }],
        [TILE_FLOOR, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 1 }],
        [TILE_FLOOR, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
        [TILE_FLOOR, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
        [TILE_FLOOR, TILE_WALL, TILE_FLOOR, { col: 0, row: 1 }],
        [TILE_FLOOR, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
        [TILE_FLOOR, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
        [TILE_WALL, TILE_FLOOR, TILE_FLOOR, { col: 0, row: 2 }],
        [TILE_WALL, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 7 }],
        [TILE_WALL, TILE_FLOOR, TILE_WALL, { col: 0, row: 3 }],
        [TILE_WALL, TILE_WALL, TILE_FLOOR, { col: 0, row: 0 }],
        [TILE_WALL, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
        [TILE_WALL, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
        [TILE_WALL, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 8 }],
        [TILE_WALL, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
        [TILE_WALL, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
        [TILE_OBSTACLE, TILE_FLOOR, TILE_FLOOR, { col: 1, row: 2 }],
        [TILE_OBSTACLE, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 3 }],
        [TILE_OBSTACLE, TILE_FLOOR, TILE_WALL, { col: 0, row: 7 }],
        [TILE_OBSTACLE, TILE_WALL, TILE_FLOOR, { col: 0, row: 8 }],
        [TILE_OBSTACLE, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
        [TILE_OBSTACLE, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
        [TILE_OBSTACLE, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 0 }],
        [TILE_OBSTACLE, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
        [TILE_OBSTACLE, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
      ]

      for (let y = 1; y < floor.length; y++) {
        for (let x = 1; x < floor[y].length; x++) {
          if (floor[y][x] == -1) continue;
          leftTopTile = zdr[y - 1]?.[x - 1] ?? 0
          topTile = zdr[y - 1]?.[x] ?? 0
          leftTile = zdr[y]?.[x - 1] ?? 0
          if (leftTopTile == 0 && topTile == 0 && leftTile == 0) continue;
          const shadowTile = getShadowTile(leftTopTile, topTile, leftTile)
          if (shadowTile) {
            drawShadow(shadowTile.col, shadowTile.row, x, y)
          }
        }
      }

      for (let y = 0; y < walls.length; y++) {
        for (let x = 0; x < walls[y].length; x++) {
          let id = walls[y][x]
          if (id) await drawTile(id, x, y)
          id = obstacles[y][x]
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
    const zdr = Array.from({ length: height }, () => Array(width).fill(0))

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = map[x][y]
        const mode = tileModes[tileId]
        if (tileId == 0) {
          floor[y][x] = -1
          zdr[y][x] = 0
        } else if (mode == 1) {
          walls[y][x] = tileId
          zdr[y][x] = 1
        } else if (mode == 2) {
          obstacles[y][x] = tileId
          zdr[y][x] = 2
        } else {
          floor[y][x] = tileId
          zdr[y][x] = 0
        }
      }
    }

    return { floor, walls, obstacles, zdr }
  }
}

module.exports = Render