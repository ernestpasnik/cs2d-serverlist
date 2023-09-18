function loadCSS(url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

loadCSS('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

function incEltNbr(e) {
  var t = document.getElementById(e);
  t && incNbrRec(0, (endNbr = Number(document.getElementById(e).innerHTML)), t);
}

function incNbrRec(e, t, i) {
  e <= t &&
  ((i.innerHTML = e),
  setTimeout(function () {
    incNbrRec(e + 1, t, i);
  }, 10));
}

function fetchData(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(d => {
      document.querySelector("#ts").setAttribute("data-ts", d.ts);
      document.querySelector("#name").textContent = d.name;
      document.querySelector("#map").textContent = d.map;
      const players = `${d.players}/${d.maxplayers}${d.bots > 0 ? ` (${d.bots} bots)` : ''}`;
      document.querySelector("#players").textContent = players;
      document.title = `(${d.players}) ${d.name} - CS2D Server List`;
      const gamemodeMap = {
        0: 'Standard',
        1: 'Deathmatch',
        2: 'Team Deathmatch',
        3: 'Construction',
        4: 'Zombies!',
      };
      document.querySelector("#gamemode").textContent = gamemodeMap[d.gamemode] || '';
      document.querySelector("#lua").textContent = d.lua ? 'Yes' : 'No';
      document.querySelector("#password").textContent = d.password ? 'Yes' : 'No';
      document.querySelector("#usgnonly").textContent = d.usgnonly ? 'Yes' : 'No';
      document.querySelector("#fow").textContent = d.fow ? 'Yes' : 'No';
      document.querySelector("#forcelight").textContent = d.forcelight ? 'Yes' : 'No';
      document.querySelector("#recoil").textContent = d.recoil ? 'Yes' : 'No';
      document.querySelector("#offscreendamage").textContent = d.offscreendamage ? 'Yes' : 'No';
      document.querySelector("#hasdownloads").textContent = d.hasdownloads ? 'Yes' : 'No';
      const tbody = document.querySelector("#playerlist");
      tbody.innerHTML = '';
      d.playerlist.forEach(dataItem => {
        const row = document.createElement('tr');
        if (dataItem.team == 0) {
          row.classList.add('spec');
        } else if (dataItem.team == 1) {
          row.classList.add('t');
        } else {
          row.classList.add('ct');
        }
        const columns = ["id", "name", "score", "deaths"];
        columns.forEach(columnName => {
          const cell = document.createElement('td');
          cell.textContent = dataItem[columnName];
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

function updateTimeAgo() {
  const myDiv = document.getElementById('ts');
  const timestamp = parseInt(myDiv.getAttribute('data-ts'), 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = currentTime - timestamp;
  if (timeDifference > 15) {
    fetchData('/api/' + document.querySelector('#address').textContent);
  }
  myDiv.textContent = `${timeDifference} seconds ago`;
}

(window.onload = (e) => {
  incEltNbr('servers');
  incEltNbr('players');
  if (document.getElementById('ts')) {
    updateTimeAgo();
    setInterval(updateTimeAgo, 1000);
  }
});
