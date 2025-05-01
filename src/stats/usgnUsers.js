const https = require('https')

let userCount = null
const userCountRegex = /(\d+)\s+Users?/

const getUserCount = () => {
  https.get('https://unrealsoftware.de/users.php?p=1', (res) => {
    let html = ''

    res.on('data', (chunk) => {
      html += chunk
    })

    res.on('end', () => {
      const match = html.match(userCountRegex)
      if (match) {
        userCount = match[1]
      } else {
        console.log('User count not found')
      }
    })
  }).on('error', (err) => {
    console.log(`Error fetching user count: ${err.message}`)
  })
}

setInterval(getUserCount, 60000)
getUserCount()

const getUserCountAPI = () => {
  if (userCount !== null) {
    return userCount
  } else {
    console.log('User count not available yet')
    return null
  }
}

module.exports = {
  getUserCountAPI,
  getUserCount,
  userCount
}
