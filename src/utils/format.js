const fs = require('node:fs')
const { flag } = require('country-emoji')

const SIZES = ['B', 'KB', 'MB', 'GB', 'TB']
const FULL_UNITS = [['year', 31557600], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]
const SHORT_UNITS = [['y', 31557600], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]

const unix = () => Math.floor(Date.now() / 1000)

function mtimeUnix(filepath) {
  try {
    return Math.floor(fs.statSync(filepath).mtimeMs / 1000)
  } catch {
    return unix()
  }
}

const formatTime = (seconds) => `${(seconds / 3600).toFixed(1)} h`

function timeAgo(ts, full = false) {
  const diff = Math.max(unix() - ts, 0)
  for (const [name, size] of full ? FULL_UNITS : SHORT_UNITS) {
    const value = Math.floor(diff / size)
    if (value) return full ? `${value} ${name}${value > 1 ? 's' : ''} ago` : `${value} ${name} ago`
  }
  return 'just now'
}

function bytesToSize(bytes) {
  if (!bytes) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZES.length - 1)
  return `${Number((bytes / 1024 ** i).toFixed(2))} ${SIZES[i]}`
}

function formatUptime(totalSeconds) {
  const secs = Math.round(totalSeconds)
  const d = Math.floor(secs / 86400)
  const h = String(Math.floor((secs % 86400) / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${d > 0 ? `${d}d, ` : ''}${h}:${m}:${s}`
}

const getEmojiByCountry = (country) => flag(country) || ''

module.exports = { unix, mtimeUnix, formatTime, timeAgo, bytesToSize, formatUptime, getEmojiByCountry }
