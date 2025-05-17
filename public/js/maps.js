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
    const target = instance.reference

    // Find the <a> inside the .cs2d span
    const link = target.querySelector('a')
    const href = link?.getAttribute('href')

    if (!href) {
      instance.setContent('No download link found.')
      return
    }

    fetch(href)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const image = new Image()
        image.style.display = 'block'
        image.src = url
        instance.setContent(image)
      })
      .catch((error) => {
        instance.setContent(`Request failed. ${error}`)
      })
  }
})
;

  const TILE_FLOOR = 0
  const TILE_WALL = 1
  const TILE_OBSTACLE = 2
  const map = {
    combinations: [
      [TILE_FLOOR, TILE_FLOOR, TILE_FLOOR, null],
      [TILE_FLOOR, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 4 }],
      [TILE_FLOOR, TILE_FLOOR, TILE_WALL, { col: 0, row: 4 }],
      [TILE_FLOOR, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 1 }],
      [TILE_FLOOR, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
      [TILE_FLOOR, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
      [TILE_FLOOR, TILE_WALL, TILE_FLOOR, { col: 0, row: 1 }],
      [TILE_FLOOR, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
      [TILE_FLOOR, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
      [TILE_WALL, TILE_FLOOR, TILE_FLOOR, { col: 0, row: 2 }],
      [TILE_WALL, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 7 }],
      [TILE_WALL, TILE_FLOOR, TILE_WALL, { col: 0, row: 3 }],
      [TILE_WALL, TILE_WALL, TILE_FLOOR, { col: 0, row: 0 }],
      [TILE_WALL, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
      [TILE_WALL, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
      [TILE_WALL, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 8 }],
      [TILE_WALL, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
      [TILE_WALL, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
      [TILE_OBSTACLE, TILE_FLOOR, TILE_FLOOR, { col: 1, row: 2 }],
      [TILE_OBSTACLE, TILE_FLOOR, TILE_OBSTACLE, { col: 1, row: 3 }],
      [TILE_OBSTACLE, TILE_FLOOR, TILE_WALL, { col: 0, row: 7 }],
      [TILE_OBSTACLE, TILE_WALL, TILE_FLOOR, { col: 0, row: 8 }],
      [TILE_OBSTACLE, TILE_WALL, TILE_OBSTACLE, { col: 1, row: 5 }],
      [TILE_OBSTACLE, TILE_WALL, TILE_WALL, { col: 0, row: 5 }],
      [TILE_OBSTACLE, TILE_OBSTACLE, TILE_FLOOR, { col: 1, row: 0 }],
      [TILE_OBSTACLE, TILE_OBSTACLE, TILE_WALL, { col: 0, row: 6 }],
      [TILE_OBSTACLE, TILE_OBSTACLE, TILE_OBSTACLE, { col: 1, row: 6 }],
    ],
    get tilesetCols() {
      return Math.floor(this.tilesetWidth / this.tsize)
    },
    get tilesetRows() {
      return Math.floor(this.tilesetHeight / this.tsize)
    },
    getTile(col, row) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0
      return this.tiles[col][row]
    },
    getTileMode(col, row) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0
      return this.tilemodes[col][row]
    },
    getShadowTile(leftTopTile, topTile, leftTile) {
      for (const [lt, t, l, shadow] of this.combinations) {
        if (leftTopTile === lt && topTile === t && leftTile === l) return shadow
      }
      return null
    }
  }

  const Loader = {
    images: new Map(),
    loadImage(key, src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          this.images.set(key, img)
          resolve(img)
        }
        img.onerror = () => reject(`Could not load image: ${src}`)
        img.src = src
      })
    },
    getImage(key) {
      return this.images.get(key) || null
    }
  }

  class Camera {
    constructor(map, width, height) {
      this.width = width
      this.height = height
      this.maxX = map.cols * map.tsize - width
      this.maxY = map.rows * map.tsize - height

      const initialX = (map.camera[0] * map.tsize - width) + (width / 2)
      const initialY = (map.camera[1] * map.tsize - height) + (height / 2)

      this.x = Math.max(0, Math.min(initialX, this.maxX))
      this.y = Math.max(0, Math.min(initialY, this.maxY))
    }
  }

  const Game = {
    async run(ctx, canvas) {
      this.ctx = ctx
      this.canvas = canvas
      this.width = canvas.width
      this.height = canvas.height
      this._previousElapsed = 0
      this.loadMapDataFromCanvas()
      await Promise.all(this.load())
      this.init()
      requestAnimationFrame(this.tick.bind(this))
    },

    loadMapDataFromCanvas() {
      const canvas = this.canvas
      map.tiles = JSON.parse(canvas.dataset.tiles)
      map.modifiers = JSON.parse(canvas.dataset.modifiers)
      map.tilemodes = JSON.parse(canvas.dataset.tilemodes)
      map.tsize = parseInt(canvas.dataset.tilesize, 10)
      map.cols = parseInt(canvas.dataset.mapwidth, 10)
      map.rows = parseInt(canvas.dataset.mapheight, 10)
      map.bg = canvas.dataset.backgroundimage
      map.tilesetImageSrc = canvas.dataset.tilesetimage
      map.tilesetWidth = 0
      map.tilesetHeight = 0
      map.rgb = canvas.dataset.backgroundcolor
      map.camera = JSON.parse(canvas.dataset.camera)
    },

    load() {
      if (map.bg) {
        return [
          Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tilesetImageSrc}`),
          Loader.loadImage('shadowmap', '/shadowmap.png'),
          Loader.loadImage('bg', `/cs2d/gfx/backgrounds/${map.bg}`)
        ]
      } else {
        return [
          Loader.loadImage('tiles', `/cs2d/gfx/tiles/${map.tilesetImageSrc}`),
          Loader.loadImage('shadowmap', '/shadowmap.png')
        ]
      }

    },

    init() {
      this.isDragging = false
      this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0 }
      this.canvas.addEventListener('mousedown', e => {
        if (e.button === 0) {
          this.isDragging = true
          this.mouse.x = e.offsetX
          this.mouse.y = e.offsetY
          this.mouse.lastX = e.offsetX
          this.mouse.lastY = e.offsetY
          this.canvas.style.cursor = 'grabbing'
        }
      })

      this.canvas.addEventListener('mousemove', e => {
        this.mouse.x = e.offsetX
        this.mouse.y = e.offsetY
      })

      this.canvas.addEventListener('mouseup', e => {
        if (e.button === 0) {
          this.isDragging = false
          this.canvas.style.cursor = 'grab'
        }
      })

      this.canvas.addEventListener('mouseleave', () => {
        this.isDragging = false
        this.canvas.style.cursor = 'grab'
      })

      this.camera = new Camera(map, this.canvas.width, this.canvas.height)

      let tilesImg = Loader.getImage('tiles')
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = tilesImg.width
      tempCanvas.height = tilesImg.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(tilesImg, 0, 0)
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imgData.data
      function isCloseToMagenta(r, g, b, tolerance = 75) {
        return Math.abs(r - 255) < tolerance &&
              Math.abs(g - 0) < tolerance &&
              Math.abs(b - 255) < tolerance
      }
      for (let i = 0; i < data.length; i += 4) {
        if (isCloseToMagenta(data[i], data[i + 1], data[i + 2])) {
          data[i + 3] = 0
        }
      }
      tempCtx.putImageData(imgData, 0, 0)
      this.tileAtlas = tempCanvas

      this.shadowMap = Loader.getImage('shadowmap')
      map.tilesetWidth = this.tileAtlas.width
      map.tilesetHeight = this.tileAtlas.height

      if (map.bg) {
        this.bgimg = Loader.getImage('bg')
      }
    },

    update(delta) {
      if (this.isDragging) {
        const dx = this.mouse.lastX - this.mouse.x
        const dy = this.mouse.lastY - this.mouse.y

        this.camera.x = Math.max(0, Math.min(this.camera.x + dx, this.camera.maxX))
        this.camera.y = Math.max(0, Math.min(this.camera.y + dy, this.camera.maxY))

        this.mouse.lastX = this.mouse.x
        this.mouse.lastY = this.mouse.y
      }
    },

    render() {
      ctx.fillStyle = map.rgb
      if (map.bg) {
        ctx.fillStyle = ctx.createPattern(this.bgimg, 'repeat')
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let startCol = Math.floor(this.camera.x / map.tsize);
      let endCol = Math.ceil((this.camera.x + this.camera.width) / map.tsize);
      let startRow = Math.floor(this.camera.y / map.tsize);
      let endRow = Math.ceil((this.camera.y + this.camera.height) / map.tsize);
      let offsetX = -this.camera.x + startCol * map.tsize;
      let offsetY = -this.camera.y + startRow * map.tsize;

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const tile = map.getTile(c, r);
          // Draw tiles
          const sx = (tile % map.tilesetCols) * map.tsize;
          const sy = Math.floor(tile / map.tilesetCols) * map.tsize;
          const x = Math.round((c - startCol) * map.tsize + offsetX);
          const y = Math.round((r - startRow) * map.tsize + offsetY);
          const rotation = (() => {
            switch (map.modifiers?.[c]?.[r]) {
              case 1: return Math.PI / 2;
              case 2: return Math.PI;
              case 3: return -Math.PI / 2;
              default: return 0;
            }
          })();
          this.ctx.save();
          this.ctx.translate(Math.round(x + map.tsize / 2), Math.round(y + map.tsize / 2));
          this.ctx.rotate(rotation);
          this.ctx.drawImage(
            this.tileAtlas,
            sx, sy, map.tsize, map.tsize,
            -map.tsize / 2, -map.tsize / 2, map.tsize, map.tsize
          );
          this.ctx.restore();

          // Draw shadows
          if (tile === 0) continue;
          if (map.tilemodes?.[c]?.[r] === 0) {
            const leftTopTile = map.getTileMode(c - 1, r - 1);
            const topTile = map.getTileMode(c, r - 1);
            const leftTile = map.getTileMode(c - 1, r);
            if (!(leftTopTile === 0 && topTile === 0 && leftTile === 0)) {
              const shadowTile = map.getShadowTile(leftTopTile, topTile, leftTile);
              if (shadowTile) {
                const sxShadow = shadowTile.col * 32;
                const syShadow = shadowTile.row * 32;
                this.ctx.save();
                this.ctx.globalAlpha = 0.8;
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.drawImage(
                  this.shadowMap,
                  sxShadow,
                  syShadow,
                  map.tsize,
                  map.tsize,
                  Math.round((c - startCol) * map.tsize + offsetX),
                  Math.round((r - startRow) * map.tsize + offsetY),
                  map.tsize,
                  map.tsize
                );
                this.ctx.restore();
              }
            }
          }
        }
      }
    },

    tick(elapsed) {
      requestAnimationFrame(this.tick.bind(this))

      this.ctx.clearRect(0, 0, this.width, this.height)

      let delta = (elapsed - this._previousElapsed) / 1000.0
      delta = Math.min(delta, 0.25)
      this._previousElapsed = elapsed

      this.update(delta)
      this.render()
    },
  }

  const canvas = document.getElementById('map-preview')
  const ctx = canvas.getContext('2d')
  const parent = canvas.parentElement
  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight
  canvas.style.cursor = 'grab'
  Game.run(ctx, canvas)
}
