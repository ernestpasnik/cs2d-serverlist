const streams = require('./streams.js')
const { getUnixTimestamp } = require('./utils.js')
const leaderboards = {}

function parse(serverName, addr, sort, buf) {
  const d = new streams(buf, buf.length)
  const header = d.readLine()
  if (header !== 'userstats steam') {
    throw new Error("Invalid header: expected 'userstats steam'")
  }

  let usgnUsers = 0
  let steamUsers = 0
  const players = []
  while (true) {
    const name = d.readLine()
    if (!name.trim()) break

    const usertype = d.readByte()
    usertype === 0 ? usgnUsers++ : steamUsers++
    const userid = d.readLong()
    const score = d.readInt()
    const kills = d.readInt()
    const deaths = d.readInt()
    const assists = d.readInt()
    const mvps = d.readInt()
    const time = d.readInt()

    players.push({
      name,
      usertype,
      userid,
      score,
      kills,
      deaths,
      assists,
      mvps,
      time,
    })
  }

  switch (sort) {
    case 0:
      players.sort((a, b) => {
        const aScore = -(a.score + a.kills - a.deaths)
        const bScore = -(b.score + b.kills - b.deaths)
        return aScore - bScore
      })
      break
    case 1:
      players.sort((a, b) => {
        const aScore = -(a.assists + a.kills - a.deaths)
        const bScore = -(b.assists + b.kills - b.deaths)
        return aScore - bScore
      })
      break
    case 2:
      players.sort((a, b) => {
        const aScore = -(a.score + a.assists + a.deaths)
        const bScore = -(b.score + b.assists + b.deaths)
        return aScore - bScore
      })
      break
    default:
      break
  }

  leaderboards[addr] = {
    ts: getUnixTimestamp(),
    name: serverName,
    players: players.slice(0, 100),
    usgnUsers,
    steamUsers
  }
}

function getLeaderboard(addr) {
  return leaderboards[addr] || false
}

function getLeaderboards() {
  return leaderboards
}

module.exports = {
  parse,
  getLeaderboard,
  getLeaderboards
}
