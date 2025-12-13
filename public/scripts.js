const Utils = {
  timeAgo(ts) {
    const s = Math.floor(Date.now() / 1000) - ts;
    const units = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
    for (const [name, sec] of units) {
      const v = Math.floor(s / sec);
      if (v) return `${v}${name} ago`;
    }
    return 'now';
  },

  bytesToSize(bytes, useColors = false) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) {
      return useColors ? this.createColoredSpan('Not Found', '#ff7474') : '0 B';
    }
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    const text = `${size} ${sizes[i]}`;
    
    if (!useColors) return text;
    
    const limit = 3 * 1024 * 1024;
    const ratio = Math.min(bytes / limit, 1);
    const r = Math.round(96 + (255 - 96) * ratio);
    const g = Math.round(255 - (255 * ratio));
    const b = Math.round(95 - (95 * ratio));
    
    return this.createColoredSpan(text, `rgb(${r}, ${g}, ${b})`);
  },

  createColoredSpan(text, color) {
    const span = document.createElement('span');
    span.style.color = color;
    span.style.fontWeight = 'bold';
    span.textContent = text;
    return span;
  },

  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
};

const CopyToClipboard = (() => {
  const btn = document.querySelector('.copyBtn');
  if (!btn) return;

  const content = document.querySelector('.copyContent');
  let clicked = false;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (clicked) return;

    const toCopy = content.getAttribute('data-tocopy');
    const originalText = content.textContent;
    
    try {
      await navigator.clipboard.writeText(toCopy);
      content.textContent = 'Copied to clipboard';
      clicked = true;
      setTimeout(() => {
        content.textContent = originalText;
        clicked = false;
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });
})();

const ServerDetails = (() => {
  const addr = document.getElementById('addr');
  if (!addr) return;

  const updateUI = (d) => {
    document.title = `${d.players}/${d.maxplayers} ${d.name} - CS2D Server List`;
    document.getElementById('ts').textContent = Utils.timeAgo(d.ts);
    document.getElementById('name').textContent = d.name;
    document.getElementById('map').textContent = d.map;

    const p = document.getElementById('p');
    p.classList.toggle('e', d.players - d.bots > 0);
    p.innerHTML = `
      <svg fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 16" class="me-1.5 size-5 text-green-400">
        <path d="M11.5 8A1.5 1.5 0 0 1 13 9.5v.5c0 2-1.9 4-5 4s-5-2-5-4v-.5A1.5 1.5 0 0 1 4.5 8zM8 1.5A2.7 2.7 0 1 1 8 7a2.7 2.7 0 0 1 0-5.5" fill="currentColor"></path>
      </svg>
      <i>${d.players - d.bots}</i>${d.bots > 0 ? `<span class="b">+${d.bots}</span>` : ''}/${d.maxplayers}
    `;

    const gm = document.getElementById('gm');
    const modes = ['Standard', 'Deathmatch', 'Team Deathmatch', 'Construction', 'Zombies!'];
    const modeClasses = ['s', 'd', 't', 'c', 'z'];
    gm.className = modeClasses[d.gamemode];
    gm.textContent = modes[d.gamemode];

    const flags = ['password', 'usgnonly', 'lua', 'fow', 'friendlyfire', 'forcelight', 'recoil', 'offscreendamage', 'downloads'];
    flags.forEach(key => {
      const el = document.querySelector(`[data-flag="${key}"]`);
      if (el) el.className = d[key] ? 'enbl' : 'dsbl';
    });

    const [t, ct] = [document.getElementById('t'), document.getElementById('ct')];
    t.innerHTML = ct.innerHTML = '';

    if (Array.isArray(d.playerlist) && d.playerlist.length > 0) {
      d.playerlist.forEach(p => {
        if (p.team > 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${p.name}</td><td>${p.score}</td><td>${p.deaths}</td>`;
          (p.team === 1 ? t : ct).appendChild(row);
        }
      });
    }

    const spectators = d.playerlist ? d.playerlist.filter(p => p.team === 0) : [];
    document.querySelector('.spec').textContent = spectators.length
      ? `Spectators: ${spectators.map(p => p.name).join(', ')}`
      : '';
  };

  const update = async (url) => {
    try {
      document.getElementById('timer').style.display = 'none';
      document.getElementById('loader').style.display = 'inline-block';
      document.getElementById('timeAgo').style.opacity = 0.5;

      const data = await Utils.fetchJSON(url);
      updateUI(data);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('timeAgo').style.opacity = 1;
        document.getElementById('timer').style.display = 'inline-block';
      }, 500);
    }
  };

  const el = document.getElementById('ts');
  const lastTs = parseInt(el.getAttribute('data-ts'), 10);
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - lastTs;
  const delay = (elapsed % 10 === 0 ? 0 : 10 - (elapsed % 10)) + 1;
  const url = `/api/${addr.textContent}`;

  setTimeout(() => {
    update(url);
    setInterval(() => update(url), 10000);
  }, delay * 1000);
})();

const ServerList = (() => {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;

  const svlst = document.querySelector('.svlst');
  const serversCountEl = document.getElementById('servers');
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');

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

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  const filterTable = (search) => {
    const visibleRows = [];
    svlst.querySelectorAll('tbody > tr').forEach(row => {
      const match = row.textContent.toLowerCase().includes(search);
      row.style.display = match ? '' : 'none';
      if (match) visibleRows.push(row);
    });
    
    visibleRows.forEach((row, i) => {
      row.classList.toggle('odd', i % 2 === 0);
      row.classList.toggle('even', i % 2 === 1);
    });

    if (serversCountEl) {
      serversCountEl.innerHTML = `${visibleRows.length} Server${visibleRows.length !== 1 ? 's' : ''}`;
    }
  };

  if (searchQuery) filterTable(searchQuery.toLowerCase());

  searchInput.addEventListener('input', () => {
    const search = searchInput.value.toLowerCase();
    const newUrl = new URL(window.location);
    search ? newUrl.searchParams.set('q', search) : newUrl.searchParams.delete('q');
    window.history.replaceState({}, '', newUrl);
    filterTable(search);
  });

  svlst.addEventListener('sort-end', (e) => {
    const visibleRows = Array.from(e.target.querySelectorAll('tbody > tr'))
      .filter(row => row.style.display !== 'none');
    visibleRows.forEach((row, i) => {
      row.classList.toggle('odd', i % 2 === 0);
      row.classList.toggle('even', i % 2 === 1);
    });
  });
})();

const MapsPage = (() => {
  const mapsFilter = document.getElementById('maps_filter');
  if (!mapsFilter) return;

  const mapLinks = document.querySelectorAll('.maplist a');
  const mapCountDisplay = document.getElementById('map-count');

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      mapsFilter.focus();
    }
  });

  mapsFilter.addEventListener('input', () => {
    const filterText = mapsFilter.value.toLowerCase();
    let visibleCount = 0;

    mapLinks.forEach(link => {
      const visible = link.textContent.toLowerCase().includes(filterText);
      link.style.display = visible ? 'inline-block' : 'none';
      if (visible) visibleCount++;
    });

    mapCountDisplay.textContent = `${visibleCount} ${visibleCount === 1 ? 'Map' : 'Maps'}`;
  });
})();

const ToolsPage = (() => {
  const serverForm = document.getElementById('server-form');
  if (!serverForm) return;

  const alertContainer = document.querySelector('.alert-container');

  const showAlert = (type, message) => {
    alertContainer.innerHTML = '';
    const div = document.createElement('div');
    div.classList.add('alert', type);
    div.textContent = message;
    alertContainer.appendChild(div);
  };

  serverForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const formData = new FormData(serverForm);
    const selectedServers = formData.getAll('servers');
    
    if (selectedServers.length === 0) {
      return showAlert('err', 'No servers selected.');
    }

    const url = formData.get('url');
    const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}$/;
    if (!webhookRegex.test(url)) {
      return showAlert('err', 'Invalid webhook URL.');
    }

    const submitButton = serverForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servers: selectedServers, url })
      });

      const result = await response.json();
      showAlert(result.error ? 'err' : 'msg', result.error || result.msg);
    } catch (error) {
      showAlert('err', 'An error occurred while submitting the form.');
    } finally {
      submitButton.disabled = false;
    }
  });
})();

const MapViewer = (() => {
  const canvas = document.getElementById('map-preview');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = 470;
  canvas.style.cursor = 'grab';

  let fileUrls = [];

  const map = {
    rotationMap: [0, Math.PI / 2, Math.PI, -Math.PI / 2],
    tintColors: {
      0: 'rgb(237, 81, 65)', 1: 'rgb(76, 163, 255)', 2: 'yellow',
      3: 'yellow', 4: 'yellow', 5: 'yellow', 6: 'yellow', 21: 'rgb(26, 187, 26)'
    },
    entityTypeMap: {
      0: 'Info_T', 1: 'Info_CT', 2: 'Info_VIP', 3: 'Info_Hostage',
      4: 'Info_RescuePoint', 5: 'Info_BombSpot', 6: 'Info_EscapePoint', 21: 'Env_Item'
    },
    combinations: [
      [0, 0, 2, { col: 1, row: 4 }], [0, 0, 1, { col: 0, row: 4 }], [0, 2, 0, { col: 1, row: 1 }],
      [0, 2, 2, { col: 1, row: 6 }], [0, 2, 1, { col: 0, row: 6 }], [0, 1, 0, { col: 0, row: 1 }],
      [0, 1, 2, { col: 1, row: 5 }], [0, 1, 1, { col: 0, row: 5 }], [1, 0, 0, { col: 0, row: 2 }],
      [1, 0, 2, { col: 1, row: 7 }], [1, 0, 1, { col: 0, row: 3 }], [1, 1, 0, { col: 0, row: 0 }],
      [1, 1, 2, { col: 1, row: 5 }], [1, 1, 1, { col: 0, row: 5 }], [1, 2, 0, { col: 1, row: 8 }],
      [1, 2, 2, { col: 1, row: 6 }], [1, 2, 1, { col: 0, row: 6 }], [2, 0, 0, { col: 1, row: 2 }],
      [2, 0, 2, { col: 1, row: 3 }], [2, 0, 1, { col: 0, row: 7 }], [2, 1, 0, { col: 0, row: 8 }],
      [2, 1, 2, { col: 1, row: 5 }], [2, 1, 1, { col: 0, row: 5 }], [2, 2, 0, { col: 1, row: 0 }],
      [2, 2, 1, { col: 0, row: 6 }], [2, 2, 2, { col: 1, row: 6 }]
    ],
    getTile(col, row) {
      if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) return 0;
      return this.map[col][row];
    },
    getTileMode(col, row) {
      if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) return 0;
      return this.tileMode[col][row];
    },
    getShadowTile(lt, t, l) {
      for (const [leftTop, top, left, shadow] of this.combinations) {
        if (lt === leftTop && t === top && l === left) return shadow;
      }
      return null;
    }
  };

  const Loader = {
    images: new Map(),
    loadImage(key, src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(key, img);
          resolve(img);
        };
        img.onerror = () => reject(`Could not load: ${src}`);
        img.src = src;
      });
    },
    getImage(key) {
      return this.images.get(key) || null;
    }
  };

  class Camera {
    constructor(mapData, width, height) {
      this.width = width;
      this.height = height;
      this.marginX = 200;
      this.marginY = 200;
      this.maxX = mapData.mapWidth * mapData.tileSize - width;
      this.maxY = mapData.mapHeight * mapData.tileSize - height;
      this.minX = -this.marginX;
      this.minY = -this.marginY;
      this.extMaxX = this.maxX + this.marginX;
      this.extMaxY = this.maxY + this.marginY;
      const initialX = (mapData.cam[0] * mapData.tileSize) - (width / 2);
      const initialY = (mapData.cam[1] * mapData.tileSize) - (height / 2);
      this.x = Math.max(this.minX, Math.min(initialX, this.extMaxX));
      this.y = Math.max(this.minY, Math.min(initialY, this.extMaxY));
    }
  }

  const Game = {
    isRunning: false,
    needsRedraw: false,
    hoveredTile: null,
    offscreenCanvas: null,
    offscreenCtx: null,
    mapRendered: false,
    arrowRight: document.querySelector('a.arrow-right'),
    arrowLeft: document.querySelector('a.arrow-left'),
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0,

    handleArrowClick(e) {
      e.preventDefault();
      const url = new URL(e.currentTarget.href);
      Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash);
    },

    async sendJsonRequest(url) {
      this.hoveredTile = null;
      this.isRunning = false;
      this.mapRendered = false;
      if (typeof tippy !== 'undefined') tippy.hideAll();
      
      try {
        const d = await Utils.fetchJSON(url);
        
        fileUrls = [];
        
        if (typeof window.mobileCheck === 'function' && !window.mobileCheck()) {
          fileUrls.push(`/maps/${d.name}`);
          const btnDownload = document.getElementById('btn-download');
          if (btnDownload) btnDownload.textContent = `Download ${d.name}.zip`;
        }
        
        history.pushState(null, '', `/maps/${d.name}`);
        document.title = `${d.name} - CS2D Server List`;
        document.getElementById('name').textContent = d.name;
        
        const hash = document.getElementById('hash');
        hash.textContent = d.mapHash.slice(0, 8) + '...';
        hash.setAttribute('data-tocopy', d.mapHash);
        
        this.arrowLeft.href = d.prevMap;
        this.arrowRight.href = d.nextMap;
        
        const items = document.querySelectorAll('.stats-container .stat-item');
        items[0].children[0].textContent = `Map ${d.name}.map`;
        items[0].children[0].setAttribute('data-href', `/cs2d/minimaps/${d.name}.webp`);
        items[0].children[1].textContent = Utils.bytesToSize(d.mapSize);
        items[1].children[1].textContent = `${d.mapWidth}×${d.mapHeight}`;
        items[2].children[0].textContent = `Tileset ${d.tileImg}`;
        fileUrls.push(`/cs2d/gfx/tiles/${d.tileImg}`);
        items[2].children[0].setAttribute('data-href', `/cs2d/gfx/tiles/${d.tileImg}`);
        items[2].children[1].textContent = Utils.bytesToSize(d.tileFileSize);
        items[3].children[1].textContent = d.tileCount;
        
        items[4].children[0].remove();
        const newEl = document.createElement('span');
        items[4].insertBefore(newEl, items[4].children[0]);
        
        if (d.bgImg && d.bgSize > 0) {
          newEl.setAttribute('data-href', '/cs2d/gfx/backgrounds/' + d.bgImg);
        }
        
        if (d.bgImg) {
          newEl.textContent = `Background ${d.bgImg}`;
          if (d.bgSize > 0) {
            fileUrls.push('/cs2d/gfx/backgrounds/' + d.bgImg);
            items[4].children[1].textContent = Utils.bytesToSize(d.bgSize);
            items[4].children[1].classList.remove('err');
          } else {
            items[4].children[1].textContent = 'Not Found';
            items[4].children[1].classList.add('err');
          }
        } else {
          newEl.textContent = 'Background';
          items[4].children[1].textContent = 'none';
          items[4].children[1].classList.remove('err');
        }
        
        items[5].children[1].textContent = d.bgColor;
        items[6].children[1].textContent = d.programUsed || 'N/A';
        
        const containerAuthor = items[7].children[1];
        containerAuthor.innerHTML = '';
        if (d.authorUSGN > 0) {
          const link = document.createElement('a');
          link.href = `https://unrealsoftware.de/profile.php?userid=${d.authorUSGN}`;
          link.target = '_blank';
          link.textContent = d.authorName || 'N/A';
          containerAuthor.appendChild(link);
        } else {
          const span = document.createElement('span');
          span.textContent = d.authorName || 'N/A';
          containerAuthor.appendChild(span);
        }
        
        const resourcesContainer = document.querySelector('.stats-container:nth-child(2)');
        document.querySelectorAll('.stats-container:nth-child(2) .stat-item').forEach(el => el.remove());
        
        if (d.resources.length === 0) {
          const note = document.createElement('span');
          note.className = 'stat-item no-external';
          note.textContent = 'No external resources needed.';
          resourcesContainer.appendChild(note);
        } else {
          d.resources.forEach(item => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            if (item.size > 0) {
              fileUrls.push('/cs2d/' + item.path);
              const span = document.createElement('span');
              span.setAttribute('data-href', '/cs2d/' + item.path);
              span.textContent = item.path;
              div.appendChild(span);
            } else {
              const span = document.createElement('span');
              span.textContent = item.path;
              div.appendChild(span);
            }
            div.appendChild(Utils.bytesToSize(item.size, true));
            resourcesContainer.appendChild(div);
          });
        }
        
        if (typeof initTippy === 'function') initTippy();
        this.loadMapDataFromCanvas(d);
      } catch (err) {
        console.error('Request failed:', err);
      }
    },

    getRandomEntityCoords(entities) {
      const type5 = entities.filter(e => e.type === 5);
      if (type5.length > 0) {
        const e = type5[Math.floor(Math.random() * type5.length)];
        return [e.x, e.y];
      }
      const type12 = entities.filter(e => e.type === 1 || e.type === 0);
      if (type12.length > 0) {
        const e = type12[Math.floor(Math.random() * type12.length)];
        return [e.x, e.y];
      }
      return [0, 0];
    },

    async loadMapDataFromCanvas(d) {
      Object.assign(map, {
        map: d.map, mapWidth: d.mapWidth, mapHeight: d.mapHeight,
        mapModifiers: d.mapModifiers, tileImg: d.tileImg, tileSize: d.tileSize,
        tileFileSize: d.tileFileSize, tileMode: d.tileMode, bgImg: d.bgImg,
        bgSize: d.bgSize, bgColor: d.bgColor, cam: this.getRandomEntityCoords(d.entities),
        entities: d.entities
      });

      const dynWalls = d.entities.filter(e => e.type === 71);
      for (const e of dynWalls) {
        if (e.int[0] > 0 && map.map && map.map[e.x]) map.map[e.x][e.y] = e.int[0];
        if (map.tileMode && map.tileMode[e.x]) {
          map.tileMode[e.x][e.y] = e.int[1] === 0 ? 1 : e.int[1] === 1 ? 2 : map.tileMode[e.x][e.y];
        }
      }

      const breakable = d.entities.filter(e => e.type === 25);
      for (const e of breakable) {
        if (e.int[0] > 0 && map.map && map.map[e.x]) map.map[e.x][e.y] = e.int[0];
        if (map.tileMode && map.tileMode[e.x]) {
          map.tileMode[e.x][e.y] = e.int[6] === 1 ? 1 : e.int[6] === 2 ? 2 : map.tileMode[e.x][e.y];
        }
      }

      if (!Loader.images.has(`tiles_${map.tileImg}`)) {
        await Loader.loadImage(`tiles_${map.tileImg}`, `/cs2d/gfx/tiles/${map.tileImg}`);
      }
      if (map.bgSize > 0 && !Loader.images.has(`bg_${map.bgImg}`)) {
        await Loader.loadImage(`bg_${map.bgImg}`, `/cs2d/gfx/backgrounds/${map.bgImg}`);
      }

      map.entities = map.entities.filter(e => [0, 1, 2, 3, 4, 5, 6, 21].includes(e.type));
      this.init();
    },

    init() {
      this.isDragging = false;
      this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0 };
      this.touch = { startX: 0, startY: 0, moved: false };

      const handleStart = (x, y) => {
        this.isDragging = true;
        this.mouse = { x, y, lastX: x, lastY: y };
        this.touch.startX = x;
        this.touch.startY = y;
        this.touch.moved = false;
        canvas.style.cursor = 'grabbing';
      };

      const handleMove = (x, y) => {
        this.mouse.x = x;
        this.mouse.y = y;
        
        if (this.isDragging) {
          const dx = Math.abs(x - this.touch.startX);
          const dy = Math.abs(y - this.touch.startY);
          if (dx > 5 || dy > 5) {
            this.touch.moved = true;
          }
        }
        
        if (!this.isDragging) {
          const worldX = this.mouse.x + this.camera.x;
          const worldY = this.mouse.y + this.camera.y;
          const tileX = Math.floor(worldX / map.tileSize);
          const tileY = Math.floor(worldY / map.tileSize);
          
          if (tileX >= 0 && tileX < map.mapWidth && tileY >= 0 && tileY < map.mapHeight) {
            const tileId = map.getTile(tileX, tileY);
            const entity = map.entities.find(e => e.x === tileX && e.y === tileY && e.type in map.entityTypeMap);
            this.hoveredTile = { x: tileX, y: tileY, id: tileId, entity };
            this.needsRedraw = true;
          } else {
            if (this.hoveredTile) {
              this.hoveredTile = null;
              this.needsRedraw = true;
            }
          }
        }
      };

      const handleEnd = () => {
        if (this.isDragging && !this.touch.moved) {
          const worldX = this.mouse.x + this.camera.x;
          const worldY = this.mouse.y + this.camera.y;
          const tileX = Math.floor(worldX / map.tileSize);
          const tileY = Math.floor(worldY / map.tileSize);
          
          if (tileX >= 0 && tileX < map.mapWidth && tileY >= 0 && tileY < map.mapHeight) {
            const tileId = map.getTile(tileX, tileY);
            const entity = map.entities.find(e => e.x === tileX && e.y === tileY && e.type in map.entityTypeMap);
            this.hoveredTile = { x: tileX, y: tileY, id: tileId, entity };
            this.needsRedraw = true;
          }
        }
        
        this.isDragging = false;
        canvas.style.cursor = 'grab';
      };

      canvas.addEventListener('mousedown', e => handleStart(e.offsetX, e.offsetY));
      canvas.addEventListener('mousemove', e => handleMove(e.offsetX, e.offsetY));
      canvas.addEventListener('mouseup', handleEnd);
      canvas.addEventListener('mouseleave', handleEnd);

      canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleStart(x, y);
      }, { passive: false });

      canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleMove(x, y);
      }, { passive: false });

      canvas.addEventListener('touchend', e => {
        e.preventDefault();
        handleEnd();
      }, { passive: false });

      this.camera = new Camera(map, canvas.width, canvas.height);

      const tileImg = Loader.getImage(`tiles_${map.tileImg}`);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tileImg.width;
      tempCanvas.height = tileImg.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(tileImg, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - 255) < 75 && Math.abs(data[i + 1]) < 75 && Math.abs(data[i + 2] - 255) < 75) {
          data[i + 3] = 0;
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
      this.tileAtlas = tempCanvas;

      this.shadowMap = Loader.getImage('shadows');
      if (map.tileSize === 64) {
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = this.shadowMap.width * 2;
        shadowCanvas.height = this.shadowMap.height * 2;
        const shadowCtx = shadowCanvas.getContext('2d');
        shadowCtx.drawImage(this.shadowMap, 0, 0, shadowCanvas.width, shadowCanvas.height);
        this.shadowMap = shadowCanvas;
      }

      const guiIcons = Loader.getImage('gui_icons');
      const iconCanvas = document.createElement('canvas');
      iconCanvas.width = 16;
      iconCanvas.height = 16;
      const iconCtx = iconCanvas.getContext('2d');
      iconCtx.drawImage(guiIcons, 48, 16, 16, 16, 0, 0, 16, 16);
      const iconData = iconCtx.getImageData(0, 0, 16, 16);
      const iconPixels = iconData.data;
      for (let i = 0; i < iconPixels.length; i += 4) {
        if (iconPixels[i] < 10 && iconPixels[i + 1] < 10 && iconPixels[i + 2] < 10) {
          iconPixels[i + 3] = 0;
        }
      }
      iconCtx.putImageData(iconData, 0, 0);
      this.gui_icons = iconCanvas;

      map.tilesetWidth = this.tileAtlas.width;
      map.tilesetHeight = this.tileAtlas.height;
      map.tilesetCols = Math.floor(map.tilesetWidth / map.tileSize);
      map.tilesetRows = Math.floor(map.tilesetHeight / map.tileSize);
      if (map.bgSize > 0) map.bgImg = Loader.getImage(`bg_${map.bgImg}`);

      this.offscreen = document.createElement('canvas');
      this.offscreen.width = map.tileSize;
      this.offscreen.height = map.tileSize;
      this.offCtx = this.offscreen.getContext('2d');

      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = map.mapWidth * map.tileSize;
      this.offscreenCanvas.height = map.mapHeight * map.tileSize;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');

      this.isRunning = true;
      this.needsRedraw = true;
      this.frameCount = 0;
      this.lastFpsUpdate = performance.now();
      requestAnimationFrame(this.tick.bind(this));
    },

    renderMapToOffscreen() {
      if (this.mapRendered) return;

      if (map.bgSize > 0) {
        this.offscreenCtx.fillStyle = this.offscreenCtx.createPattern(map.bgImg, 'repeat');
      } else {
        this.offscreenCtx.fillStyle = map.bgColor;
      }
      this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

      for (let r = 0; r < map.mapHeight; r++) {
        for (let c = 0; c < map.mapWidth; c++) {
          const tile = map.getTile(c, r);
          const sx = (tile % map.tilesetCols) * map.tileSize;
          const sy = Math.floor(tile / map.tilesetCols) * map.tileSize;
          const x = c * map.tileSize;
          const y = r * map.tileSize;
          const rotation = map.rotationMap[map.mapModifiers && map.mapModifiers[c] && map.mapModifiers[c][r] ? map.mapModifiers[c][r] : 0] || 0;
          
          if (rotation === 0) {
            this.offscreenCtx.drawImage(this.tileAtlas, sx, sy, map.tileSize, map.tileSize, x, y, map.tileSize, map.tileSize);
          } else {
            this.offscreenCtx.save();
            this.offscreenCtx.translate(x + map.tileSize / 2, y + map.tileSize / 2);
            this.offscreenCtx.rotate(rotation);
            this.offscreenCtx.drawImage(this.tileAtlas, sx, sy, map.tileSize, map.tileSize, -map.tileSize / 2, -map.tileSize / 2, map.tileSize, map.tileSize);
            this.offscreenCtx.restore();
          }
          
          if (tile === 0) continue;
          if (map.tileMode && map.tileMode[c] && map.tileMode[c][r] === 0) {
            const lt = map.getTileMode(c - 1, r - 1);
            const t = map.getTileMode(c, r - 1);
            const l = map.getTileMode(c - 1, r);
            if (!(lt === 0 && t === 0 && l === 0)) {
              const shadow = map.getShadowTile(lt, t, l);
              if (shadow) {
                this.offscreenCtx.save();
                this.offscreenCtx.globalAlpha = 0.8;
                this.offscreenCtx.globalCompositeOperation = 'multiply';
                this.offscreenCtx.drawImage(this.shadowMap, shadow.col * map.tileSize, shadow.row * map.tileSize,
                  map.tileSize, map.tileSize, x, y, map.tileSize, map.tileSize);
                this.offscreenCtx.restore();
              }
            }
          }
        }
      }

      this.mapRendered = true;
    },

    render() {
      if (this.isDragging) {
        const dx = this.mouse.lastX - this.mouse.x;
        const dy = this.mouse.lastY - this.mouse.y;
        this.camera.x = Math.max(this.camera.minX, Math.min(this.camera.x + dx, this.camera.extMaxX));
        this.camera.y = Math.max(this.camera.minY, Math.min(this.camera.y + dy, this.camera.extMaxY));
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        this.needsRedraw = true;
      }

      if (!this.needsRedraw) return;
      this.needsRedraw = false;

      this.renderMapToOffscreen();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        this.offscreenCanvas,
        this.camera.x, this.camera.y, this.camera.width, this.camera.height,
        0, 0, this.camera.width, this.camera.height
      );

      const startCol = Math.floor(this.camera.x / map.tileSize);
      const endCol = Math.ceil((this.camera.x + this.camera.width) / map.tileSize);
      const startRow = Math.floor(this.camera.y / map.tileSize);
      const endRow = Math.ceil((this.camera.y + this.camera.height) / map.tileSize);
      
      map.visibleEntities = map.entities.filter(e =>
        e.x >= startCol && e.x <= endCol && e.y >= startRow && e.y <= endRow
      );

      for (const e of map.visibleEntities) {
        const x = e.x * map.tileSize - this.camera.x;
        const y = e.y * map.tileSize - this.camera.y;
        const centerX = x + (map.tileSize / 4);
        const centerY = y + (map.tileSize / 4);
        
        this.offCtx.clearRect(0, 0, map.tileSize, map.tileSize);
        this.offCtx.drawImage(this.gui_icons, 0, 0, map.tileSize, map.tileSize);
        this.offCtx.globalCompositeOperation = 'source-in';
        this.offCtx.fillStyle = map.tintColors[e.type];
        this.offCtx.fillRect(0, 0, map.tileSize, map.tileSize);
        this.offCtx.globalCompositeOperation = 'source-over';
        
        ctx.save();
        ctx.shadowColor = 'rgb(0, 0, 0)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(this.offscreen, 0, 0, map.tileSize, map.tileSize, centerX, centerY, map.tileSize / 2, map.tileSize / 2);
        ctx.restore();
      }

      ctx.save();
      ctx.font = '0.8rem Inter';
      ctx.textBaseline = 'top';
      const padding = 5;
      const fpsText = this.fps;
      const fpsWidth = ctx.measureText(fpsText).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, fpsWidth + padding * 2, 12 + padding * 2);
      ctx.fillStyle = 'white';
      ctx.fillText(fpsText, padding, padding);
      ctx.restore();

      if (this.hoveredTile) {
        let entityText = '';
        if (this.hoveredTile.entity) {
          entityText = ` - ${map.entityTypeMap[this.hoveredTile.entity.type]}`;
        }
        const text = `Tile Position ${this.hoveredTile.x}|${this.hoveredTile.y} - Tile #${this.hoveredTile.id}${entityText}`;
        ctx.save();
        ctx.font = '0.8rem Inter';
        ctx.textBaseline = 'top';
        const textWidth = ctx.measureText(text).width;
        const textHeight = 12;
        const y = canvas.height - (textHeight + padding * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, y, textWidth + padding * 2, textHeight + padding * 2);
        ctx.fillStyle = 'white';
        ctx.fillText(text, padding, y + padding);
        ctx.restore();
      }
    },

    tick(timestamp) {
      if (!this.isRunning) return;

      this.frameCount++;
      if (timestamp - this.lastFpsUpdate >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = timestamp;
        this.needsRedraw = true;
      }

      this.render();
      requestAnimationFrame(this.tick.bind(this));
    },

    async run(context, canvasElement) {
      if (this.arrowRight) this.arrowRight.addEventListener('click', this.handleArrowClick.bind(this));
      if (this.arrowLeft) this.arrowLeft.addEventListener('click', this.handleArrowClick.bind(this));
      this.ctx = context;
      this.canvas = canvasElement;
      this.width = canvasElement.width;
      this.height = canvasElement.height;
      const data = JSON.parse(canvasElement.getAttribute('data-canvas'));
      await Loader.loadImage('shadows', '/shadows.png');
      await Loader.loadImage('gui_icons', '/gui_icons.bmp');
      this.loadMapDataFromCanvas(data);
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && Game.arrowLeft) {
      const url = new URL(Game.arrowLeft.href);
      Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash);
    } else if (e.key === 'ArrowRight' && Game.arrowRight) {
      const url = new URL(Game.arrowRight.href);
      Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash);
    }
  });

  Game.run(ctx, canvas);
})();

