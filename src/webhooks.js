const https = require('https')
const fs = require('fs')
const sockets = require('./sockets.js')
let webhooks = loadWebhooksFromFile('webhooks.json')

function saveWebhooksToFile(filename, webhooks) {
  fs.writeFile(filename, JSON.stringify(webhooks, null, 2), (err) => {
    if (err) {
      console.error('Error saving webhooks:', err)
    } else {
      console.log('Webhooks saved to file')
    }
  })
}

function loadWebhooksFromFile(filename) {
  if (!fs.existsSync(filename)) return []
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'))
  } catch (err) {
    console.error('Error loading webhooks:', err)
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

function addWebhook(webhookUrl, servers) {
  const data = JSON.stringify({ embeds: generateEmbedsFromServers(servers) })
  sendWebhookRequest('POST', webhookUrl + '?wait=true', data, (err, resData) => {
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
      saveWebhooksToFile('webhooks.json', webhooks)
    }
  })
}

setInterval(() => {
  webhooks.forEach((webhook, index) => {
    const data = JSON.stringify({ embeds: generateEmbedsFromServers(webhook.servers) })
    const updateUrl = `${webhook.webhookUrl}/messages/${webhook.messageId}`
    sendWebhookRequest('PATCH', updateUrl, data, (err, resData) => {
      if (err) {
        console.error('Error updating message:', err.message)
        webhooks.splice(index, 1)
        saveWebhooksToFile('webhooks.json', webhooks)
      }
    })
  })
}, 10000)

module.exports = { addWebhook }
