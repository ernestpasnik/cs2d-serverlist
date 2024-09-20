module.exports = {
  bytesToSize: function (b) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (b === 0) return '0 B'
    const i = parseInt(Math.floor(Math.log(b) / Math.log(1024)))
    return Math.round((b / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  },
  secondsToUptime: function (s) {
    const secs = Math.round(s)
    const days = Math.floor(secs / (3600 * 24))
    const hours = Math.floor((secs % (3600 * 24)) / 3600)
    const minutes = Math.floor((secs % 3600) / 60)
    const seconds = secs % 60
    const d = days > 0 ? `${days} day${days !== 1 ? 's' : ''}, ` : ''
    const hh = hours.toString().padStart(2, '0')
    const mm = minutes.toString().padStart(2, '0')
    const ss = seconds.toString().padStart(2, '0')
    return `${d}${hh}:${mm}:${ss}`
  }
}
