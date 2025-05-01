function formatTime(s) {
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  if (days > 0) {
    return `${days}d`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}min`
  } else {
    return `${seconds}s`
  }
}

function timeAgo(unixTimestamp) {
  const now = Date.now()
  const timestamp = unixTimestamp < 1e12 ? unixTimestamp * 1000 : unixTimestamp
  const diffSeconds = Math.floor((now - timestamp) / 1000)

  if (diffSeconds < 5) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min ago`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
  return `${Math.floor(diffSeconds / 86400)}d ago`
}

module.exports = { formatTime, timeAgo }