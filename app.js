require('console-stamp')(console, 'HH:MM:ss.l')
const servers = require(__dirname + '/src/servers')
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
    removeComments: false,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    minifyJS: true
  }
}))

app.get('/', (req, res) => {
  const data = servers.getData()
  res.render('serverlist', {
    servers: data.servers.length,
    players: data.players,
    svlst: data.servers
  })
})

app.get('/details/:address', (req, res) => {
  res.render('details', {
    sv: servers.getServer(req.params.address)
  })
})

app.get('/api', (req, res) => {
  res.render('api', {
    example: servers.getServer('54.38.156.49:36963')
  })
})

app.get('/api/:address', (req, res) => {
  res.json(servers.getServer(req.params.address))
})

app.listen(port, () => {
  console.log(`CS2D Serverlist listening on port ${port}`)
})
