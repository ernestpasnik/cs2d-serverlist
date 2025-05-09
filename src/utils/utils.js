const fs = require('fs')

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
  const u = [
    ['y', 31536000],
    ['m', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['min', 60],
    ['s', 1]
  ]

  for (const [name, sec] of u) {
    const v = Math.floor(s / sec)
    if (v) return `${v} ${name} ago`
  }

  return 'just now'
}

module.exports = {
  getUnixTimestamp,
  getMTimeUnix,
  formatTime,
  timeAgo
}
