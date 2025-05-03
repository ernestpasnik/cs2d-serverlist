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
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  if (days > 0) {
    return `${days} d`
  } else if (hours > 0) {
    return `${hours} h`
  } else if (minutes > 0) {
    return `${minutes} min`
  } else {
    return `${seconds} s`
  }
}

function timeAgo(ts) {
  const s = getUnixTimestamp() - ts
  const u = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ]

  for (const [name, sec] of u) {
    const v = Math.floor(s / sec);
    if (v) return `${v} ${name}${v > 1 ? 's' : ''} ago`
  }

  return 'just now'
}

function escapeQuotes(str) {
  return (str || '').replace(/"/g, '\\"')
}

module.exports = {
  getUnixTimestamp,
  getMTimeUnix,
  formatTime,
  timeAgo,
  escapeQuotes
}
