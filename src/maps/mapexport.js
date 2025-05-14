const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createCanvas, loadImage } = require('canvas')
const Parser = require('./parser')

const cs2dPath = process.env.CS2D_DIRECTORY || 'public/cs2d'
const mapsDir = path.join(cs2dPath, 'maps')
fs.mkdirSync(mapsDir, { recursive: true })

const mapFiles = fs.readdirSync(mapsDir).filter(file => file.endsWith('.map'))

async function renderMap(mapName) {
  const mapFilePath = path.join(mapsDir, mapName)
  const baseName = path.basename(mapName, '.map')

  try {
    const buffer = fs.readFileSync(mapFilePath)
    const parser = new Parser(buffer)
    const { header, map, modifiers, tileModes } = parser.parse()
    const TILE_SIZE = header.use64pxTiles === 1 ? 64 : 32

    const tilesetPath = path.join(cs2dPath, 'gfx', 'tiles', header.tilesetImage)
    if (!fs.existsSync(tilesetPath)) {
      console.error(`Error: The tileset ${tilesetPath} does not exist.`)
      return
    }

    const generateLayers = (map, tileModes) => {
      const height = map[0].length
      const width = map.length

      const floorLayer = Array.from({ length: height }, () => Array(width).fill(0))
      const wallLayer = Array.from({ length: height }, () => Array(width).fill(0))
      const obstacleLayer = Array.from({ length: height }, () => Array(width).fill(0))

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tileId = map[x][y]
          const mode = tileModes[tileId]

          if (tileId == 0) {
            floorLayer[y][x] = -1
          } else if ([1, 3, 5].includes(mode)) {
            wallLayer[y][x] = tileId
          } else if ([2, 4].includes(mode)) {
            obstacleLayer[y][x] = tileId
          } else {
            floorLayer[y][x] = tileId
          }
        }
      }

      return { floorLayer, wallLayer, obstacleLayer }
    }

    const { floorLayer, wallLayer, obstacleLayer } = generateLayers(map, tileModes)
    const width = floorLayer[0].length * TILE_SIZE
    const height = floorLayer.length * TILE_SIZE

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const tileset = await loadImage(tilesetPath)
    const tilesetCols = tileset.width / TILE_SIZE

    const drawTile = async (tileId, x, y, alpha = 1, dx = 0, dy = 0, modifiers) => {
      const temp = createCanvas(TILE_SIZE, TILE_SIZE)
      const tctx = temp.getContext('2d')

      const sx = (tileId % tilesetCols) * TILE_SIZE
      const sy = Math.floor(tileId / tilesetCols) * TILE_SIZE

      tctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE)

      const imgData = tctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE)
      const data = imgData.data

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 255) {
          data[i + 3] = 0
        }
      }

      tctx.putImageData(imgData, 0, 0)

      ctx.save()
      ctx.globalAlpha = alpha

      const px = x * TILE_SIZE + dx + TILE_SIZE / 2
      const py = y * TILE_SIZE + dy + TILE_SIZE / 2
      ctx.translate(px, py)

      const mod = modifiers?.[x]?.[y] ?? 0
      if (mod === 1) ctx.rotate(Math.PI / 2)
      else if (mod === 2) ctx.rotate(Math.PI)
      else if (mod === 3) ctx.rotate(-Math.PI / 2)

      ctx.drawImage(temp, -TILE_SIZE / 2, -TILE_SIZE / 2)
      ctx.restore()
    }

    const startTime = Date.now()

    for (let y = 0; y < floorLayer.length; y++) {
      for (let x = 0; x < floorLayer[y].length; x++) {
        await drawTile(floorLayer[y][x], x, y, 1, 0, 0, modifiers)
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    for (let y = 0; y < wallLayer.length; y++) {
      for (let x = 0; x < wallLayer[y].length; x++) {
        if (x + 1 < floorLayer[y].length && floorLayer[y][x + 1] == -1) continue;
        if (y + 1 < floorLayer.length && x + 1 < floorLayer[y + 1].length && floorLayer[y + 1][x + 1] == -1) continue;
        if (y + 1 < floorLayer.length && floorLayer[y + 1][x] == -1) continue;
        if (wallLayer[y][x]) ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE)
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    for (let y = 0; y < obstacleLayer.length; y++) {
      for (let x = 0; x < obstacleLayer[y].length; x++) {
        if (x + 1 < floorLayer[y].length && floorLayer[y][x + 1] == -1) continue;
        if (y + 1 < floorLayer.length && x + 1 < floorLayer[y + 1].length && floorLayer[y + 1][x + 1] == -1) continue;
        if (y + 1 < floorLayer.length && floorLayer[y + 1][x] == -1) continue;
        if (obstacleLayer[y][x]) ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE)
      }
    }

    for (let y = 0; y < wallLayer.length; y++) {
      for (let x = 0; x < wallLayer[y].length; x++) {
        const id = wallLayer[y][x]
        if (id) await drawTile(id, x, y, 1, 0, 0, modifiers)
      }
    }

    for (let y = 0; y < obstacleLayer.length; y++) {
      for (let x = 0; x < obstacleLayer[y].length; x++) {
        const id = obstacleLayer[y][x]
        if (id) await drawTile(id, x, y, 1, 0, 0, modifiers)
      }
    }

    // Compress directly from canvas buffer to WebP using sharp
    const webpBuffer = await sharp(canvas.toBuffer('image/png'))
      .trim()
      .webp({ lossless: true })
      .toBuffer()

    const outputWebPPath = path.join(mapsDir, `${baseName}.webp`)
    fs.writeFileSync(outputWebPPath, webpBuffer)


    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[✓] ${baseName}.webp rendered in ${elapsed}s`)
  } catch (e) {
    console.error(`[!] Failed to render ${mapName}:`, e.message)
  }
}

async function main() {
  for (const mapFile of mapFiles) {
    const parsed = path.parse(mapFile)
    const webpPath = path.join(mapsDir, `${parsed.name}.webp`)

    if (!fs.existsSync(webpPath)) {
      await renderMap(mapFile)
    }
  }
}

main()
