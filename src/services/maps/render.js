const sharp = require('sharp')

const SCALE = 4
const rgba = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0

const COLORS = {
  wall: rgba(255, 255, 255),
  obstacle: rgba(125, 125, 125),
  water: rgba(0, 100, 150),
  deadly: rgba(255, 0, 0),
  t: rgba(237, 81, 65),
  ct: rgba(76, 163, 255),
  bspot: rgba(255, 255, 123)
}

function tileColor(mode) {
  switch (mode) {
    case 1: return COLORS.wall
    case 2: return COLORS.obstacle
    case 14: return COLORS.water
    case 50:
    case 51:
    case 52:
    case 53: return COLORS.deadly
    default: return 0
  }
}

function entityColor(type) {
  switch (type) {
    case 0: return COLORS.t
    case 1: return COLORS.ct
    case 5: return COLORS.bspot
    default: return 0
  }
}

async function renderMinimap({ header, tileMode, map, entities }) {
  const cols = header.mapWidth
  const rows = header.mapHeight
  const width = cols * SCALE
  const height = rows * SCALE
  const pixels = new Uint32Array(width * height)

  const paint = (x, y, color) => {
    for (let dy = 0; dy < SCALE; dy++) {
      const start = (y * SCALE + dy) * width + x * SCALE
      pixels.fill(color, start, start + SCALE)
    }
  }

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const color = tileColor(tileMode[map[x][y]] ?? 0)
      if (color) paint(x, y, color)
    }
  }

  for (const entity of entities) {
    const color = entityColor(entity.type)
    if (color && entity.x >= 0 && entity.y >= 0 && entity.x < cols && entity.y < rows) paint(entity.x, entity.y, color)
  }

  return sharp(Buffer.from(pixels.buffer), { raw: { width, height, channels: 4 } })
    .trim()
    .webp({ lossless: true })
    .toBuffer()
}

module.exports = { renderMinimap }
