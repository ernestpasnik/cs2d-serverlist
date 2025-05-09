const streams = require('./streams')

class mapParser {
  constructor(buffer) {
    this.stream = new streams(buffer)
  }

  parse() {
    const s = this.stream
    const map = {}

    map.header = s.readLine()
    map.scrollmap = s.readByte()
    map.modifiers = s.readByte()
    map.tileheights = s.readByte()
    map.use64pxtiles = s.readByte()
    s.offset += 6
    map.sysuptime = s.readInt()
    map.authorusgn = s.readInt()
    map.daylighttime = s.readInt()
    s.offset += 28
    map.authorname = s.readLine()
    map.programused = s.readLine()
    s.offset += 16
    map.string = s.readLine()
    map.tilesetimage = s.readLine()
    map.tiles = s.readByte()
    map.width = s.readInt()
    map.height = s.readInt()
    map.background = s.readLine()
    map.bgscrollx = s.readInt()
    map.bgscrolly = s.readInt()
    map.bgcolorred = s.readByte()
    map.bgcolorgreen = s.readByte()
    map.bgcolorblue = s.readByte()
    map.headertest = s.readLine()

    map.tile = []
    for (let i = 0; i <= map.tiles; i++) {
      map.tile[i] = s.readByte()
    }

    if (map.tileheights > 0) {
      for (let i = 0; i <= map.tiles; i++) {
        if (map.tileheights == 1) {
          s.readInt()
        } else if (map.tileheights == 2) {
          s.readShort()
          s.readByte()
        }
      }
    }

    map.map = []
    for (let x = 0; x <= map.width; x++) {
      map.map[x] = []
      for (let y = 0; y <= map.height; y++) {
        map.map[x][y] = s.readByte()
      }
    }

    if (map.modifiers == 1) {
      for (let x = 0; x <= map.width; x++) {
        for (let y = 0; y <= map.height; y++) {
          let mod = s.readByte()
          if ((mod & 64) || (mod & 128)) {
            if ((mod & 64) && (mod & 128)) {
              s.readLine()
            } else if ((mod & 64) || !(mod & 128)) {
              s.readByte()
            } else {
              s.readByte()
              s.readByte()
              s.readByte()
              s.readByte()
            }
          }
        }
      }
    }

    map.entities = s.readInt()
    map.entity = []
    for (let i = 0; i < map.entities; i++) {
      const entity = {
        name: s.readLine(),
        type: s.readByte(),
        x: s.readInt(),
        y: s.readInt(),
        trigger: s.readLine(),
        integer: [],
        string: []
      }

      for (let j = 0; j < 10; j++) {
        entity.integer.push(s.readInt())
        entity.string.push(s.readLine())
      }

      map.entity.push(entity)
    }

    return map
  }
}

module.exports = mapParser
