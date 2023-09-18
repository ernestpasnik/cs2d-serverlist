module.exports = {
  bytesToSize: function (bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  },
  secondsToUptime: function (s) {
    const uptimeInSeconds = Math.round(s);
    const days = Math.floor(uptimeInSeconds / (3600 * 24));
    const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = uptimeInSeconds % 60;
    const formattedDays = days > 0 ? `${days} day${days !== 1 ? 's' : ''}, ` : '';
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    return `${formattedDays}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  },
  example: {
    "ip": "45.235.98.50",
    "port": 36450,
    "country": "AR",
    "password": false,
    "usgnonly": false,
    "fow": false,
    "friendlyfire": false,
    "bots": 0,
    "lua": true,
    "forcelight": false,
    "name": "[CS2D] Argentina | Standard",
    "map": "de_desert",
    "players": 1,
    "maxplayers": 32,
    "gamemode": 0,
    "recoil": false,
    "offscreendamage": true,
    "hasdownloads": true,
    "playerlist": [
      {
        "id": 1,
        "name": "<DANGER> SHN",
        "team": 2,
        "score": 0,
        "deaths": 0
      }
    ],
    "ts": 1694980752
  }
};
