const https = require('https')

let PlayersOnline = {
  steam: null,
  unrealSoftware: null
}

const getSteamPlayersOnline = () => {
  https.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=666220', (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        if (json && json.response) {
          PlayersOnline.steam = json.response.player_count
        } else {
          console.log('Steam: Player count not found in response')
        }
      } catch (err) {
        console.log('Error parsing Steam JSON:', err.message)
      }
    })
  }).on('error', (err) => {
    console.log(`Error fetching Steam player count: ${err.message}`)
  })
}

const getUnrealSoftwarePlayersOnline = () => {
  https.get('https://unrealsoftware.de/users.php?p=1', (res) => {
    let html = ''

    res.on('data', (chunk) => {
      html += chunk
    })

    res.on('end', () => {
      const match = html.match(/(\d+)\s+Users?/)
      if (match) {
        PlayersOnline.unrealSoftware = parseInt(match[1], 10)
      } else {
        PlayersOnline.unrealSoftware = 0
      }
    })
  }).on('error', (err) => {
    console.log(`Error fetching Unreal Software player count: ${err.message}`)
  })
}

setInterval(getSteamPlayersOnline, 60000)
setInterval(getUnrealSoftwarePlayersOnline, 60000)

getSteamPlayersOnline()
getUnrealSoftwarePlayersOnline()

const getPlayersOnline = () => {
  return {
    steam: PlayersOnline.steam !== null ? PlayersOnline.steam : 'N/A',
    unrealSoftware: PlayersOnline.unrealSoftware !== null ? PlayersOnline.unrealSoftware : 'N/A'
  }
}

module.exports = {
    getPlayersOnline
}
