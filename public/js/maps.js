const bytesToSize = (b) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (b === 0) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${Math.round(b / Math.pow(1024, i))} ${sizes[i]}`;
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
    onShow(instance) {
      const target = instance.reference;
      const href = target.getAttribute('href');
      if (!href) return;
      fetch(href)
        .then((response) => response.blob())
        .then(() => {
          const image = new Image();
          image.style.display = 'block';
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
      const href = document.querySelector('a.arrow-left').href
      const url = new URL(href)
      const pathOnly = url.pathname + url.search + url.hash
      Game.sendJsonRequest('/api' + pathOnly)
    } else if (e.key === 'ArrowRight') {
      const href = document.querySelector('a.arrow-right').href
      const url = new URL(href)
      const pathOnly = url.pathname + url.search + url.hash
      Game.sendJsonRequest('/api' + pathOnly)
    }
  });

  const map = {
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
      this.width = width;
      this.height = height;
      this.maxX = map.mapWidth * map.tileSize - width;
      this.maxY = map.mapHeight * map.tileSize - height;
      const initialX = (map.cam[0] * map.tileSize - width) + (width / 2);
      const initialY = (map.cam[1] * map.tileSize - height) + (height / 2);
      this.x = Math.max(0, Math.min(initialX, this.maxX));
      this.y = Math.max(0, Math.min(initialY, this.maxY));
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
        const href = document.querySelector('a.arrow-right').href
        const url = new URL(href)
        const pathOnly = url.pathname + url.search + url.hash
        Game.sendJsonRequest('/api' + pathOnly)
        Game.arrowRight.removeEventListener('click', Game.handleArrowClick)
      }
      else if (e.currentTarget === Game.arrowLeft) {
        const href = document.querySelector('a.arrow-left').href
        const url = new URL(href)
        const pathOnly = url.pathname + url.search + url.hash
        Game.sendJsonRequest('/api' + pathOnly)
        Game.arrowLeft.removeEventListener('click', Game.handleArrowClick)
      }
    },

    async sendJsonRequest(url) {
      
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
        item[0].children[1].textContent = bytesToSize(d.mapSize);
        item[1].children[1].textContent = `${d.mapWidth}×${d.mapHeight}`;
        item[2].children[0].textContent = `Tileset ${d.tileImg}`;
        item[2].children[1].textContent = bytesToSize(d.tilesetSize);
        item[3].children[1].textContent = d.tileCount;
        item[4].children[0].textContent = `Background ${d.bgImg || ''}`;
        if (d.bgImg) {
          if (d.bgSize === 0) {
            item[4].children[1].textContent = 'Not Found';
          } else {
            item[4].children[1].textContent = bytesToSize(d.bgSize);
          }
        } else {
          item[4].children[1].textContent = 'none';
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
            if (item.size === 0) div.classList.add('err')
            if (item.size > 0) {
              const isImage = /\.(png|bmp|jpe?g)$/i.test(item.path)
              const a = document.createElement('a')
              a.href = '/cs2d/' + item.path
              if (isImage) a.classList.add('cs2d')
              a.textContent = item.path
              div.appendChild(a)
            } else {
              const spanPath = document.createElement('span')
              spanPath.textContent = item.path
              div.appendChild(spanPath)
            }
            const spanSize = document.createElement('span')
            spanSize.textContent = item.size > 0 ? bytesToSize(item.size) : 'Not Found'
            div.appendChild(spanSize)
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
      await Loader.loadImage('shadowmap', '/shadowmap.png');
      this.loadMapDataFromCanvas(data);
    },

    async loadMapDataFromCanvas(d) {
      map.map = d.map;
      map.mapWidth = d.mapWidth;
      map.mapHeight = d.mapHeight;
      map.mapModifiers = d.mapModifiers;
      map.tileImg = d.tileImg;
      map.tileMode = d.tileMode;
      map.tileSize = d.tileSize;
      map.bgImg = d.bgImg;
      map.bgSize = d.bgSize;
      map.bgColor = d.bgColor;
      map.cam = d.cam;
      await Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tileImg}`)
      if (map.bgSize > 0) await Loader.loadImage('bg', `/cs2d/gfx/backgrounds/${map.bgImg}`)
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
      this.shadowMap = Loader.getImage('shadowmap');
      if (map.tileSize === 64) {
        const canvas = document.createElement('canvas');
        canvas.width = this.shadowMap.width * 2;
        canvas.height = this.shadowMap.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.shadowMap, 0, 0, canvas.width, canvas.height);
        this.shadowMap = canvas;
      }

      map.tilesetWidth = this.tileAtlas.width;
      map.tilesetHeight = this.tileAtlas.height;
      map.tilesetCols = Math.floor(map.tilesetWidth / map.tileSize);
      map.tilesetRows = Math.floor(map.tilesetHeight / map.tileSize);
      if (map.bgImg) {
        map.bgImg = Loader.getImage('bg');
      }
      requestAnimationFrame(this.tick.bind(this));
      Game.isRunning = true;
    },

    update() {
      if (this.isDragging) {
        const dx = this.mouse.lastX - this.mouse.x;
        const dy = this.mouse.lastY - this.mouse.y;
        this.camera.x = Math.max(0, Math.min(this.camera.x + dx, this.camera.maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y + dy, this.camera.maxY));
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
      }
    },

    render() {
      if (map.bgSize > 0) {
        ctx.fillStyle = ctx.createPattern(map.bgImg, 'repeat');
      } else {
        ctx.fillStyle = map.bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const startCol = Math.floor(this.camera.x / map.tileSize);
      const endCol = Math.ceil((this.camera.x + this.camera.width) / map.tileSize);
      const startRow = Math.floor(this.camera.y / map.tileSize);
      const endRow = Math.ceil((this.camera.y + this.camera.height) / map.tileSize);
      const offsetX = -this.camera.x + startCol * map.tileSize;
      const offsetY = -this.camera.y + startRow * map.tileSize;

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
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
    },

    start() {
      if (!this.isRunning) {
        this.isRunning = true
        this.tick()
      }
    },

    stop() {
      if (this.isRunning) {
        this.isRunning = false
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId)
          this.animationFrameId = null
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
