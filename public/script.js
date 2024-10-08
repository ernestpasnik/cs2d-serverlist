const gamemodeMap = {
  0: 'Standard',
  1: 'Deathmatch',
  2: 'Team Deathmatch',
  3: 'Construction',
  4: 'Zombies!',
}

function incEltNbr(e) {
  var t = document.getElementById(e)
  t && incNbrRec(0, (endNbr = Number(document.getElementById(e).innerHTML)), t)
}

function incNbrRec(e, t, i) {
  e <= t &&
  ((i.innerHTML = e),
  setTimeout(function () {
    incNbrRec(e + 1, t, i)
  }, 10))
}

function update(address) {
  fetch(address)
    .then(response => {
      if (!response.ok) {
        throw new Error('HTTP error! Status: ' + response.status)
      }
      return response.json()
    })
    .then(d => {
      document.querySelector('#name').textContent = d.name
      document.querySelector('#map').textContent = d.map
      const players = `${d.players}/${d.maxplayers}${d.bots > 0 ? ` (${d.bots} bots)` : ''}`
      document.querySelector('#players').textContent = players
      document.title = `[${players}] ${d.name} · CS2D Serverlist`
      document.querySelector('#gamemode').textContent = gamemodeMap[d.gamemode] || ''
      document.querySelector('#loc').textContent = `${d.countryFlag} ${d.country}`
      document.querySelector('#lua').textContent = d.lua ? 'Yes' : 'No'
      document.querySelector('#password').textContent = d.password ? 'Yes' : 'No'
      document.querySelector('#usgnonly').textContent = d.usgnonly ? 'Yes' : 'No'
      document.querySelector('#fow').textContent = d.fow ? 'Yes' : 'No'
      document.querySelector('#forcelight').textContent = d.forcelight ? 'Yes' : 'No'
      document.querySelector('#recoil').textContent = d.recoil ? 'Yes' : 'No'
      document.querySelector('#offscreendamage').textContent = d.offscreendamage ? 'Yes' : 'No'
      document.querySelector('#hasdownloads').textContent = d.hasdownloads ? 'Yes' : 'No'

      const ct = d.playerlist.filter(player => player.team === 2 || player.team === 3)
      const tbodyCt = document.getElementById('ct')
      tbodyCt.innerHTML = ''
      ct.forEach(player => {
        const row = document.createElement('tr')
        const nameCell = document.createElement('td')
        nameCell.textContent = player.name
        const scoreCell = document.createElement('td')
        scoreCell.textContent = player.score
        const deathsCell = document.createElement('td')
        deathsCell.textContent = player.deaths
        row.appendChild(nameCell)
        row.appendChild(scoreCell)
        row.appendChild(deathsCell)
        tbodyCt.appendChild(row)
      })

      const t = d.playerlist.filter(player => player.team === 1)
      const tbodyT = document.getElementById('t')
      tbodyT.innerHTML = ''
      t.forEach(player => {
        const row = document.createElement('tr')
        const nameCell = document.createElement('td')
        nameCell.textContent = player.name
        const scoreCell = document.createElement('td')
        scoreCell.textContent = player.score
        const deathsCell = document.createElement('td')
        deathsCell.textContent = player.deaths
        row.appendChild(nameCell)
        row.appendChild(scoreCell)
        row.appendChild(deathsCell)
        tbodyT.appendChild(row)
      })

      const spec = d.playerlist.filter(player => player.team === 0)
      const div = document.getElementsByClassName('spec')[0]
      if (spec.length > 0) {
        const lst = spec.map(player => player.name).join(', ')
        div.textContent = 'Spectators: ' + lst
      } else {
      }
    })
    .catch(error => {
      console.error('Fetch error:', error)
    })
}

(window.onload = (e) => {
  incEltNbr('servers')
  incEltNbr('players')
  if (document.querySelector('#address')) {
    const address = '/api/' + document.querySelector('#address').textContent
    setInterval(function() {
      update(address)
    }, 10000)
  }
})
