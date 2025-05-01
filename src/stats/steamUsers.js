const https = require('https')

let userCount = null

const getUserCount = () => {
  https.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=666220', (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        if (json && json.response && typeof json.response.player_count === 'number') {
          userCount = json.response.player_count
        } else {
          console.log('Player count not found in response')
        }
      } catch (err) {
        console.log('Error parsing JSON:', err.message)
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
  } else {
    console.log('Player count not available yet')
    return null
  }
}

module.exports = {
  getUserCountAPI,
  getUserCount,
  userCount
}
