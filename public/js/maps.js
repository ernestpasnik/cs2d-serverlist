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

const left = document.querySelector('.arrow-left');
if (left) {
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      if (left) window.location.href = left.href;
    } else if (e.key === 'ArrowRight') {
      const right = document.querySelector('.arrow-right');
      if (right) window.location.href = right.href;
    }
  });

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
    async run(ctx, canvas) {
      this.ctx = ctx;
      this.canvas = canvas;
      this.width = canvas.width;
      this.height = canvas.height;
      this.loadMapDataFromCanvas();
      await Promise.all(this.load());
      this.init();
      requestAnimationFrame(this.tick.bind(this));
    },

    loadMapDataFromCanvas() {
      const canvas = this.canvas
      const data = JSON.parse(canvas.getAttribute('data-canvas'))
      map.map = data.map
      map.mapWidth = data.mapWidth
      map.mapHeight = data.mapHeight
      map.mapModifiers = data.mapModifiers
      map.tileImg = data.tileImg
      map.tileMode = data.tileMode
      map.tileSize = data.tileSize
      map.bgImg = data.bgImg
      map.bgRGB = data.bgRGB
      map.cam = data.cam
    },

    load() {
      if (map.bgImg) {
        return [
          Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tileImg}`),
          Loader.loadImage('shadowmap', '/shadowmap.png'),
          Loader.loadImage('bg', `/cs2d/gfx/backgrounds/${map.bgImg}`)
        ];
      } else {
        return [
          Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tileImg}`),
          Loader.loadImage('shadowmap', '/shadowmap.png')
        ];
      }
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
      if (map.bgImg) {
        ctx.fillStyle = ctx.createPattern(map.bgImg, 'repeat');
      } else {
        ctx.fillStyle = map.bgRGB;
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

    tick() {
      requestAnimationFrame(this.tick.bind(this));
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.update();
      this.render();
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
