const https = require('node:https')
const fs = require('node:fs/promises')
const sockets = require('./sockets.js')

let webhooks = []

async function saveWebhooksToFile(filename, webhooks) {
  try {
    await fs.writeFile(filename, JSON.stringify(webhooks, null, 2))
    console.log('Webhooks saved to file')
  } catch (err) {
    console.error('Error saving webhooks:', err)
  }
}

async function loadWebhooksFromFile(filename) {
  try {
    const data = await fs.readFile(filename, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

function generateEmbedsFromServers(servers) {
  const allServers = sockets.getRecentServers().servers
  const embeds = []

  for (const ipPort of servers) {
    const server = allServers[ipPort]
    if (!server) continue

    const players = `${server.players}/${server.maxplayers}` +
      (server.bots ? ` (${server.bots} bot${server.bots !== 1 ? 's' : ''})` : '')

    embeds.push({
      title: server.name,
      url: `https://cs2d.pp.ua/details/${ipPort}`,
      color: 0x3498db,
      fields: [
        { name: 'Players', value: players, inline: true },
        { name: 'Map', value: server.map, inline: true }
      ]
    })
  }

  return embeds
}

function sendWebhookRequest(method, url, data, callback) {
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

  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        callback(null, parsed)
      } catch (e) {
        callback(new Error('Invalid JSON response'))
      }
    })
  })

  req.on('error', callback)
  req.write(data)
  req.end()
}

async function addWebhook(webhookUrl, servers) {
  const data = JSON.stringify({ embeds: generateEmbedsFromServers(servers) })

  sendWebhookRequest('POST', webhookUrl + '?wait=true', data, async (err, resData) => {
    if (err) {
      console.error('Error sending message:', err.message)
      return
    }

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

      await saveWebhooksToFile('webhooks.json', webhooks)
    }
  })
}

setInterval(async () => {
  for (let i = 0; i < webhooks.length; i++) {
    const webhook = webhooks[i]
    const data = JSON.stringify({ embeds: generateEmbedsFromServers(webhook.servers) })
    const updateUrl = `${webhook.webhookUrl}/messages/${webhook.messageId}`

    sendWebhookRequest('PATCH', updateUrl, data, async (err) => {
      if (err) {
        console.error('Error updating message:', err.message)
        webhooks.splice(i, 1)
        await saveWebhooksToFile('webhooks.json', webhooks)
      }
    })
  }
}, 10000)

;(async () => {
  webhooks = await loadWebhooksFromFile('webhooks.json')
})()

module.exports = { addWebhook }
