/* Details */
const update = async url => {
  try {
    document.getElementById('timer').style.display = 'none';
    document.getElementById('loader').style.display = 'inline-block';
    document.getElementById('timeAgo').style.opacity = 0.5;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');

    const data = await response.json();
    updateUI(data);
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('timeAgo').style.opacity = 1;
      document.getElementById('timer').style.display = 'inline-block';
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
  document.getElementById('ts').textContent = timeAgo(d.ts);
  document.getElementById('name').textContent = d.name;
  document.getElementById('map').textContent = d.map;

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

  const gm = document.getElementById('gm');
  gm.className = ['s', 'd', 't', 'c', 'z'][d.gamemode];
  gm.textContent = ['Standard', 'Deathmatch', 'Team Deathmatch', 'Construction', 'Zombies!'][d.gamemode];

  const flags = ['password', 'usgnonly', 'lua', 'fow', 'friendlyfire', 'forcelight', 'recoil', 'offscreendamage', 'downloads'];
  flags.forEach(key => {
    const el = document.querySelector(`[data-flag="${key}"]`);
    if (el) {
      el.className = d[key] ? 'enbl' : 'dsbl';
    }
  });

  const [t, ct] = [document.getElementById('t'), document.getElementById('ct')];
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
  document.getElementsByClassName('spec')[0].textContent = spectators.length
    ? `Spectators: ${spectators.map(p => p.name).join(', ')}`
    : '';
};

const addr = document.getElementById('addr');
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
