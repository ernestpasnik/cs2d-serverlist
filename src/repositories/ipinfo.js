const db = require('../db')

const select = db.prepare('SELECT country, city, org FROM ipinfo WHERE ip = ? AND expires_at > ?')
const upsert = db.prepare(`
  INSERT INTO ipinfo (ip, country, city, org, expires_at) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(ip) DO UPDATE SET country = excluded.country, city = excluded.city, org = excluded.org, expires_at = excluded.expires_at
`)
const prune = db.prepare('DELETE FROM ipinfo WHERE expires_at <= ?')

module.exports = {
  find: (ip) => select.get(ip, Date.now()) ?? null,
  save: (ip, value, ttlMs) => upsert.run(ip, value.country, value.city, value.org, Date.now() + ttlMs),
  prune: () => prune.run(Date.now()).changes
}
