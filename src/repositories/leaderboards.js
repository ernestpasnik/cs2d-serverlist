const db = require('../db')

const upsertBoard = db.prepare(`
  INSERT INTO leaderboards (addr, name, sort_mode, ts, usgn_users, steam_users) VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(addr) DO UPDATE SET name = excluded.name, sort_mode = excluded.sort_mode, ts = excluded.ts,
    usgn_users = excluded.usgn_users, steam_users = excluded.steam_users
`)
const clearPlayers = db.prepare('DELETE FROM leaderboard_players WHERE addr = ?')
const insertPlayer = db.prepare(`
  INSERT INTO leaderboard_players (addr, rank, name, usertype, userid, score, kills, deaths, assists, mvps, time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const selectBoard = db.prepare(`
  SELECT name, sort_mode AS sortMode, ts, usgn_users AS usgnUsers, steam_users AS steamUsers FROM leaderboards WHERE addr = ?
`)
const selectPlayers = db.prepare(`
  SELECT name, usertype, userid, score, kills, deaths, assists, mvps, time
  FROM leaderboard_players WHERE addr = ? ORDER BY rank LIMIT ?
`)
const selectRecent = db.prepare(`
  SELECT addr, name, ts, sort_mode AS sortMode, usgn_users AS usgnUsers, steam_users AS steamUsers
  FROM leaderboards ORDER BY ts DESC LIMIT ?
`)
const selectByUser = db.prepare(`
  SELECT p.addr, p.rank, p.name, p.usertype, p.userid, p.score, p.kills, p.deaths, p.assists, p.mvps, p.time,
    l.name AS serverName, l.usgn_users AS usgnUsers, l.steam_users AS steamUsers
  FROM leaderboard_players p JOIN leaderboards l ON l.addr = p.addr
  WHERE p.userid = ? ORDER BY p.rank
`)

const save = db.transaction((board) => {
  upsertBoard.run(board.addr, board.name, board.sortMode, board.ts, board.usgnUsers, board.steamUsers)
  clearPlayers.run(board.addr)
  board.players.forEach((p, rank) => {
    insertPlayer.run(board.addr, rank, p.name, p.usertype, p.userid, p.score, p.kills, p.deaths, p.assists, p.mvps, p.time)
  })
})

function find(addr, limit = -1) {
  const board = selectBoard.get(addr)
  if (!board) return null
  return { ...board, players: selectPlayers.all(addr, limit) }
}

function findPlayer(userid, usertype = null) {
  const rows = selectByUser.all(userid)
  if (!rows.length) return []
  const type = usertype ?? rows[0].usertype
  return rows
    .filter((row) => row.usertype === type)
    .map((row) => ({
      server: { address: row.addr, name: row.serverName, rankedUsers: row.usgnUsers + row.steamUsers },
      player: {
        name: row.name,
        usertype: row.usertype,
        userid: row.userid,
        score: row.score,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        mvps: row.mvps,
        time: row.time
      },
      rank: row.rank
    }))
}

function summarizePlayer(entries) {
  const total = { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalMvps: 0, totalTime: 0 }
  for (const { player } of entries) {
    total.totalKills += player.kills
    total.totalDeaths += player.deaths
    total.totalAssists += player.assists
    total.totalMvps += player.mvps
    total.totalTime += player.time
  }
  return total
}

module.exports = { save, find, findPlayer, summarizePlayer, recent: (limit) => selectRecent.all(limit) }
