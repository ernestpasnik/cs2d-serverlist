const fs = require('fs')

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
  const s = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function escapeQuotes(str) {
  return str.replace(/"/g, '\\"');
}

module.exports = {
  getMTimeUnix,
  formatTime,
  timeAgo,
  escapeQuotes
}
