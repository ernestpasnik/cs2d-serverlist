const fs = require('fs')
const { flag } = require('country-emoji')

function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function getMTimeUnix(filepath) {
  try {
    return Math.floor(fs.statSync(filepath).mtime.getTime() / 1000)
  } catch (err) {
    console.error(`Failed to stat file: ${filepath}`, err)
    return 0
  }
}

function formatTime(s) {
  const hours = s / 3600
  return `${hours.toFixed(1)} h`
}

function timeAgo(ts) {
  const s = getUnixTimestamp() - ts
  const u = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]
  for (const [name, sec] of u) {
    const v = Math.floor(s / sec)
    if (v) return v + name + ' ago'
  }
  return 'just now'
}

function getEmojiByCountry(country) {
  return flag(country)
}

module.exports = {
  getUnixTimestamp,
  getMTimeUnix,
  formatTime,
  timeAgo,
  getEmojiByCountry
}
