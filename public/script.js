const $ = s => document.querySelector(s);

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
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];

  for (const [name, sec] of units) {
    const value = Math.floor(s / sec);
    if (value) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
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
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="me-1.5 size-5 text-green-400">
      <path d="M11.5 8A1.5 1.5 0 0 1 13 9.5v.5c0 2-1.9 4-5 4s-5-2-5-4v-.5A1.5 1.5 0 0 1 4.5 8zM8 1.5A2.7 2.7 0 1 1 8 7a2.7 2.7 0 0 1 0-5.5" fill="currentColor"></path>
    </svg>
    <i>${d.players - d.bots}</i>${d.bots > 0 ? `<span class="b">+${d.bots}</span>` : ''}/${d.maxplayers}
  `;

  const gm = $('#gm');
  const gmNames = ['Standard', 'Deathmatch', 'Team Deathmatch', 'Construction', 'Zombies!'];
  gm.textContent = gmNames[d.gamemode];

  const flags = ['password', 'usgnonly', 'lua', 'fow', 'friendlyfire', 'forcelight', 'recoil', 'offscreendamage', 'downloads'];
  flags.forEach(key => {
    const el = document.querySelector(`[data-flag="${key}"]`);
    if (el) {
      el.className = d[key] ? 'enbl' : 'dsbl';
    }
  });  

  const [t, ct] = [$('#t'), $('#ct')];
  t.innerHTML = ct.innerHTML = '';

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

  const spectators = d.playerlist.filter(p => p.team === 0);
  $('.spec').textContent = spectators.length
    ? `Spectators: ${spectators.map(p => p.name).join(', ')}`
    : '';
};


const addr = $('#addr');
if (addr) {
  MicroModal.init({ disableScroll: true });
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

  let clicked = false;
  addr.addEventListener('click', (e) => {
    e.preventDefault();
    if (clicked) return;

    const originalText = addr.textContent;
    navigator.clipboard.writeText(originalText).then(() => {
      addr.textContent = 'Copied to clipboard';
      clicked = true;
      setTimeout(() => {
        addr.textContent = originalText;
        clicked = false;
      }, 2000);
    });
  });
}

document.querySelectorAll('.svlst tbody > tr').forEach(row =>
  row.addEventListener('click', () => {
    const link = row.querySelector('a')?.href;
    if (link) window.location.href = link;
  })
);


const serverForm = document.getElementById('server-form');
if (serverForm) {
  serverForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const selectedServers = [];
    formData.forEach((value, key) => {
      if (key === 'servers') {
        selectedServers.push(value);
      }
    });

    const url = formData.get('url');
    const data = {
      servers: selectedServers,
      url: url
    };

    const submitButton = serverForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      const alertContainer = document.getElementsByClassName('alert-container')[0];
      alertContainer.innerHTML = '';

      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('alert', 'err');
        errorDiv.textContent = result.error;
        alertContainer.appendChild(errorDiv);
      }

      if (result.msg) {
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
      setTimeout(() => {
        submitButton.disabled = false;
      }, 1000);
    }
  });
}

const searchInput = $('#search');
if (searchInput) {
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('search');
      if (searchInput) searchInput.focus();
    }
  });
  searchInput.addEventListener('input', () => {
    const search = searchInput.value.toLowerCase();
    const visibleRows = [];
    document.querySelectorAll('.svlst tbody > tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const match = text.includes(search);
      row.style.display = match ? '' : 'none';
      if (match) visibleRows.push(row);
    });
    visibleRows.forEach((row, index) => {
      row.classList.toggle('odd', index % 2 === 0);
      row.classList.toggle('even', index % 2 === 1);
    });
  });
}
