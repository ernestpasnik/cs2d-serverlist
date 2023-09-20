const servers = require(__dirname + '/src/servers');
const common = require(__dirname + '/src/common');
const express = require('express');
const minifyHTML = require('express-minify-html-2');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
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
}));

app.get('/', (req, res) => {
  const result = servers.getServers();
  const stats = servers.getStats();
  res.render('serverlist', {
    serversNum: result.servers.length,
    playersNum: result.players,
    servers: result.servers,
    uptime: common.secondsToUptime(process.uptime()),
    recv: common.bytesToSize(stats.recvSize),
    sent: common.bytesToSize(stats.sentSize)
  });
});

app.get('/details', (req, res) => {
  res.redirect('/');
});

app.get('/details/:address', (req, res) => {
  const result = servers.getServer(req.params.address);
  const stats = servers.getStats();
  if (result.error) {
    res.redirect('/');
  } else {
    const spectators = result.playerlist.filter(p => p.team === 0);
    res.render('details', {
      title: result.name,
      s: result,
      spectators: spectators,
      uptime: common.secondsToUptime(process.uptime()),
      recv: common.bytesToSize(stats.recvSize),
      sent: common.bytesToSize(stats.sentSize)
    });
  }
});

app.get('/api', (req, res) => {
  const stats = servers.getStats();
  res.render('api', {
    title: 'API Documentation',
    example: common.example,
    uptime: common.secondsToUptime(process.uptime()),
    recv: common.bytesToSize(stats.recvSize),
    sent: common.bytesToSize(stats.sentSize)
  });
});

app.get('/api/:address', (req, res) => {
  const result = servers.getServer(req.params.address);
  if (result.error) {
    res.status(404).json(result);
  } else {
    res.json(result);
  }
});

app.listen(port, () => {
  console.log(`CS2D Serverlist listening on port ${port}`);
});
