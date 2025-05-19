const bytesToSize = (b, colors = false) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) return colors ? `<span style="color: rgb(96, 255, 95)">0 B</span>` : '0 B'
  const i = Math.floor(Math.log(b) / Math.log(1024))
  const size = Math.round(b / Math.pow(1024, i))
  const str = `${size} ${sizes[i]}`
  if (!colors) return str
  const max = 3 * 1024 * 1024
  const ratio = Math.min(b / max, 1)
  const r = Math.round(96 + (255 - 96) * ratio)
  const g = Math.round(255 - 255 * ratio)
  const bCol = Math.round(95 - 95 * ratio)
  const color = `rgb(${r}, ${g}, ${bCol})`
  return `<span style="color: ${color}">${str}</span>`
}

const maps_filter = document.getElementById('maps_filter');
if (maps_filter) {
  const mapLinks = document.querySelectorAll('.maplist a');
  const mapCountDisplay = document.getElementById('map-count');

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      maps_filter.focus();
    }
  });

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

function initTippy() {
  tippy('.cs2d', {
    trigger: 'click',
    interactive: true,
    onShow(instance) {
      const href = instance.reference.getAttribute('data-href');
      if (!href) return;
      fetch(href)
        .then((response) => response.blob())
        .then(() => {
          const image = new Image();
          image.style.display = 'block'
          image.style.maxWidth = '250px'
          image.style.width = '100%'
          image.style.height = 'auto'
          image.src = href;
          instance.setContent(image);
        })
        .catch((error) => {
          instance.setContent(`Request failed. ${error}`);
        });
    }
  });
}

