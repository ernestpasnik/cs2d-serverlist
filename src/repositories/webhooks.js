const db = require('../db')

const upsert = db.prepare(`
  INSERT INTO webhooks (url, message_id, servers, updated_at) VALUES (?, ?, ?, ?)
  ON CONFLICT(url) DO UPDATE SET message_id = excluded.message_id, servers = excluded.servers, updated_at = excluded.updated_at
`)
const selectAll = db.prepare('SELECT url, message_id AS messageId, servers FROM webhooks')
const remove = db.prepare('DELETE FROM webhooks WHERE url = ?')

module.exports = {
  save: (url, messageId, servers) => upsert.run(url, messageId, JSON.stringify(servers), Date.now()),
  all: () => selectAll.all().map((row) => ({ ...row, servers: JSON.parse(row.servers) })),
  remove: (url) => remove.run(url).changes > 0
}
