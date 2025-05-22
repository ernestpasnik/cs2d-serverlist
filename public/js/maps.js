window.mobileCheck = function () {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};
if (window.mobileCheck()) {
  const button = document.getElementById('btn-download');
  button.disabled = true;
  button.textContent = 'Downloads are not supported on mobile devices.';
}

const bytesToSize = (b, colors = false) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  if (b === 0) {
    if (colors) {
      const span = document.createElement('span')
      span.style.color = '#ff7474'
      span.textContent = 'Not Found'
      return span
    }
    return '0 B'
  }

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

  const span = document.createElement('span')
  span.style.color = color
  span.textContent = str

  return span
}

let fileUrls = [];
async function GenerateZipDownload() {
  const button = document.getElementById('btn-download')
  button.disabled = true
  const originalText = button.textContent
  button.textContent = 'Please wait...'

  const zip = new JSZip();
  for (const url of fileUrls) {
    try {
      const match = url.match(/(gfx|sfx|maps)\/.+/);
      if (!match) continue;
      const relativePath = match[0];
      const blob = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.blob();
      })
      zip.file(relativePath, blob);
    } catch (err) {
      console.error(`Error fetching or adding ${url}:`, err);
    }
  }
  const zipBlob = await zip.generateAsync({ type: "blob", streamFiles: true });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = document.getElementById('name').textContent + '.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  button.textContent = originalText
  button.disabled = false
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
  tippy('[data-href]', {
    trigger: 'click',
    interactive: true,
    appendTo: document.body,
    onShow(instance) {
      const href = instance.reference.getAttribute('data-href')
      if (!href) return
      const lowerHref = href.toLowerCase()
      fetch(href)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const contentLength = response.headers.get('Content-Length')
          return Promise.all([response.blob(), contentLength])
        })
        .then(([blob, contentLength]) => {
          let mainContent
          if (/\.(webp|png|bmp|jpe?g)$/.test(lowerHref)) {
            const image = new Image()
            image.style.display = 'block'
            image.style.maxWidth = '300px'
            image.style.margin = '1rem auto'
            image.style.height = 'auto'
            image.src = href
            mainContent = image
          } else if (/\.(ogg|wav)$/.test(lowerHref)) {
            const audio = document.createElement('audio')
            audio.controls = true
            audio.src = href
            mainContent = audio
          } else {
            mainContent = document.createTextNode('Unsupported file type')
          }
          const container = document.createElement('div')
          if (mainContent) container.appendChild(mainContent)
          const link = document.createElement('a')
          link.href = href
          link.download = ''
          link.textContent = `Download ${href.split('/').pop()}`
          container.appendChild(link)
          instance.setContent(container)
        })
        .catch((error) => {
          instance.setContent(`Request failed. ${error}`)
        })
    }
  })
}

