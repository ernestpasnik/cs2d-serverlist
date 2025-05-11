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

function timeAgo(ts, full = false) {
  let s = getUnixTimestamp() - ts
  const uFull = [
    ['year', 365.25 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ]
  const uShort = [
    ['y', 365.25 * 24 * 60 * 60],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1]
  ]
  const u = full ? uFull : uShort
  for (const [name, sec] of u) {
    const v = Math.floor(s / sec)
    if (v) {
      return v + ' ' + (full ? name : (name.length > 1 ? name[0] : name)) + (v > 1 && full ? 's' : '') + ' ago'
    }
  }
  return 'just now'
}

const bytesToSize = (b) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) return '0 B'
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return `${Math.round(b / Math.pow(1024, i))} ${sizes[i]}`
}

function formatUptime(uptime, ms = false) {
  if (ms) uptime = Math.floor(uptime / 1000)

  const d = Math.floor(uptime / (3600 * 24))
  const h = String(Math.floor((uptime % (3600 * 24)) / 3600)).padStart(2, '0')
  const m = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0')
  const s = String(uptime % 60).padStart(2, '0')

  if (d > 1) return `${d}d ${h}:${m}:${s}`
  return `${h}:${m}:${s}`
}

function getEmojiByCountry(country) {
  return flag(country)
}

module.exports = {
  getUnixTimestamp,
  getMTimeUnix,
  formatTime,
  timeAgo,
  bytesToSize,
  formatUptime,
  getEmojiByCountry
}
