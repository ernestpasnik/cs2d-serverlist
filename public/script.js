/* Utils */
const $ = s => document.querySelector(s);
tippy('[data-tippy-content]', { allowHTML: true });



/* Details */
const update = async url => {
  try {
    $('#timer').style.display = 'none';
    $('#loader').style.display = 'inline-block';
    $('#timeAgo').style.opacity = 0.5;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');

    const data = await response.json();
    updateUI(data);
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => {
      $('#loader').style.display = 'none';
      $('#timeAgo').style.opacity = 1;
      $('#timer').style.display = 'inline-block';
    }, 500);
  }
};

const timeAgo = ts => {
  const s = Math.floor(Date.now() / 1000) - ts;
  const u = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  for (const [name, sec] of u) {
    const v = Math.floor(s / sec);
    if (v) return v + name + ' ago';
  }
  return 'just now';
};

const updateUI = d => {
  document.title = `${d.players}/${d.maxplayers} ${d.name} - CS2D Server List`;
  $('#ts').textContent = timeAgo(d.ts);
  $('#name').textContent = d.name;
  $('#map').textContent = d.map;

  const p = document.getElementById('p');
  if (d.players - d.bots > 0) {
    p.classList.add('e');
  } else {
    p.classList.remove('e');
  }
  p.innerHTML = `
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 16" class="me-1.5 size-5 text-green-400">
      <path d="M11.5 8A1.5 1.5 0 0 1 13 9.5v.5c0 2-1.9 4-5 4s-5-2-5-4v-.5A1.5 1.5 0 0 1 4.5 8zM8 1.5A2.7 2.7 0 1 1 8 7a2.7 2.7 0 0 1 0-5.5" fill="currentColor"></path>
    </svg>
    <i>${d.players - d.bots}</i>${d.bots > 0 ? `<span class="b">+${d.bots}</span>` : ''}/${d.maxplayers}
  `;

  const gm = $('#gm');
  gm.className = ['s', 'd', 't', 'c', 'z'][d.gamemode];
  gm.textContent = ['Standard', 'Deathmatch', 'Team Deathmatch', 'Construction', 'Zombies!'][d.gamemode];

  const flags = ['password', 'usgnonly', 'lua', 'fow', 'friendlyfire', 'forcelight', 'recoil', 'offscreendamage', 'downloads'];
  flags.forEach(key => {
    const el = document.querySelector(`[data-flag="${key}"]`);
    if (el) {
      el.className = d[key] ? 'enbl' : 'dsbl';
    }
  });  

  const [t, ct] = [$('#t'), $('#ct')];
  t.innerHTML = ct.innerHTML = '';

  if (Array.isArray(d.playerlist) && d.playerlist.length > 0) {
    d.playerlist.forEach(p => {
      if (p.team > 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.name}</td><td>${p.score}</td><td>${p.deaths}</td>`;
        if (p.team == 1) {
          t.appendChild(row);
        } else {
          ct.appendChild(row);
        }
      }
    });
  }

  const spectators = d.playerlist.filter(p => p.team === 0);
  $('.spec').textContent = spectators.length
    ? `Spectators: ${spectators.map(p => p.name).join(', ')}`
    : '';
};

const addr = $('#addr');
if (addr) {
  const el = document.getElementById('ts');
  const lastTimeUpdatedTs = parseInt(el.getAttribute('data-ts'), 10);
  const timeNow = Math.floor(Date.now() / 1000);
  const timeSinceLastUpdate = timeNow - lastTimeUpdatedTs;
  const remainder = timeSinceLastUpdate % 10;
  const timeToNextUpdate = (remainder === 0 ? 0 : 10 - remainder) + 1;
  const url = `/api/${addr.textContent}`;

  setTimeout(() => {
    update(url);
    setInterval(() => update(url), 10 * 1000);
  }, timeToNextUpdate * 1000);
}



/* Copy */
const copyBtn = $('.copyBtn');
if (copyBtn) {
  const copyContent = $('.copyContent');
  let clicked = false;
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (clicked) return;

    const originalText = copyContent.textContent;
    navigator.clipboard.writeText(originalText).then(() => {
      copyContent.textContent = 'Copied to clipboard';
      clicked = true;
      setTimeout(() => {
        copyContent.textContent = originalText;
        clicked = false;
      }, 2000);
    });
  });
}



/* Map Filter */
const maps_filter = document.getElementById('maps_filter');
if (maps_filter) {
  const mapLinks = document.querySelectorAll('.maplist a');
  const mapCountDisplay = document.getElementById('map-count');

  maps_filter.addEventListener('input', function () {
    const filterText = maps_filter.value.toLowerCase();
    let visibleMapCount = 0;

    mapLinks.forEach(link => {
      const mapName = link.textContent.toLowerCase();
      if (mapName.includes(filterText)) {
        link.style.display = 'inline-block';
        visibleMapCount++;
      } else {
        link.style.display = 'none';
      }
    });

    mapCountDisplay.textContent = `${visibleMapCount} ${visibleMapCount === 1 ? 'Map' : 'Maps'}`;
  });
}




/* Tools */
const serverForm = document.getElementById('server-form');
if (serverForm) {
  const alertContainer = $('.alert-container');

  serverForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    alertContainer.innerHTML = '';

    const formData = new FormData(this);
    const selectedServers = [];
    formData.forEach((value, key) => {
      if (key === 'servers') {
        selectedServers.push(value);
      }
    });
    if (selectedServers.length === 0) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'No servers selected.';
      alertContainer.appendChild(errorDiv);
      return;
    }

    const url = formData.get('url');
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}$/;
    if (typeof url !== 'string' || !discordWebhookRegex.test(url)) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'Invalid webhook URL.';
      alertContainer.appendChild(errorDiv);
      return;
    }

    const submitButton = serverForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servers: selectedServers, url: url })
      });

      const result = await response.json();
      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('alert', 'err');
        errorDiv.textContent = result.error;
        alertContainer.appendChild(errorDiv);
      } else if (result.msg) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('alert', 'msg');
        msgDiv.textContent = result.msg;
        alertContainer.appendChild(msgDiv);
      }
    } catch (error) {
      const alertContainer = document.getElementsByClassName('alert-container')[0];
      alertContainer.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'An error occurred while submitting the form.';
      alertContainer.appendChild(errorDiv);
    } finally {
      submitButton.disabled = false;
    }
  });
}



/* Server List */
const searchInput = $('#search');
if (searchInput) {
  const svlst = $('.svlst');
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const serversCountElement = document.getElementById('servers');

  if (searchQuery) {
    searchInput.value = searchQuery;
    searchInput.focus();
  }

  document.querySelectorAll('.svlst tbody > tr').forEach(row =>
    row.addEventListener('click', () => {
      const link = row.querySelector('a')?.href;
      if (link) window.location.href = link;
    })
  );

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('search');
      if (searchInput) searchInput.focus();
    }
  });

  const filterTable = (search) => {
    const visibleRows = [];
    svlst.querySelectorAll('tbody > tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const match = text.includes(search);
      row.style.display = match ? '' : 'none';
      if (match) visibleRows.push(row);
    });
    
    visibleRows.forEach((row, index) => {
      row.classList.toggle('odd', index % 2 === 0);
      row.classList.toggle('even', index % 2 === 1);
    });

    if (serversCountElement) {
      const serverCount = visibleRows.length;
      serversCountElement.innerHTML = `${serverCount} Server${serverCount !== 1 ? 's' : ''}`;
    }
  };

  if (searchQuery) {
    filterTable(searchQuery.toLowerCase());
  }

  searchInput.addEventListener('input', () => {
    const search = searchInput.value.toLowerCase();
    const newUrl = new URL(window.location);
    if (search) {
      newUrl.searchParams.set('q', search);
    } else {
      newUrl.searchParams.delete('q');
    }
    window.history.replaceState({}, '', newUrl);
    filterTable(search);
  });

  svlst.addEventListener('sort-end', function (e) {
    let visibleRows = [];
    e.target.querySelectorAll('tbody > tr').forEach(row => {
      if (row.style.display !== 'none') {
        visibleRows.push(row);
      }
    });
    visibleRows.forEach((row, index) => {
      row.classList.toggle('odd', index % 2 === 0);
      row.classList.toggle('even', index % 2 === 1);
    });
  });
}
