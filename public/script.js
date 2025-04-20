const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..500&display=swap'
document.head.appendChild(fontLink)

const $ = s => document.querySelector(s)

const update = url =>
  fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(d => d && updateUI(d))
    .catch(() => {})

const updateUI = d => {
  document.title = `${d.players}/${d.maxplayers} ${d.name} - CS2D Server List`
  $('#name').textContent = d.name
  $('#map').textContent = d.map
  $('#p').textContent = `${d.players}/${d.maxplayers}${d.bots ? ` (${d.bots} bots)` : ''}`

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
  const url = `/api/${addr.textContent}`
  setInterval(() => update(url), 10000)

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
