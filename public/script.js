// tofsjonas/sortable
document.addEventListener("click",function(c){try{function h(b,a){return b.nodeName===a?b:h(b.parentNode,a)}var v=c.shiftKey||c.altKey,d=h(c.target,"TH"),m=d.parentNode,n=m.parentNode,g=n.parentNode;function p(b){var a;return v?b.dataset.sortAlt:null!==(a=b.dataset.sort)&&void 0!==a?a:b.textContent}if("THEAD"===n.nodeName&&g.classList.contains("sortable")&&!d.classList.contains("no-sort")){var q,f=m.cells,r=+d.dataset.sortTbr;for(c=0;c<f.length;c++)f[c]===d?q=+d.dataset.sortCol||c:f[c].setAttribute("aria-sort",
  "none");f="descending";if("descending"===d.getAttribute("aria-sort")||g.classList.contains("asc")&&"ascending"!==d.getAttribute("aria-sort"))f="ascending";d.setAttribute("aria-sort",f);var w="ascending"===f,x=g.classList.contains("n-last"),t=function(b,a,e){a=p(a.cells[e]);b=p(b.cells[e]);if(x){if(""===a&&""!==b)return-1;if(""===b&&""!==a)return 1}e=+a-+b;a=isNaN(e)?a.localeCompare(b):e;return w?-a:a};for(c=0;c<g.tBodies.length;c++){var k=g.tBodies[c],u=[].slice.call(k.rows,0);u.sort(function(b,a){var e=
  t(b,a,q);return 0!==e||isNaN(r)?e:t(b,a,r)});var l=k.cloneNode();l.append.apply(l,u);g.replaceChild(l,k)}}}catch(h){}});  

function loadCSS(url) {
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

loadCSS('https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/inter.css')

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

function update(address, loader) {
  loader.classList.remove('hide')
  setTimeout(function() {
    loader.classList.add('hide')
  }, 500)

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
      document.title = `(${d.players}) ${d.name} - CS2D Serverlist`
      document.querySelector('#gamemode').textContent = gamemodeMap[d.gamemode] || ''
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
        div.classList.remove('hide')
      } else {
        div.classList.add('hide')
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
    const loader = document.getElementsByClassName('loader')[0]
    setInterval(function() {
      update(address, loader)
    }, 10000)
  }
})
