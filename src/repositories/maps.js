const db = require('../db')

const upsert = db.prepare(`
  INSERT INTO maps (name, hash, size, mtime_ms, data) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET hash = excluded.hash, size = excluded.size, mtime_ms = excluded.mtime_ms, data = excluded.data
`)
const selectFingerprints = db.prepare('SELECT name, size, mtime_ms AS mtimeMs FROM maps')
const selectNames = db.prepare('SELECT name FROM maps ORDER BY name').pluck()
const selectData = db.prepare('SELECT data FROM maps WHERE name = ?').pluck()
const selectExists = db.prepare('SELECT 1 FROM maps WHERE name = ?').pluck()
const remove = db.prepare('DELETE FROM maps WHERE name = ?')

const names = () => selectNames.all()

function detail(name) {
  const raw = selectData.get(name)
  if (!raw) return null
  const list = names()
  const index = list.indexOf(name)
  if (index === -1) return null
  return {
    ...JSON.parse(raw),
    nextMap: list[(index + 1) % list.length],
    prevMap: list[(index - 1 + list.length) % list.length]
  }
}

module.exports = {
  names,
  detail,
  has: (name) => selectExists.get(name) === 1,
  save: ({ name, hash, size, mtimeMs, data }) => upsert.run(name, hash, size, mtimeMs, data),
  remove: (name) => remove.run(name).changes > 0,
  fingerprints: () => new Map(selectFingerprints.all().map((row) => [row.name, row]))
}
