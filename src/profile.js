function findPlayerByUserId(userId, allLeaderboards) {
  const results = []

  for (const [addr, data] of Object.entries(allLeaderboards)) {
    for (let i = 0; i < data.players.length; i++) {
      const player = data.players[i]
      if (player.userid == userId) {
        results.push({
          server: {
            address: addr,
            name: data.name,
            rankedUsers: data.usgnUsers + data.steamUsers
          },
          player,
          rank: i
        })
      }
    }
  }

  return results
}

function calculatePlayerStats(playerData) {
  let totalKills = 0
  let totalDeaths = 0
  let totalAssists = 0
  let totalMvps = 0
  let totalTime = 0

  playerData.forEach(item => {
    totalKills += item.player.kills
    totalDeaths += item.player.deaths
    totalAssists += item.player.assists
    totalMvps += item.player.mvps
    totalTime += item.player.time
  })

  return {
    totalKills,
    totalDeaths,
    totalAssists,
    totalMvps,
    totalTime
  }
}

module.exports = {
  findPlayerByUserId,
  calculatePlayerStats
}
