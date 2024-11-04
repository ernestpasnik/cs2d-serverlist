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
    progressText.innerHTML = `${icon}Refresh in ${Math.ceil(remainingSeconds)} second${Math.ceil(remainingSeconds) === 1 ? '' : 's'}`
  } else {
    progressText.innerHTML = `${icon}Refreshing...`
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
  const settings = ['password', 'usgnonly', 'fow', 'forcelight', 'recoil', 'offscreendamage']
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

const addressElement = document.querySelector('#address')
if (addressElement) {
  fillProgressBar(addressElement.textContent)
  let clicked = false
  addressElement.addEventListener('click', function () {
    if (clicked) return
    const text = this.textContent
    navigator.clipboard.writeText(text)
      .then(() => {
        const originalText = this.textContent
        this.textContent = 'Copied to clipboard!'
        clicked = true
        setTimeout(() => {
          this.textContent = originalText
          clicked = false
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
      })
  })
}

document.addEventListener('click', function (e) {
  try {
    function findElementRecursive(element, tag) {
      return element.nodeName === tag ? element : findElementRecursive(element.parentNode, tag)
    }
    var ascending_table_sort_class = 'asc'
    var no_sort_class = 'no-sort'
    var null_last_class = 'n-last'
    var table_class_name = 'sortable'
    var alt_sort_1 = e.shiftKey || e.altKey
    var element = findElementRecursive(e.target, 'TH')
    var tr = element.parentNode
    var thead = tr.parentNode
    var table = thead.parentNode
    function getValue(element) {
      var _a
      var value = alt_sort_1 ? element.dataset.sortAlt : (_a = element.dataset.sort) !== null && _a !== void 0 ? _a : element.textContent
      return value
    }
    if (thead.nodeName === 'THEAD' &&
      table.classList.contains(table_class_name) &&
      !element.classList.contains(no_sort_class)
    ) {
      var column_index_1
      var nodes = tr.cells
      var tiebreaker_1 = +element.dataset.sortTbr
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] === element) {
          column_index_1 = +element.dataset.sortCol || i
        }
        else {
          nodes[i].setAttribute('aria-sort', 'none')
        }
      }
      var direction = 'descending'
      if (element.getAttribute('aria-sort') === 'descending' ||
        (table.classList.contains(ascending_table_sort_class) && element.getAttribute('aria-sort') !== 'ascending')) {
        direction = 'ascending'
      }
      element.setAttribute('aria-sort', direction)
      var reverse_1 = direction === 'ascending'
      var sort_null_last_1 = table.classList.contains(null_last_class)
      var compare_1 = function (a, b, index) {
        var x = getValue(b.cells[index])
        var y = getValue(a.cells[index])
        if (sort_null_last_1) {
          if (x === '' && y !== '') {
            return -1
          }
          if (y === '' && x !== '') {
            return 1
          }
        }
        var temp = +x - +y
        var bool = isNaN(temp) ? x.localeCompare(y) : temp
        return reverse_1 ? -bool : bool
      }
      for (var i = 0; i < table.tBodies.length; i++) {
        var org_tbody = table.tBodies[i]
        var rows = [].slice.call(org_tbody.rows, 0)
        rows.sort(function (a, b) {
          var bool = compare_1(a, b, column_index_1)
          return bool === 0 && !isNaN(tiebreaker_1) ? compare_1(a, b, tiebreaker_1) : bool
        })
        var clone_tbody = org_tbody.cloneNode()
        clone_tbody.append.apply(clone_tbody, rows)
        table.replaceChild(clone_tbody, org_tbody)
      }
    }
  }
  catch (error) {
    console.log(error)
  }
})

hljs.highlightAll()
