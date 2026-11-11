const STEAM_BASELINE = 76561197960265728n

const steam64To32 = (id) => Number(id > STEAM_BASELINE ? id - STEAM_BASELINE : id)

module.exports = { steam64To32 }
