const https = require('https')

let userCount = null

const getUserCount = () => {
  https.get('https://unrealsoftware.de/users.php?p=1', (res) => {
    let html = ''

    res.on('data', (chunk) => {
      html += chunk
    })

    res.on('end', () => {
      const match = html.match(/(\d+)\s+Users?/)
      if (match) {
        userCount = parseInt(match[1], 10)
      } else {
        userCount = 0
      }
    })
  }).on('error', (err) => {
    console.log(`Error fetching player count: ${err.message}`)
  })
}

setInterval(getUserCount, 60000)
getUserCount()

const getUserCountAPI = () => {
  if (userCount !== null) {
    return userCount
  }
  return 'N/A'
}

module.exports = {
  getUserCountAPI
}
