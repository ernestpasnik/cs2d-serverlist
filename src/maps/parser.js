const Streams = require('../utils/streams')

class Parser {
  constructor(buffer) {
    this.buffer = new Streams(buffer)
  }

  parse() {
    const header = this.#readHeader()
    const tileMode = this.#readTileModes(header.tileCount)
    const tileHeights = this.#readTileHeights(header.saveTileHeights, header.tileCount)
    const [map, mapModifiers] = this.#readMap(header.mapWidth, header.mapHeight, header.useModifiers);
    const entities = this.#readEntities()

    return { header, tileMode, tileHeights, map, mapModifiers, entities }
  }

  #readHeader() {
    const b = this.buffer
    const header = {}

    header.header = b.readLine()
    const pattern = /^Unreal Software's (CS2D|Counter-Strike 2D) Map File( \(max\))?$/
    if (!pattern.test(header.header)) {
      throw new Error('This is not a valid CS2D map file')
    }

    header.scrollMap = b.readByte()
    header.useModifiers = b.readByte()
    header.saveTileHeights = b.readByte()
    header.use64pxTiles = b.readByte()
    b.offset += 6
    header.sysUptime = b.readInt()
    const authorUSGN = b.readInt()
    header.authorUSGN = authorUSGN === 0 ? 0 : authorUSGN - 51
    const daylightTime = b.readInt()
    header.daylightTime = daylightTime === 0 ? 0 : daylightTime - 1000
    b.offset += 28
    header.authorName = (b.readLine()).trim()
    header.programUsed = b.readLine().trim()
    for (let i = 0; i < 8; i++) b.readLine()
    header.infoString = b.readLine()
    header.tileImg = b.readLine().trim()
    header.tileCount = b.readByte() + 1
    header.mapWidth = b.readInt() + 1
    header.mapHeight = b.readInt() + 1
    header.bgImg = b.readLine().trim() || null
    header.bgScrollX = b.readInt()
    header.bgScrollY = b.readInt()
    header.bgRed = b.readByte()
    header.bgGreen = b.readByte()
    header.bgBlue = b.readByte()
    header.headerTest = b.readLine()

    return header
  }

  #readTileModes(tileCount) {
    const modes = []
    for (let i = 0; i < tileCount; i++) {
      modes.push(this.buffer.readByte())
    }
    return modes
  }

  #readTileHeights(saveTileHeights, tileCount) {
    const b = this.buffer
    const heights = []

    if (saveTileHeights > 0) {
      for (let i = 0; i < tileCount; i++) {
        if (saveTileHeights === 1) {
          heights.push(b.readInt())
        } else if (saveTileHeights === 2) {
          heights.push(b.readShort())
          b.readByte()
        }
      }
    }

    return heights
  }

  #readMap(width, height, useModifiers) {
    const b = this.buffer
    const map = Array.from({ length: width }, () => new Array(height))
    const mapModifiers = Array.from({ length: width }, () => new Array(height).fill(0))


    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        map[x][y] = b.readByte()
      }
    }

    if (useModifiers === 1) {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const mod = b.readByte()
          mapModifiers[x][y] = mod
          if ((mod & 64) || (mod & 128)) {
            if ((mod & 64) && (mod & 128)) {
              b.readLine()
            } else if ((mod & 64) || !(mod & 128)) {
              b.readByte()
            } else {
              b.readByte()
              b.readByte()
              b.readByte()
              b.readByte()
            }
          }
        }
      }
    }

    return [map, mapModifiers]
  }

  #readEntities() {
    const b = this.buffer
    const count = b.readInt()
    const entities = []

    for (let i = 0; i < count; i++) {
      const entity = {
        name: b.readLine(),
        type: b.readByte(),
        x: b.readInt(),
        y: b.readInt(),
        trigger: b.readLine(),
        int: [],
        str: []
      }

      for (let j = 0; j < 10; j++) {
        entity.int.push(b.readInt())
        entity.str.push(b.readLine())
      }

      entities.push(entity)
    }

    return entities
  }
}

module.exports = Parser
