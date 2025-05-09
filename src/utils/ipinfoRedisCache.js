const redis = require('./redis')

class RedisCache {
  // The default cache length is 1 day
  constructor(ttl = 86400000) {
    this.ttl = ttl
  }

  // Extract only country, city, emoji, and org from the data
  extractRelevantData(data) {
    return {
      country: data.country,
      city: data.city,
      org: data.org
    }
  }

  async get(key) {
    const data = await redis.get('ipinfo:' + key)
    if (data) {
      const parsedData = JSON.parse(data)
      return this.extractRelevantData(parsedData)
    }
    return null
  }

  async set(key, value) {
    const relevantData = this.extractRelevantData(value)
    await redis.set('ipinfo:' + key, JSON.stringify(relevantData), 'PX', this.ttl)
  }
}

module.exports = RedisCache
