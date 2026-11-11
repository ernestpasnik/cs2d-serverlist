class Reader {
  constructor(buffer) {
    this.buffer = buffer
    this.length = buffer.length
    this.offset = 0
    this.overrun = false
  }

  remaining() {
    return this.length - this.offset
  }

  skip(count) {
    this.offset = Math.min(this.offset + count, this.length)
  }

  #take(count) {
    if (this.offset + count > this.length) {
      this.overrun = true
      this.offset = this.length
      return -1
    }
    const at = this.offset
    this.offset += count
    return at
  }

  readByte() {
    const at = this.#take(1)
    return at < 0 ? 0 : this.buffer[at]
  }

  readShort() {
    const at = this.#take(2)
    return at < 0 ? 0 : this.buffer.readUInt16LE(at)
  }

  readInt() {
    const at = this.#take(4)
    return at < 0 ? 0 : this.buffer.readInt32LE(at)
  }

  readInt64() {
    const at = this.#take(8)
    return at < 0 ? 0n : this.buffer.readBigInt64LE(at)
  }

  readBytes(count) {
    const at = this.#take(count)
    return at < 0 ? null : this.buffer.subarray(at, at + count)
  }

  readLine(encoding = 'latin1') {
    if (this.offset >= this.length) return ''
    const newline = this.buffer.indexOf(10, this.offset)
    const lineEnd = newline === -1 ? this.length : newline
    let textEnd = lineEnd
    if (textEnd > this.offset && this.buffer[textEnd - 1] === 13) textEnd--
    const value = this.buffer.toString(encoding, this.offset, textEnd)
    this.offset = Math.min(lineEnd + 1, this.length)
    return value
  }

  readSString(encoding = 'latin1') {
    const size = this.readByte()
    const at = this.#take(size)
    return at < 0 ? '' : this.buffer.toString(encoding, at, at + size)
  }
}

module.exports = Reader
