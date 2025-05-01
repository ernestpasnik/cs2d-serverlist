module.exports = {
  apps: [{
    name: 'cs2d-serverlist',
    script: 'app.js',
    autorestart: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