const left = document.querySelector('.arrow-left');
if (left) {
  initTippy();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      const url = new URL(document.querySelector('a.arrow-left').href)
      Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash)
    } else if (e.key === 'ArrowRight') {
      const url = new URL(document.querySelector('a.arrow-right').href)
      Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash)
    }
  });

  const map = {
    tintColors: {
      0: 'rgb(237, 81, 65)',
      1: 'rgb(76, 163, 255)',
      2: 'yellow',
      3: 'yellow',
      4: 'yellow',
      5: 'yellow',
      6: 'yellow',
      21: 'rgb(26, 187, 26)',
    },
    entityTypeMap: {
      0: 'T',
      1: 'CT',
      2: 'VIP',
      3: 'Hostage',
      4: 'RescuePoint',
      5: 'BombSpot',
      6: 'EscapePoint',
      21: 'Item',
    },
    combinations: [
      [0, 0, 2, { col: 1, row: 4 }],
      [0, 0, 1, { col: 0, row: 4 }],
      [0, 2, 0, { col: 1, row: 1 }],
      [0, 2, 2, { col: 1, row: 6 }],
      [0, 2, 1, { col: 0, row: 6 }],
      [0, 1, 0, { col: 0, row: 1 }],
      [0, 1, 2, { col: 1, row: 5 }],
      [0, 1, 1, { col: 0, row: 5 }],
      [1, 0, 0, { col: 0, row: 2 }],
      [1, 0, 2, { col: 1, row: 7 }],
      [1, 0, 1, { col: 0, row: 3 }],
      [1, 1, 0, { col: 0, row: 0 }],
      [1, 1, 2, { col: 1, row: 5 }],
      [1, 1, 1, { col: 0, row: 5 }],
      [1, 2, 0, { col: 1, row: 8 }],
      [1, 2, 2, { col: 1, row: 6 }],
      [1, 2, 1, { col: 0, row: 6 }],
      [2, 0, 0, { col: 1, row: 2 }],
      [2, 0, 2, { col: 1, row: 3 }],
      [2, 0, 1, { col: 0, row: 7 }],
      [2, 1, 0, { col: 0, row: 8 }],
      [2, 1, 2, { col: 1, row: 5 }],
      [2, 1, 1, { col: 0, row: 5 }],
      [2, 2, 0, { col: 1, row: 0 }],
      [2, 2, 1, { col: 0, row: 6 }],
      [2, 2, 2, { col: 1, row: 6 }]
    ],
    getTile(col, row) {
      if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) return 0;
      return this.map[col][row];
    },
    getTileMode(col, row) {
      if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) return 0;
      return this.tileMode[col][row];
    },
    getShadowTile(leftTopTile, topTile, leftTile) {
      for (const [lt, t, l, shadow] of this.combinations) {
        if (leftTopTile === lt && topTile === t && leftTile === l) return shadow;
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
        img.onerror = () => reject(`Could not load image: ${src}`);
        img.src = src;
      });
    },
    getImage(key) {
      return this.images.get(key) || null;
    }
  };

  class Camera {
    constructor(map, width, height) {
      this.width = width
      this.height = height
      this.marginX = 100
      this.marginY = 50
      this.maxX = map.mapWidth * map.tileSize - width
      this.maxY = map.mapHeight * map.tileSize - height
      this.minX = -this.marginX
      this.minY = -this.marginY
      this.extMaxX = this.maxX + this.marginX
      this.extMaxY = this.maxY + this.marginY
      const initialX = (map.cam[0] * map.tileSize) - (width / 2)
      const initialY = (map.cam[1] * map.tileSize) - (height / 2)
      this.x = Math.max(this.minX, Math.min(initialX, this.extMaxX))
      this.y = Math.max(this.minY, Math.min(initialY, this.extMaxY))
    }
  }

  const Game = {
    isRunning: false,
    animationFrameId: null,
    arrowRight: document.querySelector('a.arrow-right'),
    arrowLeft: document.querySelector('a.arrow-left'),

    handleArrowClick(e) {
      e.preventDefault()
      if (e.currentTarget === Game.arrowRight) {
        const url = new URL(document.querySelector('a.arrow-right').href)
        Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash)
        Game.arrowRight.removeEventListener('click', Game.handleArrowClick)
      }
      else if (e.currentTarget === Game.arrowLeft) {
        const url = new URL(document.querySelector('a.arrow-left').href)
        Game.sendJsonRequest('/api' + url.pathname + url.search + url.hash)
        Game.arrowLeft.removeEventListener('click', Game.handleArrowClick)
      }
    },

    async sendJsonRequest(url) {
      tippy.hideAll();
      Game.isRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Request failed');
        const d = await response.json();

        history.pushState(null, '', `/maps/${d.name}`);
        document.title = `${d.name} - CS2D Server List`;
        document.getElementById('name').textContent = d.name;
        const hash = document.getElementById('hash');
        hash.textContent = d.mapHash.slice(0, 8) + '...';
        hash.setAttribute('data-tocopy', d.mapHash)
        document.querySelector('a.arrow-left').href = d.prevMap;
        document.querySelector('a.arrow-right').href = d.nextMap;
        const item = document.querySelectorAll('.stats-container .stat-item')
        item[0].children[0].textContent = `Map ${d.name}.map`
        item[0].children[0].setAttribute('data-href', `/cs2d/minimaps/${d.name}.webp`);
        item[0].children[1].textContent = bytesToSize(d.mapSize);
        item[1].children[1].textContent = `${d.mapWidth}×${d.mapHeight}`;
        item[2].children[0].textContent = `Tileset ${d.tileImg}`;
        item[2].children[0].setAttribute('data-href', `/cs2d/gfx/tiles/${d.tileImg}`);
        item[2].children[1].textContent = bytesToSize(d.tileFileSize);
        item[3].children[1].textContent = d.tileCount;
        item[4].children[0].textContent = `Background ${d.bgImg || ''}`;
        if (item[4].children[0]) {
          item[4].children[0].remove()
        }
        const newEl = document.createElement('span')
        newEl.textContent = 'Background ' + (d.bgImg || '')
        if (d.bgImg) {
          const isImage = /\.(png|bmp|jpe?g)$/i.test(d.bgImg)
          if (isImage && d.bgSize > 0) {
            newEl.classList.add('cs2d')
            newEl.setAttribute('data-href', '/cs2d/gfx/backgrounds/' + d.bgImg)
          }
        }
        item[4].insertBefore(newEl, item[4].children[0] || null)
        if (d.bgImg) {
          if (d.bgSize > 0) {
            item[4].children[1].textContent = bytesToSize(d.bgSize)
            item[4].children[1].classList.remove('err')
          } else {
            item[4].children[1].textContent = 'Not Found'
            item[4].children[1].classList.add('err')
          }
        } else {
          newEl.textContent = 'Background'
          item[4].children[1].textContent = 'none'
          item[4].children[1].classList.remove('err')
        }
        item[5].children[1].textContent = d.bgColor;
        item[6].children[1].textContent = d.programUsed || 'N/A';
        const containerAuthor = item[7].children[1]
        containerAuthor.innerHTML = ''
        if (d.authorUSGN > 0) {
          const link = document.createElement('a')
          link.href = `https://unrealsoftware.de/profile.php?userid=${d.authorUSGN}`
          link.target = '_blank'
          link.textContent = d.authorName || 'N/A'
          containerAuthor.appendChild(link)
        } else {
          const span = document.createElement('span')
          span.textContent = d.authorName || 'N/A'
          containerAuthor.appendChild(span)
        }
        const resources = d.resources;
        const resourcesContainer = document.querySelector('.stats-container:nth-child(2)');
        const resourcesEl = document.querySelectorAll('.stats-container:nth-child(2) .stat-item');
        resourcesEl.forEach(element => {
          element.remove();
        });
        if (resources.length === 0) {
          const note = document.createElement('span')
          note.className = 'stat-item no-external'
          note.textContent = 'No external resources needed.'
          resourcesContainer.appendChild(note)
        } else {
          resources.forEach(item => {
            const div = document.createElement('div')
            div.className = 'stat-item'
            if (item.size > 0) {
              const isImage = /\.(png|bmp|jpe?g)$/i.test(item.path)
              const span = document.createElement('span')
              span.setAttribute('data-href', '/cs2d/' + item.path)
              if (isImage) span.classList.add('cs2d')
              span.textContent = item.path
              div.appendChild(span)
            } else {
              const spanPath = document.createElement('span')
              spanPath.textContent = item.path
              div.appendChild(spanPath)
            }
            const spanSize = document.createElement('span')
            spanSize.innerHTML = item.size > 0 ? bytesToSize(item.size, true) : 'Not Found'
            div.appendChild(spanSize)
            if (item.size === 0) spanSize.classList.add('err')
            resourcesContainer.appendChild(div)
          })
        }
        initTippy();
        Game.loadMapDataFromCanvas(d);
        Game.isRunning = true;
      } catch (err) {
        console.error('Error fetching JSON:', err);
        Game.isRunning = true;
      }
    },

    async run(ctx, canvas) {
      this.arrowRight.addEventListener('click', this.handleArrowClick.bind(this))
      this.arrowLeft.addEventListener('click', this.handleArrowClick.bind(this))
      this.ctx = ctx;
      this.canvas = canvas;
      this.width = canvas.width;
      this.height = canvas.height;
      const data = JSON.parse(canvas.getAttribute('data-canvas'));
      await Loader.loadImage('shadows', '/img/shadows.png');
      await Loader.loadImage('gui_icons', '/img/gui_icons.bmp');
      this.loadMapDataFromCanvas(data);
    },

    getRandomEntityCoords(entities) {
      const type5Entities = entities.filter(e => e.type === 5)
      if (type5Entities.length > 0) {
        const entity = type5Entities[Math.floor(Math.random() * type5Entities.length)]
        return [entity.x, entity.y]
      }
      const type1or2Entities = entities.filter(e => e.type === 1 || e.type === 2)
      if (type1or2Entities.length > 0) {
        const entity = type1or2Entities[Math.floor(Math.random() * type1or2Entities.length)]
        return [entity.x, entity.y]
      }
      return null
    },

    async loadMapDataFromCanvas(d) {
      map.map = d.map;
      map.mapWidth = d.mapWidth;
      map.mapHeight = d.mapHeight;
      map.mapModifiers = d.mapModifiers;
      map.tileImg = d.tileImg;
      map.tileSize = d.tileSize;
      map.tileFileSize = d.tileFileSize;
      map.tileMode = d.tileMode;
      map.bgImg = d.bgImg;
      map.bgSize = d.bgSize;
      map.bgColor = d.bgColor;
      map.cam = this.getRandomEntityCoords(d.entities);
      map.entities = d.entities;
      const dynWalls = d.entities.filter(e => e.type === 71)
      for (const e of dynWalls) {
        if (e.int[0] > 0) {
        map.map[e.x][e.y] = e.int[0];
        }
        if (e.int[1] == 0) {
          map.tileMode[e.x][e.y] = 1;
        } else if (e.int[1] == 1) {
          map.tileMode[e.x][e.y] = 2;
        }
      }
      await Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tileImg}`);
      if (map.bgSize > 0) await Loader.loadImage('bg', `/cs2d/gfx/backgrounds/${map.bgImg}`);
      this.init();
    },

    init() {
      this.isDragging = false;
      this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0 };
      this.canvas.addEventListener('mousedown', e => {
        if (e.button === 0) {
          this.isDragging = true;
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
          this.mouse.lastX = e.offsetX;
          this.mouse.lastY = e.offsetY;
          this.canvas.style.cursor = 'grabbing';
        }
      });

      this.canvas.addEventListener('mousemove', e => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        const worldX = this.mouse.x + this.camera.x;
        const worldY = this.mouse.y + this.camera.y;
        const tileX = Math.floor(worldX / map.tileSize);
        const tileY = Math.floor(worldY / map.tileSize);
        if (tileX >= 0 && tileX < map.mapWidth && tileY >= 0 && tileY < map.mapHeight) {
          const tileId = map.getTile(tileX, tileY);
          const entity = map.entities.find(e => e.x === tileX && e.y === tileY && e.type in map.entityTypeMap);
          this.hoveredTile = { x: tileX, y: tileY, id: tileId, entity };
        } else {
          this.hoveredTile = null;
        }
      });

      this.canvas.addEventListener('mouseup', e => {
        if (e.button === 0) {
          this.isDragging = false;
          this.canvas.style.cursor = 'grab';
        }
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      });

      this.camera = new Camera(map, this.canvas.width, this.canvas.height);

      // Load tiles
      let tileImg = Loader.getImage('tiles');
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tileImg.width;
      tempCanvas.height = tileImg.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(tileImg, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;
      function isCloseToMagenta(r, g, b, tolerance = 75) {
        return Math.abs(r - 255) < tolerance &&
          Math.abs(g - 0) < tolerance &&
          Math.abs(b - 255) < tolerance;
      }
      for (let i = 0; i < data.length; i += 4) {
        if (isCloseToMagenta(data[i], data[i + 1], data[i + 2])) {
          data[i + 3] = 0;
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
      this.tileAtlas = tempCanvas;

      // Load shadows
      this.shadowMap = Loader.getImage('shadows');
      if (map.tileSize === 64) {
        const canvas = document.createElement('canvas');
        canvas.width = this.shadowMap.width * 2;
        canvas.height = this.shadowMap.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.shadowMap, 0, 0, canvas.width, canvas.height);
        this.shadowMap = canvas;
      }

      // Load gui_icons
      this.gui_icons = Loader.getImage('gui_icons')
      const tileWidth = 16
      const tileHeight = 16
      const col = 3
      const row = 1
      const canvas = document.createElement('canvas')
      canvas.width = tileWidth
      canvas.height = tileHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        this.gui_icons,
        col * tileWidth, row * tileHeight,
        tileWidth, tileHeight,
        0, 0,
        tileWidth, tileHeight
      )
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data2 = imageData.data
      for (let i = 0; i < data2.length; i += 4) {
        const r = data2[i]
        const g = data2[i + 1]
        const b = data2[i + 2]
        if (r < 10 && g < 10 && b < 10) {
          data2[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)
      this.gui_icons = canvas

      // Set tileset size
      map.tilesetWidth = this.tileAtlas.width;
      map.tilesetHeight = this.tileAtlas.height;
      map.tilesetCols = Math.floor(map.tilesetWidth / map.tileSize);
      map.tilesetRows = Math.floor(map.tilesetHeight / map.tileSize);
      if (map.bgSize > 0) {
        map.bgImg = Loader.getImage('bg');
      }
      requestAnimationFrame(this.tick.bind(this));
      Game.isRunning = true;
    },

    update() {
      if (!this.isDragging) {
        this.isRunning = false;
      }
      this.isRunning = true;

      if (this.isDragging) {
        const dx = this.mouse.lastX - this.mouse.x
        const dy = this.mouse.lastY - this.mouse.y
        this.camera.x = Math.max(this.camera.minX, Math.min(this.camera.x + dx, this.camera.extMaxX))
        this.camera.y = Math.max(this.camera.minY, Math.min(this.camera.y + dy, this.camera.extMaxY))
        this.mouse.lastX = this.mouse.x
        this.mouse.lastY = this.mouse.y
      }

      const startCol = Math.floor(this.camera.x / map.tileSize)
      const endCol = Math.ceil((this.camera.x + this.camera.width) / map.tileSize)
      const startRow = Math.floor(this.camera.y / map.tileSize)
      const endRow = Math.ceil((this.camera.y + this.camera.height) / map.tileSize)
      map.visibleEntities = map.entities.filter(entity =>
        entity.x >= startCol && entity.x <= endCol &&
        entity.y >= startRow && entity.y <= endRow &&
        entity.type in map.entityTypeMap
      )

      // Entities
      this.offscreen = document.createElement('canvas')
      this.offscreen.width = map.tileSize
      this.offscreen.height = map.tileSize
      this.offCtx = this.offscreen.getContext('2d')

      if (map.bgSize > 0) {
        ctx.fillStyle = ctx.createPattern(map.bgImg, 'repeat');
      } else {
        ctx.fillStyle = map.bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    render() {
      const startCol = Math.floor(this.camera.x / map.tileSize);
      const endCol = Math.ceil((this.camera.x + this.camera.width) / map.tileSize);
      const startRow = Math.floor(this.camera.y / map.tileSize);
      const endRow = Math.ceil((this.camera.y + this.camera.height) / map.tileSize);
      const offsetX = -this.camera.x + startCol * map.tileSize;
      const offsetY = -this.camera.y + startRow * map.tileSize;

      for (let r = startRow; r <= endRow; r++) {
        if (r < 0 || r >= map.mapHeight) continue;
        for (let c = startCol; c <= endCol; c++) {
          if (c < 0 || c >= map.mapWidth) continue;
          const tile = map.getTile(c, r);
          const sx = (tile % map.tilesetCols) * map.tileSize;
          const sy = Math.floor(tile / map.tilesetCols) * map.tileSize;
          const x = Math.round((c - startCol) * map.tileSize + offsetX);
          const y = Math.round((r - startRow) * map.tileSize + offsetY);
          const rotation = (() => {
            switch (map.mapModifiers?.[c]?.[r]) {
              case 1: return Math.PI / 2;
              case 2: return Math.PI;
              case 3: return -Math.PI / 2;
              default: return 0;
            }
          })();

          if (rotation === 0) {
            this.ctx.drawImage(this.tileAtlas, sx, sy, map.tileSize, map.tileSize, x, y, map.tileSize, map.tileSize)
          } else {
            this.ctx.save()
            this.ctx.translate(Math.round(x + map.tileSize / 2), Math.round(y + map.tileSize / 2))
            this.ctx.rotate(rotation)
            this.ctx.drawImage(this.tileAtlas, sx, sy, map.tileSize, map.tileSize, -map.tileSize / 2, -map.tileSize / 2, map.tileSize, map.tileSize)
            this.ctx.restore()
          }
          if (tile === 0) continue;
          if (map.tileMode?.[c]?.[r] === 0) {
            const leftTopTile = map.getTileMode(c - 1, r - 1);
            const topTile = map.getTileMode(c, r - 1);
            const leftTile = map.getTileMode(c - 1, r);
            if (!(leftTopTile === 0 && topTile === 0 && leftTile === 0)) {
              const shadowTile = map.getShadowTile(leftTopTile, topTile, leftTile);
              if (shadowTile) {
                const sxShadow = shadowTile.col * map.tileSize;
                const syShadow = shadowTile.row * map.tileSize;
                this.ctx.save();
                this.ctx.globalAlpha = 0.8;
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.drawImage(
                  this.shadowMap,
                  sxShadow,
                  syShadow,
                  map.tileSize,
                  map.tileSize,
                  Math.round((c - startCol) * map.tileSize + offsetX),
                  Math.round((r - startRow) * map.tileSize + offsetY),
                  map.tileSize,
                  map.tileSize
                );
                this.ctx.restore();
              }
            }
          }
        }
      }

      for (const e of map.visibleEntities) {
        const x = Math.round((e.x - startCol) * map.tileSize + offsetX)
        const y = Math.round((e.y - startRow) * map.tileSize + offsetY)
        const centerX = x + (map.tileSize - map.tileSize / 1.5) / 2
        const centerY = y + (map.tileSize - map.tileSize / 1.5) / 2
        this.offCtx.clearRect(0, 0, map.tileSize, map.tileSize)
        this.offCtx.drawImage(this.gui_icons, 0, 0, map.tileSize, map.tileSize)
        this.offCtx.globalCompositeOperation = 'source-in'
        this.offCtx.fillStyle = map.tintColors[e.type]
        this.offCtx.fillRect(0, 0, map.tileSize, map.tileSize)
        this.offCtx.globalCompositeOperation = 'source-over'
        this.ctx.save()
        this.ctx.shadowColor = 'rgba(12, 14, 12, 0.9)'
        this.ctx.shadowBlur = 8
        this.ctx.shadowOffsetX = 2
        this.ctx.shadowOffsetY = 2
        this.ctx.drawImage(this.offscreen, 0, 0, map.tileSize, map.tileSize, centerX - 4, centerY - 4, map.tileSize / 1.5, map.tileSize / 1.5)
        this.ctx.font = '0.75rem Inter';
        this.ctx.fillStyle = map.tintColors[e.type]
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'top'
        const label = map.entityTypeMap[e.type]
        this.ctx.fillText(label, centerX + (map.tileSize / 1.5) / 2 + 4, centerY + (map.tileSize / 1.5) / 2 + 4)
        this.ctx.restore()
      }

      // Draw Text
      if (this.hoveredTile) {
        let entityText = '';
        if (this.hoveredTile.entity) {
          entityText = ` - ${map.entityTypeMap[this.hoveredTile.entity.type]}`
        }
        const text = `Tile Position ${this.hoveredTile.x}|${this.hoveredTile.y} - Tile #${this.hoveredTile.id}${entityText}`;
        this.ctx.save();
        this.ctx.font = '0.875rem Inter';
        this.ctx.textBaseline = 'top';
        const padding = 5;
        const textWidth = this.ctx.measureText(text).width;
        const textHeight = 12;
        const y = this.canvas.height - (textHeight + padding * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, y, textWidth + padding * 2, textHeight + padding * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(text, 0 + padding, y + padding);
        this.ctx.restore();
      }
    },

    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.tick();
      }
    },

    stop() {
      if (this.isRunning) {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      }
    },

    tick() {
      if (!this.isRunning) return
      this.update()
      this.render()
      this.animationFrameId = requestAnimationFrame(this.tick.bind(this))
    },

  };

  const canvas = document.getElementById('map-preview');
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = 448;
  canvas.style.cursor = 'grab';
  Game.run(ctx, canvas);
};