document.querySelectorAll('.stats-container').forEach(container => {
  container.addEventListener('scroll', () => {
    tippy.hideAll()
  }, { passive: true })
})

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
    rotationMap: [0, Math.PI / 2, Math.PI, -Math.PI / 2],
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
      0: 'Info_T',
      1: 'Info_CT',
      2: 'Info_VIP',
      3: 'Info_Hostage',
      4: 'Info_RescuePoint',
      5: 'Info_BombSpot',
      6: 'Info_EscapePoint',
      21: 'Env_Item',
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
      this.marginX = 200
      this.marginY = 200
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
      this.hoveredTile = null;
      Game.isRunning = false;
      tippy.hideAll();
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Request failed');
        const d = await response.json();
        if (!window.mobileCheck()) {
          fileUrls = [];
          document.getElementById('btn-download').textContent = `Download ${d.name}.zip`;
          fileUrls.push(`/maps/${d.name}`);
        }
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
        fileUrls.push(`/cs2d/gfx/tiles/${d.tileImg}`)
        item[2].children[0].setAttribute('data-href', `/cs2d/gfx/tiles/${d.tileImg}`);
        item[2].children[1].textContent = bytesToSize(d.tileFileSize);
        item[3].children[1].textContent = d.tileCount;
        item[4].children[0].remove()
        const newEl = document.createElement('span')
        item[4].insertBefore(newEl, item[4].children[0])
        if (d.bgImg && d.bgSize > 0) {
          newEl.setAttribute('data-href', '/cs2d/gfx/backgrounds/' + d.bgImg)
        }
        if (d.bgImg) {
          newEl.textContent = `Background ${d.bgImg}`
          if (d.bgSize > 0) {
            fileUrls.push('/cs2d/gfx/backgrounds/' + d.bgImg)
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
              fileUrls.push('/cs2d/' + item.path)
              const span = document.createElement('span')
              span.setAttribute('data-href', '/cs2d/' + item.path)
              span.textContent = item.path
              div.appendChild(span)
            } else {
              const spanPath = document.createElement('span')
              spanPath.textContent = item.path
              div.appendChild(spanPath)
            }
            div.appendChild(bytesToSize(item.size, true))
            resourcesContainer.appendChild(div)
          })
        }
        initTippy();
        Game.loadMapDataFromCanvas(d);
      } catch (err) {
        console.error(err);
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

      // Func_DynWall
      const dynWalls = d.entities.filter(e => e.type === 71)
      for (const e of dynWalls) {
        if (e.int[0] > 0 && map.map?.[e.x]) {
          map.map[e.x][e.y] = e.int[0]
        }
        if (map.tileMode?.[e.x]) {
          if (e.int[1] === 0) {
            map.tileMode[e.x][e.y] = 1
          } else if (e.int[1] === 1) {
            map.tileMode[e.x][e.y] = 2
          }
        }
      }

      // Env_Breakable
      const breakable = d.entities.filter(e => e.type === 25)
      for (const e of breakable) {
        if (e.int[0] > 0 && map.map?.[e.x]) {
          map.map[e.x][e.y] = e.int[0]
        }

        if (map.tileMode?.[e.x]) {
          if (e.int[6] === 1) {
            map.tileMode[e.x][e.y] = 1
          } else if (e.int[6] === 2) {
            map.tileMode[e.x][e.y] = 2
          }
        }
      }

      if (!Loader.images.has(`tiles_${map.tileImg}`)) {
        await Loader.loadImage(`tiles_${map.tileImg}`, `/cs2d/gfx/tiles/${map.tileImg}`);
      }
      if ((map.bgSize > 0) && !Loader.images.has(`bg_${map.bgImg}`)) {
        await Loader.loadImage(`bg_${map.bgImg}`, `/cs2d/gfx/backgrounds/${map.bgImg}`);
      }

      // Keep only the entities we want to show
      map.entities = map.entities.filter(e => [0, 1, 2, 3, 4, 5, 6, 21].includes(e.type))
      this.init();
    },

    init() {
      this.isDragging = false;
      this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0 };
      this.canvas.addEventListener('mousedown', e => {
        this.isDragging = true;
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.lastX = e.offsetX;
        this.mouse.lastY = e.offsetY;
        this.canvas.style.cursor = 'grabbing';
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
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      });

      this.camera = new Camera(map, this.canvas.width, this.canvas.height);

      // Load tiles
      let tileImg = Loader.getImage(`tiles_${map.tileImg}`);
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
      if (map.bgSize > 0) map.bgImg = Loader.getImage(`bg_${map.bgImg}`);


      // Entities
      this.offscreen = document.createElement('canvas')
      this.offscreen.width = map.tileSize
      this.offscreen.height = map.tileSize
      this.offCtx = this.offscreen.getContext('2d')

      Game.isRunning = true;
      this.firstRun = true;
      requestAnimationFrame(this.tick.bind(this));
    },

    render() {
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
        entity.y >= startRow && entity.y <= endRow
      )

      if (map.bgSize > 0) {
        ctx.fillStyle = ctx.createPattern(map.bgImg, 'repeat');
      } else {
        ctx.fillStyle = map.bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);


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
          const rotation = map.rotationMap[map.mapModifiers?.[c]?.[r] ?? 0] || 0;
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
        const centerX = x + (map.tileSize / 4)
        const centerY = y + (map.tileSize / 4)
        this.offCtx.clearRect(0, 0, map.tileSize, map.tileSize)
        this.offCtx.drawImage(this.gui_icons, 0, 0, map.tileSize, map.tileSize)
        this.offCtx.globalCompositeOperation = 'source-in'
        this.offCtx.fillStyle = map.tintColors[e.type]
        this.offCtx.fillRect(0, 0, map.tileSize, map.tileSize)
        this.offCtx.globalCompositeOperation = 'source-over'
        this.ctx.save()
        this.ctx.shadowColor = 'rgb(0, 0, 0)'
        this.ctx.shadowBlur = 12
        this.ctx.shadowOffsetX = 2
        this.ctx.shadowOffsetY = 2
        this.ctx.drawImage(this.offscreen, 0, 0, map.tileSize, map.tileSize, centerX, centerY, map.tileSize / 2, map.tileSize / 2)
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

    tick() {
      if (!this.isRunning) return
      if (this.isDragging || this.firstRun == true) {
        this.firstRun = false
        this.render()
      }
      this.animationFrameId = requestAnimationFrame(this.tick.bind(this))
    },
  };

  const canvas = document.getElementById('map-preview');
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = 470;
  canvas.style.cursor = 'grab';
  Game.run(ctx, canvas);
};
