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

function fillProgressBar(address) {
  let progressBar = document.getElementById('progress')
  let width = 0
  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval)
      update(address)
    } else {
      width++
      progressBar.style.width = width + '%'
    }
  }, 100)
}

function update(address) {
  fetch(`/api/${address}`)
    .then(response => {
      fillProgressBar(address)
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
      document.title = `${players} ${d.name} · CS2D Serverlist`
      document.querySelector('#gamemode').textContent = gamemodeMap[d.gamemode] || ''
      document.querySelector('#password').textContent = d.password ? 'Enabled' : 'Disabled'
      document.querySelector('#usgDisablednly').textContent = d.usgDisablednly ? 'Enabled' : 'Disabled'
      document.querySelector('#fow').textContent = d.fow ? 'Enabled' : 'Disabled'
      document.querySelector('#forcelight').textContent = d.forcelight ? 'Enabled' : 'Disabled'
      document.querySelector('#recoil').textContent = d.recoil ? 'Enabled' : 'Disabled'
      document.querySelector('#offscreendamage').textContent = d.offscreendamage ? 'Enabled' : 'Disabled'
      document.querySelector('#lua').textContent = d.lua ? 'Lua Scripts' : 'No Lua Scripts'
      document.querySelector('#hasdownloads').textContent = d.hasdownloads ? 'Downloads' : 'No Downloads'

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
        div.textContent = `Spectators: ${lst}`
      } else {
        div.textContent = ''
      }
    })
    .catch(error => {
      console.error('Fetch error:', error)
    })
}

(window.onload = (e) => {
  incEltNbr('servers')
  incEltNbr('players')
  const address = document.querySelector('#address')
  if (address) {
    fillProgressBar(address.textContent)
  }
})

class CopyButtonPlugin {
  constructor(options = {}) {
    this.hook = options.hook;
    this.callback = options.callback;
    this.autohide = typeof options.autohide !== "undefined" ? options.autohide : false;
  }
  "after:highlightElement"({ el, text }) {
    if (el.parentElement.querySelector(".hljs-copy-button")) return;
    let { hook, callback, autohide } = this;
    let container = Object.assign(document.createElement("div"), { className: "hljs-copy-container" });
    container.dataset.autohide = autohide;
    let button = Object.assign(document.createElement("button"), { innerHTML: "Copy", className: "hljs-copy-button" });
    button.dataset.copied = false;
    el.parentElement.classList.add("hljs-copy-wrapper");
    el.parentElement.appendChild(container);
    container.appendChild(button);
    container.style.setProperty("--hljs-theme-background", window.getComputedStyle(el).backgroundColor);
    container.style.setProperty("--hljs-theme-color", window.getComputedStyle(el).color);
    container.style.setProperty("--hljs-theme-padding", window.getComputedStyle(el).padding);
    button.onclick = function () {
      if (!navigator.clipboard) return;
      let newText = text;
      if (hook && typeof hook === "function") {
        newText = hook(text, el) || text;
      }
      navigator.clipboard
        .writeText(newText)
        .then(function () {
          button.innerHTML = "✓";
          button.dataset.copied = true;
          let alert = Object.assign(document.createElement("div"), { role: "status", className: "hljs-copy-alert", innerHTML: "Copied to clipboard" });
          el.parentElement.appendChild(alert);
          setTimeout(() => {
            button.innerHTML = "Copy";
            button.dataset.copied = false;
            el.parentElement.removeChild(alert);
            alert = null;
          }, 2e3);
        })
        .then(function () {
          if (typeof callback === "function") return callback(newText, el);
        });
    };
  }
}
if (typeof module != "undefined") {
  module.exports = CopyButtonPlugin;
}

hljs.addPlugin(new CopyButtonPlugin());
hljs.highlightAll();