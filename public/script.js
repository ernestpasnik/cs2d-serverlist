const $ = s => document.querySelector(s)

const update = url => {
  $('#loader').style.display = 'inline-block'
  $('#ts').style.opacity = 0.5
  fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      setTimeout(() => {
        if (d) {
          updateUI(d)
        }
        $('#loader').style.display = 'none'
        $('#ts').style.opacity = 1
      }, 1500)
    })
    .catch(() => {})
}

const timeAgo = ts => {
  const s = Math.floor(Date.now() / 1000) - ts
  const u = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ]
  for (const [name, sec] of u) {
    const v = Math.floor(s / sec)
    if (v) return `${v} ${name}${v > 1 ? 's' : ''} ago`
  }
  return 'just now'
}    

const updateUI = d => {
  document.title = `${d.players}/${d.maxplayers} ${d.name} · CS2D Server List`
  $('#ts').textContent = timeAgo(d.ts)
  $('#name').textContent = d.name
  $('#map').textContent = d.map
  $('#p').textContent = `${d.players}/${d.maxplayers}${d.bots ? ` (${d.bots} bot${d.bots > 1 ? 's' : ''})` : ''}`;
  
  const gm = $('.flag-gm')
  const gmCodes = ['s', 'd', 't', 'c', 'z']
  const gmNames = ['Standard', 'Deathmatch', 'Team Deathmatch', 'Construction', 'Zombies!']
  const code = gmCodes[d.gamemode]
  gm.className = `flag-gm ${code}`
  gm.textContent = code.toUpperCase()
  gm.title = gmNames[d.gamemode]

  const flags = ['password', 'usgnonly', 'fow', 'friendlyfire', 'lua', 'forcelight', 'recoil', 'offscreendamage', 'hasdownloads']
  flags.forEach(f => {
    const el = $(`.flag.${f}`)
    if (el) el.classList.toggle('enabled', !!d[f])
  })

  const [t, ct] = [$('#t'), $('#ct')]
  t.innerHTML = ct.innerHTML = ''

  const { playerlist } = d
  for (const p of playerlist) {
    if (p.team > 0) {
      const row = document.createElement('tr')
      row.innerHTML = `<td>${p.name}</td><td>${p.score}</td><td>${p.deaths}</td>`
      ;(p.team === 1 ? t : ct).appendChild(row)
    }
  }

  const spectators = playerlist.filter(p => p.team === 0)
  $('.spec').textContent = spectators.length
    ? `Spectators: ${spectators.map(p => p.name).join(', ')}`
    : ''
}

const addr = $('#addr')
if (addr) {
  const el = $('#ts')
  const lastTimeUpdatedTs = parseInt(el.getAttribute('data-ts'), 10)
  const timeNow = Math.floor(Date.now() / 1000)
  const timeSinceLastUpdate = timeNow - lastTimeUpdatedTs
  const remainder = timeSinceLastUpdate % 10
  const timeToNextUpdate = (remainder === 0 ? 0 : 10 - remainder) + 1
  
  console.log(timeToNextUpdate);
  

  const url = `/api/${addr.textContent}`
  setTimeout(() => {
    update(url)
    setInterval(() => update(url), 10 * 1000)
  }, timeToNextUpdate * 1000)

  let clicked = false
  addr.addEventListener('click', () => {
    if (clicked) return
    const originalText = addr.textContent
    navigator.clipboard.writeText(originalText).then(() => {
      addr.textContent = 'Copied to clipboard'
      clicked = true
      setTimeout(() => {
        addr.textContent = originalText
        clicked = false
      }, 2000)
    })
  })
}

document.querySelectorAll('.svlst tbody > tr').forEach(row =>
  row.addEventListener('click', () => {
    const link = row.querySelector('a')?.href
    if (link) window.location.href = link
  })
)