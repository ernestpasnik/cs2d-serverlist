const redis = require('./redis')

class RedisCache {
  constructor(ttl) {
    this.ttl = ttl
  }

  async get(key) {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async set(key, value) {
    await redis.set(key, JSON.stringify(value), 'PX', this.ttl)
  }
}

module.exports = RedisCache
