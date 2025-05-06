const redis = require('./utils/redis')
const streams = require('./utils/streams')
const { getUnixTimestamp } = require('./utils/utils')
const { JSONParse, JSONStringify } = require('json-with-bigint')

async function parse(serverName, addr, sort, buf) {
  const startTime = performance.now()

  const d = new streams(buf, buf.length)
  const header = d.readLine()
  if (header !== 'userstats steam') {
    console.log(`[${addr}] Invalid file upload attempt`)
    throw new Error('Invalid file')
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
      time
    })
  }

  switch (sort) {
    case 0:
      players.sort((a, b) => (b.score + b.kills - b.deaths) - (a.score + a.kills - a.deaths))
      break
    case 1:
      players.sort((a, b) => (b.assists + b.kills - b.deaths) - (a.assists + a.kills - a.deaths))
      break
    case 2:
      players.sort((a, b) => (b.score + b.assists + b.deaths) - (a.score + a.assists + a.deaths))
      break
  }

  const leaderboard = {
    ts: getUnixTimestamp(),
    sortMode: sort,
    name: serverName,
    players: players.slice(0, 100),
    usgnUsers,
    steamUsers
  }

  await redis.set(`leaderboard:${addr}`, JSONStringify(leaderboard))

  const endTime = performance.now()
  const duration = Math.round(endTime - startTime)
  console.log(`[${addr}] Leaderboard parsed in ${duration} ms`)
  return duration
}

async function getLeaderboard(addr) {
  const json = await redis.get(`leaderboard:${addr}`)
  return json ? JSONParse(json) : false
}

async function getLeaderboards() {
  const keys = await redis.keys('leaderboard:*')
  if (!keys.length) return {}

  const values = await redis.mget(...keys)
  return keys.reduce((acc, key, i) => {
    acc[key.replace('leaderboard:', '')] = JSONParse(values[i])
    return acc
  }, {})
}

module.exports = {
  parse,
  getLeaderboard,
  getLeaderboards
}
