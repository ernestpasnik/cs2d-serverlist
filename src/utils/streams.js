class Streams {
  constructor(buff, size) {
    this.offset = 0
    this.buffer = buff instanceof Buffer ? buff : Buffer.allocUnsafe(1500)
    this.length = buff instanceof Buffer ? size || buff.length : 0
    this.capacity = this.buffer.length
  }
  
  _ensureCapacity(bytesNeeded) {
    if (this.offset + bytesNeeded > this.capacity) {
      let newCapacity = this.capacity * 2
      while (this.offset + bytesNeeded > newCapacity) {
        newCapacity *= 2
      }
      const newBuffer = Buffer.allocUnsafe(newCapacity)
      this.buffer.copy(newBuffer, 0, 0, this.length)
      this.buffer = newBuffer
      this.capacity = newCapacity
    }
  }
  
  skip(count) {
    this.offset = Math.min(this.offset + count, this.length)
  }
  
  readByte() {
    if (this.offset >= this.length) return 0
    const val = this.buffer.readUInt8(this.offset)
    this.offset += 1
    return val
  }
  
  readShort() {
    if (this.offset + 2 > this.length) return 0
    const val = this.buffer.readUInt16LE(this.offset)
    this.offset += 2
    return val
  }
  
  readInt() {
    if (this.offset + 4 > this.length) return 0
    const val = this.buffer.readInt32LE(this.offset)
    this.offset += 4
    return val
  }
  
  readLong() {
    if (this.offset + 8 > this.length) return 0
    const val = this.buffer.readBigInt64LE(this.offset)
    this.offset += 8
    return val
  }
  
  readFloat() {
    if (this.offset + 4 > this.length) return 0
    const val = this.buffer.readFloatLE(this.offset)
    this.offset += 4
    return val
  }
  
  readDouble() {
    if (this.offset + 8 > this.length) return 0
    const val = this.buffer.readDoubleLE(this.offset)
    this.offset += 8
    return val
  }
  
  readLine(encoding = 'ascii') {
    if (this.offset >= this.length) return ''
    
    let endOfLine = -1
    for (let i = this.offset; i < this.length; i++) {
      if (this.buffer[i] === 10) {
        endOfLine = i
        break
      }
    }
    
    if (endOfLine === -1) {
      const val = this.buffer.slice(this.offset, this.length).toString(encoding)
      this.offset = this.length
      return val
    }
    
    const sliceEnd = endOfLine
    let textEnd = sliceEnd
    
    if (sliceEnd > this.offset && this.buffer[sliceEnd - 1] === 13) {
      textEnd = sliceEnd - 1
    }
    
    const val = this.buffer.slice(this.offset, textEnd).toString(encoding)
    
    this.offset = endOfLine + 1
    
    return val
  }
  
  readSString(encoding = 'ascii') {
    if (this.offset + 1 > this.length) return ''
    const length = this.readByte()
    if (this.offset + length > this.length) return ''
    
    const val = this.buffer.slice(this.offset, this.offset + length).toString(encoding)
    this.offset += length
    return val
  }
  
  readString(encoding = 'ascii') {
    if (this.offset + 2 > this.length) return ''
    const length = this.readShort()
    if (this.offset + length > this.length) return ''
    
    const val = this.buffer.slice(this.offset, this.offset + length).toString(encoding)
    this.offset += length
    return val
  }
  
  writeByte(val) {
    this._ensureCapacity(1)
    this.buffer.writeUInt8(val, this.offset)
    this.offset += 1
    this.length = Math.max(this.length, this.offset)
  }
  
  writeShort(val) {
    this._ensureCapacity(2)
    this.buffer.writeUInt16LE(val, this.offset)
    this.offset += 2
    this.length = Math.max(this.length, this.offset)
  }
  
  writeInt(val) {
    this._ensureCapacity(4)
    this.buffer.writeInt32LE(val, this.offset)
    this.offset += 4
    this.length = Math.max(this.length, this.offset)
  }
  
  writeLong(val) {
    this._ensureCapacity(8)
    this.buffer.writeBigInt64LE(BigInt(val), this.offset)
    this.offset += 8
    this.length = Math.max(this.length, this.offset)
  }
  
  writeFloat(val) {
    this._ensureCapacity(4)
    this.buffer.writeFloatLE(val, this.offset)
    this.offset += 4
    this.length = Math.max(this.length, this.offset)
  }
  
  writeDouble(val) {
    this._ensureCapacity(8)
    this.buffer.writeDoubleLE(val, this.offset)
    this.offset += 8
    this.length = Math.max(this.length, this.offset)
  }
  
  writeLine(val, encoding = 'ascii') {
    const stringLength = Buffer.byteLength(val, encoding)
    this._ensureCapacity(stringLength + 1)
    
    this.buffer.write(val, this.offset, encoding)
    this.offset += stringLength
    
    this.writeByte(10)
    
    this.length = Math.max(this.length, this.offset)
  }
  
  writeSString(val, encoding = 'ascii') {
    const stringLength = Buffer.byteLength(val, encoding)
    if (stringLength > 255) {
      throw new Error('String too long for 8-bit length prefix (max 255 bytes).')
    }
    
    this._ensureCapacity(1 + stringLength)
    this.writeByte(stringLength)
    
    this.buffer.write(val, this.offset, stringLength, encoding)
    this.offset += stringLength
    this.length = Math.max(this.length, this.offset)
  }
  
  writeString(val, encoding = 'ascii') {
    const stringLength = Buffer.byteLength(val, encoding)
    if (stringLength > 65535) {
      throw new Error('String too long for 16-bit length prefix (max 65535 bytes).')
    }
    
    this._ensureCapacity(2 + stringLength)
    this.writeShort(stringLength)
    
    this.buffer.write(val, this.offset, stringLength, encoding)
    this.offset += stringLength
    this.length = Math.max(this.length, this.offset)
  }
  
  getSize() {
    return this.length
  }
  
  getCapacity() {
    return this.capacity
  }
  
  remaining() {
    return this.length - this.offset
  }
  
  writeClose() {
    return this.buffer.slice(0, this.offset)
  }
}

module.exports = Streams