const Redis = require('ioredis')
const streams = require('./streams')
const { getUnixTimestamp } = require('./utils')

const redis = new Redis()

async function parse(serverName, addr, sort, buf) {
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
  }

  const leaderboard = {
    ts: getUnixTimestamp(),
    name: serverName,
    players: players.slice(0, 100),
    usgnUsers,
    steamUsers
  }

  await redis.set(`leaderboard:${addr}`, JSON.stringify(leaderboard))
}

async function getLeaderboard(addr) {
  const json = await redis.get(`leaderboard:${addr}`)
  return json ? JSON.parse(json) : false
}

async function getLeaderboards() {
  const keys = await redis.keys('leaderboard:*')
  if (!keys.length) return {}

  const values = await redis.mget(...keys)
  return keys.reduce((acc, key, i) => {
    acc[key.replace('leaderboard:', '')] = JSON.parse(values[i])
    return acc
  }, {})
}

module.exports = {
  parse,
  getLeaderboard,
  getLeaderboards
}
