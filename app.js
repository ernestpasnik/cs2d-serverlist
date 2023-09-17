const servers = require(__dirname + '/src/servers')
const common = require(__dirname + '/src/common')
const express = require('express')
const minifyHTML = require('express-minify-html-2')
const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(minifyHTML({
  override: true,
  exception_url: false,
  htmlMinifier: {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    minifyJS: true
  }
}))

app.get('/', (req, res) => {
  const result = servers.getServers()
  res.render('serverlist', {
    serversNum: result.servers.length,
    playersNum: result.players,
    servers: result.servers
  })
})

app.get('/details/:address', (req, res) => {
  const result = servers.getServer(req.params.address)
  if (result.error) {
    res.status(404)
  } else {
    res.render('details', {
      title: result.name,
      s: result
    })
  }
})

app.get('/api', (req, res) => {
  res.render('api', {
    title: 'API Documentation',
    example: common.example
  })
})

app.get('/api/:address', (req, res) => {
  const result = servers.getServer(req.params.address)
  if (result.error) {
    res.status(404).json(result)
  } else {
    res.json(result)
  }
})

app.get('/stats', (req, res) => {
  const result = servers.getStats()
  res.render('stats', {
    title: 'Application Statistics',
    uptime: common.secondsToUptime(process.uptime()),
    recvSize: common.bytesToSize(result.recvSize),
    sentSize: common.bytesToSize(result.sentSize)
  })
})

app.listen(port, () => {
  console.log(`CS2D Serverlist listening on port ${port}`)
})
