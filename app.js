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
    removeComments: true,
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
  const result = servers.getServer(req.params.address)
  if (result.error) {
    res.status(404).send('404 - Not Found')
  } else {
    res.render('details', { sv: result })
  }
})

app.get('/api', (req, res) => {
  res.render('api', { example: servers.getServer() })
})

app.get('/api/:address', (req, res) => {
  const result = servers.getServer(req.params.address)
  if (result.error) {
    res.status(404).json(result)
  } else {
    res.json(result)
  }
})

app.listen(port, () => {
  console.log(`CS2D Serverlist listening on port ${port}`)
})
