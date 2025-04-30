const axios = require('axios')
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
        {
          name: 'Players',
          value: players,
          inline: true
        },
        {
          name: 'Map',
          value: server.map,
          inline: true
        }
      ]
    })
  }

  return embeds
}

function addWebhook(webhookUrl, servers) {
  axios.post(webhookUrl + '?wait=true', {
    embeds: generateEmbedsFromServers(servers)
  })
    .then(function (response) {
      if (response.data && response.data.id) {
        const existing = webhooks.find(w => w.webhookUrl === webhookUrl)
        if (existing) {
          existing.messageId = response.data.id
          existing.servers = servers
        } else {
          webhooks.push({
            webhookUrl,
            messageId: response.data.id,
            servers
          })
        }
        saveWebhooksToFile('webhooks.json', webhooks)
      }
    })
    .catch(function (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message)
    })
}

setInterval(() => {
  webhooks.forEach((webhook, index) => {
    const embeds = generateEmbedsFromServers(webhook.servers)
    axios.patch(`${webhook.webhookUrl}/messages/${webhook.messageId}`, { embeds })
      .catch(error => {
        if (error.response) {
          console.error('Error updating message:', error.response.data)
          webhooks.splice(index, 1)
          saveWebhooksToFile('webhooks.json', webhooks)
        }
      })
  })
}, 10000)

module.exports = { addWebhook }
