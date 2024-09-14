'use strict'

class streams {
  constructor(buff) {
    this.offset = 0
    if (buff !== undefined) {
      this.buffer = buff
      this.length = buff.length
    } else {
      this.buffer = Buffer.allocUnsafe(1500)
      this.length = 1500
    }
  }

  readByte(offset = 0) {
    this.offset += offset
    if (this.offset >= this.length) return 0
    const val = this.buffer.readUInt8(this.offset)
    this.offset += 1
    return val
  }

  readShort(offset = 0) {
    this.offset += offset
    if (this.offset + 2 > this.length) return 0
    const val = this.buffer.readUInt16LE(this.offset)
    this.offset += 2
    return val
  }

  readInt(offset = 0) {
    this.offset += offset
    if (this.offset + 4 > this.length) return 0
    const val = this.buffer.readInt32LE(this.offset)
    this.offset += 4
    return val
  }

  readLong(offset = 0) {
    this.offset += offset
    if (this.offset + 8 > this.length) return 0
    const val = this.buffer.readBigInt64LE(this.offset)
    this.offset += 8
    return val
  }

  readFloat(offset = 0) {
    this.offset += offset
    if (this.offset + 4 > this.length) return 0
    const val = this.buffer.readFloatLE(this.offset)
    this.offset += 4
    return val
  }

  readDouble(offset = 0) {
    this.offset += offset
    if (this.offset + 8 > this.length) return 0
    const val = this.buffer.readDoubleLE(this.offset)
    this.offset += 8
    return val
  }

  readLine(offset = 0) {
    this.offset += offset
    if (this.offset >= this.length) return ''
    let val = ''
    while (true) {
      const n = this.readByte()
      if (n === 0 || n === 10) break
      if (n !== 13) val += String.fromCharCode(n)
    }
    return val
  }

  readString(length, encoding = 'latin1') {
    if (this.offset + length > this.length) return ''
    const val = this.buffer.slice(this.offset, this.offset + length).toString(encoding)
    this.offset += length
    return val
  }

  readStringNT(length, encoding = 'latin1') {
    if (this.offset + length > this.length) return ''
    const val = this.readString(length, encoding)
    this.offset += 1
    return val
  }

  remaining() {
    return this.length - this.offset
  }

  writeByte(val) {
    this.buffer.writeUInt8(val, this.offset)
    this.offset += 1
    return this.buffer
  }

  writeShort(val) {
    this.buffer.writeUInt16LE(val, this.offset)
    this.offset += 2
    return this.buffer
  }

  writeInt(val) {
    this.buffer.writeInt32LE(val, this.offset)
    this.offset += 4
    return this.buffer
  }

  writeLong(val) {
    this.buffer.writeBigInt64LE(val, this.offset)
    this.offset += 8
    return this.buffer
  }

  writeString(val, encoding) {
    if (encoding === undefined) {
      encoding = 'latin1'
    }
    this.buffer.write(val, this.offset, encoding)
    this.offset += val.length
    return this.buffer
  }

  writeStringNT(val, encoding) {
    if (encoding === undefined) {
      encoding = 'latin1'
    }
    this.buffer.write(val, this.offset, encoding)
    this.offset += val.length
    this.writeByte(0)
    return this.buffer
  }

  writeClose() {
    return this.buffer.slice(0, this.offset)
  }
}

module.exports = streams