function initTippy() {
  if (typeof tippy === 'undefined') return;
  
  tippy('[data-href]', {
    trigger: 'click',
    interactive: true,
    appendTo: document.body,
    onShow(instance) {
      const href = instance.reference.getAttribute('data-href');
      if (!href) return;
      const lowerHref = href.toLowerCase();
      
      fetch(href)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const contentLength = response.headers.get('Content-Length');
          return Promise.all([response.blob(), contentLength]);
        })
        .then(([blob, contentLength]) => {
          let mainContent;
          if (/\.(webp|png|bmp|jpe?g)$/.test(lowerHref)) {
            const image = new Image();
            image.style.display = 'block';
            image.style.maxWidth = '300px';
            image.style.margin = '1rem auto';
            image.style.height = 'auto';
            image.src = href;
            mainContent = image;
          } else if (/\.(ogg|wav)$/.test(lowerHref)) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = href;
            mainContent = audio;
          } else {
            mainContent = document.createTextNode('Unsupported file type');
          }
          
          const container = document.createElement('div');
          if (mainContent) container.appendChild(mainContent);
          const link = document.createElement('a');
          link.href = href;
          link.download = '';
          link.textContent = `Download ${href.split('/').pop()}`;
          container.appendChild(link);
          instance.setContent(container);
        })
        .catch((error) => {
          instance.setContent(`Request failed. ${error}`);
        });
    }
  });
  
  tippy('[data-tippy-content]', { allowHTML: true });
}

document.querySelectorAll('.stats-container').forEach(container => {
  container.addEventListener('scroll', () => {
    if (typeof tippy !== 'undefined') tippy.hideAll();
  }, { passive: true });
});

if (typeof tippy !== 'undefined') {
  tippy('[data-tippy-content]', { allowHTML: true });
}