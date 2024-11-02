function fillProgressBar(address) {
  const progressBar = document.getElementById('progress')
  const progressText = document.querySelector('#pro span')
  let width = 0
  const totalTime = 10000
  const totalSeconds = totalTime / 1000
  const increment = 100 / totalSeconds
  let lastTimestamp = performance.now()

  function updateProgress(timestamp) {
    const deltaTime = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    if (width >= 100) {
      update(address)
    } else {
      width += increment * deltaTime
      width = Math.min(width, 100)
      progressBar.style.width = width + '%'
      updateProgressText(progressText, totalSeconds, width)
      requestAnimationFrame(updateProgress)
    }
  }

  requestAnimationFrame(updateProgress)
}

function updateProgressText(progressText, totalSeconds, width) {
  const remainingSeconds = Math.max(0, totalSeconds - (width / 100 * totalSeconds))
  const icon = '<i class="bi bi-arrow-clockwise"></i>'
  
  if (remainingSeconds > 0) {
    progressText.innerHTML = `${icon} Refresh in ${Math.ceil(remainingSeconds)} second${Math.ceil(remainingSeconds) === 1 ? '' : 's'}`
  } else {
    progressText.innerHTML = `${icon} Refreshing...`
  }
}

function update(address) {
  fetch(`/api/${address}`)
    .then(response => {
      if (!response.ok) throw new Error('HTTP error! Status: ' + response.status)
      return response.json()
    })
    .then(data => {
      updateUI(data)
      fillProgressBar(address)
    })
    .catch(error => {
      console.error('Fetch error:', error)
      fillProgressBar(address)
    })
}

function updateUI(data) {
  document.querySelector('#name').textContent = data.name
  document.querySelector('#map').textContent = data.map
  updatePlayers(data)
  document.title = `${data.players}/${data.maxplayers} ${data.name} · CS2D Serverlist`
  updateGameMode(data)
  updateSettings(data)
  updatePlayerLists(data)
  updateSpectators(data.playerlist)
}

function updatePlayers(data) {
  const players = `${data.players}/${data.maxplayers}${data.bots > 0 ? ` (${data.bots} bots)` : ''}`
  document.querySelector('#players').textContent = players
}

function updateGameMode(data) {
  const gm = document.querySelector('#gm')
  gm.textContent = ['S', 'D', 'T', 'C', 'Z'][data.gamemode] || ''
  gm.className = ['s', 'd', 't', 'c', 'z'][data.gamemode] || ''
}

function updateSettings(data) {
  const settings = ['password', 'usgDisablednly', 'fow', 'forcelight', 'recoil', 'offscreendamage']
  settings.forEach(setting => {
    document.querySelector(`#${setting}`).textContent = data[setting] ? 'Enabled' : 'Disabled'
  })
}

function updatePlayerLists(data) {
  updateTeamList(data.playerlist, 2, 'ct')
  updateTeamList(data.playerlist, 1, 't')
}

function updateTeamList(playerlist, team, tbodyId) {
  const tbody = document.getElementById(tbodyId)
  tbody.innerHTML = ''
  playerlist.filter(player => player.team === team).forEach(player => {
    const row = document.createElement('tr')
    row.innerHTML = `<td>${player.name}</td><td>${player.score}</td><td>${player.deaths}</td>`
    tbody.appendChild(row)
  })
}

function updateSpectators(playerlist) {
  const spectators = playerlist.filter(player => player.team === 0)
  const div = document.getElementsByClassName('spec')[0]
  div.textContent = spectators.length > 0 ? `Spectators: ${spectators.map(player => player.name).join(', ')}` : ''
}

function createCopyButtonPlugin(options = {}) {
  const { hook, callback } = options

  function afterHighlightElement({ el, text }) {
    if (el.parentElement.querySelector(".hljs-copy-button")) return
    const container = document.createElement("div")
    container.className = "hljs-copy-container"
    container.dataset.autohide = false
    const button = document.createElement("button")
    button.innerHTML = "Copy"
    button.className = "hljs-copy-button"
    button.dataset.copied = false
    el.parentElement.classList.add("hljs-copy-wrapper")
    el.parentElement.appendChild(container)
    container.appendChild(button)

    button.onclick = () => {
      if (!navigator.clipboard) return
      let newText = text
      if (hook && typeof hook === "function") {
        newText = hook(text, el) || text
      }
      navigator.clipboard.writeText(newText)
        .then(() => {
          button.innerHTML = '<i class="bi bi-check-lg"></i>'
          button.dataset.copied = true
          setTimeout(() => {
            button.innerHTML = "Copy"
            button.dataset.copied = false
          }, 1000)
        })
        .then(() => {
          if (typeof callback === "function") return callback(newText, el)
        })
    }
  }

  return { "after:highlightElement": afterHighlightElement }
}

function isWindows() {
  return navigator.userAgent.includes('Windows')
}

function countryFlagEmojiPolyfill() {
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: "Twemoji Country Flags";
      unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
      src: url("https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2") format("woff2");
    }
    * {
      font-family: "Twemoji Country Flags", "Inter", sans-serif;
    }
  `
  document.head.appendChild(style)
}

window.onload = () => {
  if (document.querySelector('pre')) {
    hljs.addPlugin(createCopyButtonPlugin())
    hljs.highlightAll()
  }
  if (isWindows()) {
    countryFlagEmojiPolyfill()
  }
  const addressElement = document.querySelector('#address')
  if (addressElement) {
    fillProgressBar(addressElement.textContent)
  }
}
