const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const config = require('../config')
const { child } = require('../logger')
const migrations = require('./migrations')

const log = child('db')

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })

const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')
db.pragma('temp_store = MEMORY')
db.pragma('cache_size = -32000')

const current = db.pragma('user_version', { simple: true })
for (let version = current; version < migrations.length; version++) {
  db.transaction(() => {
    db.exec(migrations[version])
    db.pragma(`user_version = ${version + 1}`)
  })()
  log.info({ version: version + 1 }, 'migration applied')
}

log.info({ path: config.dbPath }, 'database ready')

module.exports = db
