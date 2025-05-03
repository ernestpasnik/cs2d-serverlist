const https = require('https')

let PlayersOnline = {
  steam: null,
  unrealSoftware: null
}

const fetch = url => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''

      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

const getSteamPlayersOnline = async () => {
  try {
    const data = await fetch('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=666220')
    const json = JSON.parse(data)
    if (json && json.response) {
      PlayersOnline.steam = json.response.player_count
    } else {
      console.log('Steam: Player count not found in response')
    }
  } catch (err) {
    console.log(`Error fetching Steam player count: ${err.message}`)
  }
}

const getUnrealSoftwarePlayersOnline = async () => {
  try {
    const html = await fetch('https://unrealsoftware.de/users.php?p=1')
    const match = html.match(/(\d+)\s+Users?/)
    PlayersOnline.unrealSoftware = match ? parseInt(match[1], 10) : 0
  } catch (err) {
    console.log(`Error fetching Unreal Software player count: ${err.message}`)
  }
}

const startPolling = () => {
  getSteamPlayersOnline()
  getUnrealSoftwarePlayersOnline()
  setInterval(getSteamPlayersOnline, 60000)
  setInterval(getUnrealSoftwarePlayersOnline, 60000)
}

const getPlayersOnline = () => {
  return {
    steam: PlayersOnline.steam !== null ? PlayersOnline.steam : 'N/A',
    unrealSoftware: PlayersOnline.unrealSoftware !== null ? PlayersOnline.unrealSoftware : 'N/A'
  }
}

startPolling()

module.exports = {
  getPlayersOnline
}
