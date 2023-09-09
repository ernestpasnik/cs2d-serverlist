const dgram = require('node:dgram')
const geoip = require('geoip-lite')
const server = dgram.createSocket('udp4')
const streams = require(__dirname + '/streams')
const usgnAddress = '81.169.236.243'
const usgnPort = 36963
let servers = []

function readFlag(flags, offset) {
  return !!(flags & (1 << offset))
}

function serverQuery(stream) {
  let len = 0
  let flags = 0
  const res = {}

  // Flags
  if (stream.remaining() < 1) return false
  flags = stream.readByte()
  res.password = readFlag(flags, 0)
  res.usgnonly = readFlag(flags, 1)
  res.fow = readFlag(flags, 2)
  res.friendlyfire = readFlag(flags, 3)
  res.bots = readFlag(flags, 5)
  res.lua = readFlag(flags, 6)
  res.forcelight = readFlag(flags, 7)

  // Name
  if (stream.remaining() < 1) return false
  len = stream.readByte()
  if (stream.remaining() < len) return false
  res.name = stream.readString(len)

  // Map
  if (stream.remaining() < 1) return false
  len = stream.readByte()
  if (stream.remaining() < len) return false
  res.map = stream.readString(len)

  // Players
  if (stream.remaining() < 2) return false
  res.players = stream.readByte()
  res.maxplayers = stream.readByte()

  // Gamemode
  if (flags & 32) {
    if (stream.remaining() < 1) return false
    res.gamemode = stream.readByte()
  } else {
    res.gamemode = 0
  }

  // Bots
  if (stream.remaining() < 1) return false
  res.bots = stream.readByte()

  // Flags
  if (stream.remaining() < 1) return false
  flags = stream.readByte()
  res.recoil = readFlag(flags, 0)
  res.offscreendamage = readFlag(flags, 1)
  res.hasdownloads = readFlag(flags, 2)

  // Playerlist
  if (stream.remaining() < 3) return false
  stream.readByte() // fb
  stream.readByte() // 05
  res.playerlist = []
  let player_num = stream.readByte()
  for (let i = 0; i < player_num; i++) {
    // Player ID
    if (stream.remaining() < 1) return false
    let id = stream.readByte()

    // Player Name
    if (stream.remaining() < 1) return false
    len = stream.readByte()
    if (stream.remaining() < len) return false
    let name = stream.readString(len)

    // Player Stats
    if (stream.remaining() < 9) return false
    let team = stream.readByte()
    let score = stream.readInt()
    let deaths = stream.readInt()

    res.playerlist.push({
      id: id,
      name: name,
      team: team,
      score: score,
      deaths: deaths
    })
  }
  return res
}

function receivedServers(buf) {
  const stream = new streams(buf)
  if (stream.readShort() == 1 && stream.readByte() == 20) {
    console.log(`Received server list from ${usgnAddress}:${usgnPort}`)
    let server_num = stream.readShort()
    for (let i = 0; i < server_num; i++) {
      let oct4 = stream.readByte()
      let oct3 = stream.readByte()
      let oct2 = stream.readByte()
      let oct1 = stream.readByte()
      let port = stream.readShort()
      let ip = `${oct1}.${oct2}.${oct3}.${oct4}`
      const index = servers.findIndex(obj => {
        return obj.ip == ip && obj.port == port
      })
      if (index == -1) {
        servers.push({
          ip: ip,
          port: port,
          country: geoip.lookup(ip).country.toLowerCase()
        })
      }
    }
  }
  delete stream
}

function receivedServerQuery(buf, ip, port) {
  const stream = new streams(buf)
  if (stream.readShort() == 1 && stream.readByte() == 251 && stream.readByte() == 1) {
    console.log(`Received server query from ${ip}:${port}`)
    const data = serverQuery(stream)
    if (data == false) {
      console.log(`Invalid packet`)
    } else {
      const index = servers.findIndex(obj => {
        return obj.ip == ip && obj.port == port
      })
      if (index != -1) {
        servers[index].password = data.password
        servers[index].usgnonly = data.usgnonly
        servers[index].fow = data.fow
        servers[index].friendlyfire = data.friendlyfire
        servers[index].bots = data.bots
        servers[index].lua = data.lua
        servers[index].forcelight = data.forcelight
        servers[index].name = data.name
        servers[index].map = data.map
        servers[index].players = data.players
        servers[index].maxplayers = data.maxplayers
        servers[index].gamemode = data.gamemode
        servers[index].recoil = data.recoil
        servers[index].offscreendamage = data.offscreendamage
        servers[index].hasdownloads = data.hasdownloads
        servers[index].playerlist = data.playerlist
        servers[index].ts = Math.floor(Date.now() / 1000)
      }
    }
  }
  delete stream
}

function getData() {
  const tmp = []
  const ts = Math.floor(Date.now() / 1000)
  let players = 0
  for (const e of servers) {
    if (e.ts != undefined && (ts - e.ts) < 60) {
      players = players + (e.players - e.bots)
      tmp.push(e)
    }
  }
  tmp.sort((a, b) => (b.players - b.bots) - (a.players - a.bots))
  return {
    servers: tmp,
    players: players
  }
}

function validateIPPortFormat(input) {
  const ipPortRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})$/
  return ipPortRegex.test(input)
}

function getServer(addr) {
  if (addr === undefined) {
    return servers.find(server => server.hasOwnProperty('ts'))
  }
  if (validateIPPortFormat(addr) == false) {
    return {error: 'Invalid address'}
  }
  const parts = addr.split(':')
  const index = servers.findIndex(obj => {
    return obj.ip == parts[0] && obj.port == parts[1]
  })
  if (index == -1) {
    return {error: 'Server does not exist'}
  }
  if (servers[index].ts == undefined) {
    return {error: 'Server does not exist'}
  }
  servers[index].playerlist.sort((a, b) => {
    return b.score - a.score
  })
  return servers[index]
}

server.on('message', (buf, rinfo) => {
  if (rinfo.port == usgnPort && rinfo.address == usgnAddress) {
    receivedServers(buf)
  } else {
    receivedServerQuery(buf, rinfo.address, rinfo.port)
  }
})

// Request server list every 60 seconds
function serverlistRequest() {
  // Keep server that are responding
  const tmp = []
  const ts = Math.floor(Date.now() / 1000)
  for (const e of servers) {
    if (e.ts != undefined && (ts - e.ts) < 60) {
      tmp.push(e)
    }
  }
  servers = tmp
  console.log(`Sending server list request...`)
  server.send(Buffer.from([1, 0, 20, 1]), usgnPort, usgnAddress)
  setTimeout(serverlistRequest, 60000)
}

// Request server query every 15 seconds
function serverqueryRequest() {
  console.log(`Sending ${servers.length} server query requests...`)
  for (const e of servers) {
    server.send(Buffer.from([1, 0, 251, 1, 245, 3, 251, 5]), e.port, e.ip)
  }
  setTimeout(serverqueryRequest, 15000)
}

serverlistRequest()
setTimeout(serverqueryRequest, 1000)

module.exports = { getData, getServer }
