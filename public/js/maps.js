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
}

function loadMap(mapData) {
  const TILE_SIZE = 32;
  const tilesetUrl = `https://cs2d.pp.ua/`;

  const mapContainer = document.getElementsByClassName('map-container')[0];
  const containerWidth = mapContainer.offsetWidth;
  const containerHeight = mapContainer.offsetHeight;

  const config = {
    type: Phaser.AUTO,
    width: containerWidth,
    height: 430,
    backgroundColor: '#000',
    parent: 'phaser',
    pixelArt: true,
    transparent: true,
    scene: {
      preload: function() {
        this.load.setBaseURL(tilesetUrl);
        this.load.image('tileset', `cs2d/gfx/tiles/${mapData.header.tilesetImage}`);
      },
      create: function() {
        const tilesetImage = this.textures.get('tileset').getSourceImage();
        
        // Create an offscreen canvas to manipulate the image
        const canvas = document.createElement('canvas');
        canvas.width = tilesetImage.width;
        canvas.height = tilesetImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tilesetImage, 0, 0);

        // Loop through the pixels and change pink (#f0f) to transparent
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const targetRed = 255;
        const targetGreen = 0;
        const targetBlue = 255;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] === targetRed && data[i + 1] === targetGreen && data[i + 2] === targetBlue) {
            data[i + 3] = 0; // Make it transparent
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Add the processed canvas as a new texture
        this.textures.addCanvas('transparent-tileset', canvas);

        // Use the transparent tileset in your map creation
        const map = this.make.tilemap({
          width: mapData.header.mapWidth,
          height: mapData.header.mapHeight,
          tileWidth: TILE_SIZE,
          tileHeight: TILE_SIZE
        });

        const tiles = map.addTilesetImage('transparent-tileset');
        const floor = map.createBlankLayer('floor', tiles);
        const obstacle = map.createBlankLayer('obstacle', tiles);
        const walls = map.createBlankLayer('walls', tiles);

        // Loop through the map data and place the tiles
        for (let x = 0; x < mapData.header.mapHeight; x++) {
          for (let y = 0; y < mapData.header.mapWidth; y++) {
            const tileIndex = mapData.map[y][x];
            if (tileIndex >= 0 && tileIndex < tiles.total) {
              let tile;
              const mode = mapData.tileModes[tileIndex];

              if (mode === 1) {
                floor.putTileAt(tileIndex, y, x);
                const shadow = this.add.graphics();
                shadow.fillStyle(0x000000, 0.5);
                shadow.fillRect(y * TILE_SIZE + 8, x * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE);
                shadow.setDepth(0.5);
                tile = walls.putTileAt(tileIndex, y, x);
                walls.setDepth(1);
              } else if (mode === 2) {
                floor.putTileAt(tileIndex, y, x);
                const shadow = this.add.graphics();
                shadow.fillStyle(0x222222, 0.20);
                shadow.fillRect(y * TILE_SIZE + 8, x * TILE_SIZE + 8, TILE_SIZE, TILE_SIZE);
                shadow.setDepth(0.5);
                tile = obstacle.putTileAt(tileIndex, y, x);
                obstacle.setDepth(1);
              } else {
                tile = floor.putTileAt(tileIndex, y, x);
                floor.setDepth(0);
              }

              const mod = mapData.modifiers?.[y]?.[x] ?? 0;
              if (mod === 1) tile.rotation = Phaser.Math.DegToRad(90);
              else if (mod === 2) tile.rotation = Phaser.Math.DegToRad(180);
              else if (mod === 3) tile.rotation = Phaser.Math.DegToRad(270);
            }
          }
        }

        // Mouse interaction for moving the map
        let isDragging = false;
        let startX, startY;

        this.input.on('pointerdown', (pointer) => {
          isDragging = true;
          startX = pointer.x;
          startY = pointer.y;
        });

        this.input.on('pointermove', (pointer) => {
          if (isDragging) {
            const deltaX = pointer.x - startX;
            const deltaY = pointer.y - startY;
            let camera = this.cameras.main;

            camera.scrollX -= deltaX * camera.zoom; // Move the camera
            camera.scrollY -= deltaY * camera.zoom;

            startX = pointer.x;
            startY = pointer.y;
          }
        });

        this.input.on('pointerup', () => {
          isDragging = false;
        });
      }
    }
  };

  return config;
}

// Dynamically load Phaser from CDN (cdnjs)
const phaserScript = document.createElement('script');
phaserScript.src = 'https://cdn.jsdelivr.net/npm/phaser@v3.88.2/dist/phaser.min.js';
phaserScript.onload = () => {
  console.log('Phaser has been loaded from CDN');
  const mapDiv = document.getElementById('phaser');
  if (mapDiv && mapDiv.getAttribute('data-mapdata')) {
    const mapDataJson = JSON.parse(mapDiv.getAttribute('data-mapdata'));
    new Phaser.Game(loadMap(mapDataJson));
  }
};
document.head.appendChild(phaserScript);
