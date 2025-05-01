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
  const allServers = sockets.getRecentServers()
  const embeds = []

  for (const ipPort of servers) {
    const [ip, port] = ipPort.split(':')
    const server = allServers.find(s => s.ip === ip && s.port === parseInt(port))

    if (!server) continue

    const players = `${server.players || 0}/${server.maxplayers || 0}` +
      (server.bots ? ` (${server.bots} bot${server.bots !== 1 ? 's' : ''})` : '')

    embeds.push({
      title: server.name || 'Unknown Server',
      url: `https://cs2d.pp.ua/details/${ipPort}`,
      color: 0x3498db,
      fields: [
        { name: 'Players', value: players, inline: true },
        { name: 'Map', value: server.map || 'Unknown', inline: true }
      ]
    })
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
  const data = JSON.stringify({ embeds: generateEmbedsFromServers(servers) })

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
      saveWebhooksToFile('webhooks.json', webhooks)
      return { msg: 'Webhook added successfully.' }
    } else {
      return { err: resData.message || 'Invalid response.' }
    }
  } catch (err) {
    console.error('Error sending message:', err.message)
  }
}

async function processWebhooks() {
  for (let i = 0; i < webhooks.length; i++) {
    const webhook = webhooks[i]
    const data = JSON.stringify({ embeds: generateEmbedsFromServers(webhook.servers) })
    const updateUrl = `${webhook.webhookUrl}/messages/${webhook.messageId}`

    try {
      await sendWebhookRequest('PATCH', updateUrl, data)
      const resData = await sendWebhookRequest('PATCH', updateUrl, data)

      // Unknown Webhook
      if (resData && resData.code == 10015) {
        webhooks.splice(i, 1)
        saveWebhooksToFile('webhooks.json', webhooks)
      }
    } catch (err) {
      console.error('Error updating message:', err.message)
      //webhooks.splice(i, 1)
      //saveWebhooksToFile('webhooks.json', webhooks)
    }
  }
}

(async () => {
  webhooks = await loadWebhooksFromFile('webhooks.json')
  setInterval(processWebhooks, 10000)
})()

module.exports = { addWebhook }
