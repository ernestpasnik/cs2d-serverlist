const https = require('node:https')
const redis = require('./utils/redis')
const sockets = require('./sockets')

let webhooks = []

async function saveWebhooksToRedis(webhooks) {
  try {
    await redis.set('webhooks', JSON.stringify(webhooks))
    console.log('Webhooks saved to Redis')
  } catch (err) {
    console.error('Error saving webhooks to Redis:', err)
  }
}

async function loadWebhooksFromRedis() {
  try {
    const data = await redis.get('webhooks')
    return data ? JSON.parse(data) : []
  } catch (err) {
    console.error('Error loading webhooks from Redis:', err)
    return []
  }
}

async function generateEmbedsFromServers(servers) {
  const allServers = sockets.getRecentServers()
  const embeds = []

  for (const ipPort of servers) {
    const [ip, port] = ipPort.split(':')
    const server = allServers.find(s => s.ip === ip && s.port === parseInt(port))

    if (!server) continue

    const players = `${server.players || 0}/${server.maxplayers || 0}` +
      (server.bots ? ` (${server.bots} bot${server.bots !== 1 ? 's' : ''})` : '')

    const embed = {
      title: server.name || 'Unknown Server',
      url: `https://cs2d.pp.ua/details/${ipPort}`,
      color: 0x3498db,
      fields: [
        { name: 'Players', value: players, inline: true },
        { name: 'Map', value: server.map || 'Unknown', inline: true }
      ]
    }

    const existingMap = await redis.exists(`map:${server.map}`)
    if (existingMap) {
      embed.thumbnail = {
        url: `https://cs2d.pp.ua/maps/${server.map}/minimap.png`
      }
    }
    embeds.push(embed)
  }
  return embeds
}

async function sendWebhookRequest(method, url, data) {
  const { hostname, pathname, search } = new URL(url)
  const path = pathname + (search || '')

  const options = {
    hostname,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          resolve(parsed)
        } catch (e) {
          reject(new Error('Invalid JSON response'))
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function addWebhook(webhookUrl, servers) {
  const data = JSON.stringify({ embeds: await generateEmbedsFromServers(servers) })

  try {
    const resData = await sendWebhookRequest('POST', webhookUrl + '?wait=true', data)
    if (resData && resData.id) {
      const existing = webhooks.find(w => w.webhookUrl === webhookUrl)
      if (existing) {
        existing.messageId = resData.id
        existing.servers = servers
      } else {
        webhooks.push({
          webhookUrl,
          messageId: resData.id,
          servers
        })
      }
      await saveWebhooksToRedis(webhooks)
      return { msg: 'Webhook added successfully.' }
    } else {
      return { err: resData.message || 'Invalid response.' }
    }
  } catch (err) {
    console.error('Error sending message:', err.message)
  }
}

async function processWebhooks() {
  for (const webhook of webhooks) {
    const data = JSON.stringify({ embeds: await generateEmbedsFromServers(webhook.servers) })
    const updateUrl = `${webhook.webhookUrl}/messages/${webhook.messageId}`

    sendWebhookRequest('PATCH', updateUrl, data)
      .then(async (resData) => {
        if (resData && resData.code == 10015) {
          const index = webhooks.indexOf(webhook)
          if (index > -1) {
            webhooks.splice(index, 1)
            await saveWebhooksToRedis(webhooks)
          }
        }
      })
      .catch((err) => {
        console.error('Error updating message:', err.message)
      })
  }
}

(async () => {
  webhooks = await loadWebhooksFromRedis()
  setInterval(processWebhooks, 10000)
})()

module.exports = { addWebhook }
