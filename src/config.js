const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile)) process.loadEnvFile(envFile)

const int = (value, fallback, min = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback
}

const env = process.env.NODE_ENV || 'development'
const publicDir = path.join(root, 'public')
const cs2dDir = path.join(publicDir, 'cs2d')

module.exports = Object.freeze({
  env,
  production: env === 'production',
  host: process.env.HOST || '0.0.0.0',
  port: int(process.env.PORT, 3000, 1),
  logLevel: process.env.LOG_LEVEL || 'info',
  baseUrl: (process.env.BASE_URL || 'https://cs2d.pp.ua').replace(/\/+$/, ''),
  dbPath: path.resolve(root, process.env.DB_PATH || 'data/cs2d.db'),
  ipinfoKey: process.env.IPINFO_APIKEY || null,
  master: Object.freeze({ host: '217.154.200.83', port: 36963 }),
  scanner: Object.freeze({
    concurrency: int(process.env.SCAN_CONCURRENCY, 10, 1),
    intervalMs: int(process.env.SCAN_INTERVAL_MS, 10000, 1000),
    timeoutMs: int(process.env.SCAN_TIMEOUT_MS, 1500, 100),
    listIntervalMs: 300000,
    staleAfterSec: 120,
    maxServers: int(process.env.MAX_SERVERS, 2000, 1)
  }),
  retention: Object.freeze({
    detailDays: int(process.env.RETENTION_DETAIL_DAYS, 14, 1),
    globalDays: int(process.env.RETENTION_GLOBAL_DAYS, 365, 1)
  }),
  maps: Object.freeze({ forceReload: process.env.MAPS_FORCE_RELOAD === '1' }),
  dirs: Object.freeze({
    root,
    public: publicDir,
    views: path.join(root, 'views'),
    cs2d: cs2dDir,
    maps: path.join(cs2dDir, 'maps'),
    minimaps: path.join(cs2dDir, 'minimaps'),
    tiles: path.join(cs2dDir, 'gfx', 'tiles'),
    backgrounds: path.join(cs2dDir, 'gfx', 'backgrounds')
  })
})
