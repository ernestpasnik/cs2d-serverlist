const Reader = require('../../protocol/reader')

const HEADER_PATTERN = /^Unreal Software's (CS2D|Counter-Strike 2D) Map File( \(max\))?$/
const MAX_CELLS = 25_000_000
const MAX_ENTITIES = 200_000

function readHeader(r) {
  const header = { header: r.readLine() }
  if (!HEADER_PATTERN.test(header.header)) throw new Error('Not a valid CS2D map file')

  header.scrollMap = r.readByte()
  header.useModifiers = r.readByte()
  header.saveTileHeights = r.readByte()
  header.use64pxTiles = r.readByte()
  r.skip(6)
  header.sysUptime = r.readInt()
  const usgn = r.readInt()
  header.authorUSGN = usgn === 0 ? 0 : usgn - 51
  const daylight = r.readInt()
  header.daylightTime = daylight === 0 ? 0 : daylight - 1000
  r.skip(28)
  header.authorName = r.readLine().trim()
  header.programUsed = r.readLine().trim()
  for (let i = 0; i < 8; i++) r.readLine()
  header.infoString = r.readLine()
  header.tileImg = r.readLine().trim()
  header.tileCount = r.readByte() + 1
  header.mapWidth = r.readInt() + 1
  header.mapHeight = r.readInt() + 1
  header.bgImg = r.readLine().trim() || null
  header.bgScrollX = r.readInt()
  header.bgScrollY = r.readInt()
  header.bgRed = r.readByte()
  header.bgGreen = r.readByte()
  header.bgBlue = r.readByte()
  header.headerTest = r.readLine()

  if (r.overrun) throw new Error('Truncated map header')
  if (header.mapWidth < 1 || header.mapHeight < 1 || header.mapWidth * header.mapHeight > MAX_CELLS) {
    throw new Error('Invalid map dimensions')
  }
  return header
}

function readTileModes(r, count) {
  const bytes = r.readBytes(count)
  if (!bytes) throw new Error('Truncated tile data')
  return Array.from(bytes)
}

function readTileHeights(r, mode, count) {
  const heights = []
  for (let i = 0; i < count; i++) {
    if (mode === 1) {
      heights.push(r.readInt())
    } else if (mode === 2) {
      heights.push(r.readShort())
      r.readByte()
    }
  }
  return heights
}

function readMap(r, width, height, useModifiers) {
  const map = new Array(width)
  for (let x = 0; x < width; x++) {
    const column = r.readBytes(height)
    if (!column) throw new Error('Truncated map data')
    map[x] = Array.from(column)
  }

  const modifiers = Array.from({ length: width }, () => new Array(height).fill(0))
  if (useModifiers === 1) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const mod = r.readByte()
        modifiers[x][y] = mod
        if ((mod & 64) && (mod & 128)) r.readLine()
        else if (mod & 64) r.readByte()
        else if (mod & 128) r.skip(4)
      }
    }
    if (r.overrun) throw new Error('Truncated map modifiers')
  }
  return [map, modifiers]
}

function readEntities(r) {
  const count = Math.min(Math.max(r.readInt(), 0), MAX_ENTITIES)
  const entities = []
  for (let i = 0; i < count; i++) {
    const entity = {
      name: r.readLine(),
      type: r.readByte(),
      x: r.readInt(),
      y: r.readInt(),
      trigger: r.readLine(),
      int: [],
      str: []
    }
    for (let j = 0; j < 10; j++) {
      entity.int.push(r.readInt())
      entity.str.push(r.readLine())
    }
    if (r.overrun) break
    entities.push(entity)
  }
  return entities
}

function parseMap(buffer) {
  const r = new Reader(buffer)
  const header = readHeader(r)
  const tileMode = readTileModes(r, header.tileCount)
  const tileHeights = header.saveTileHeights > 0 ? readTileHeights(r, header.saveTileHeights, header.tileCount) : []
  const [map, mapModifiers] = readMap(r, header.mapWidth, header.mapHeight, header.useModifiers)
  const entities = readEntities(r)
  return { header, tileMode, tileHeights, map, mapModifiers, entities }
}

module.exports = { parseMap }
