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

const imageContainer = document.getElementById('image-container');
if (imageContainer) {
  const bg = imageContainer.dataset.bg;
  if (bg) imageContainer.style.backgroundImage = `url('/cs2d/gfx/backgrounds/${bg}')`;
  const rgb = imageContainer.dataset.rgb;
  imageContainer.style.backgroundColor = rgb;
  const image = document.getElementById('image');
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');

  let scale = 1;
  let offsetX = 0, offsetY = 0;
  const scaleFactor = 0.5;
  const minScale = 1;
  let maxScale = 4;
  let isDragging = false;
  let startX, startY;

  function updateMaxScale() {
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (width > 3000 || height > 3000) {
      maxScale = 8;
    } else if (width > 2500 || height > 2500) {
      maxScale = 7;
    } else if (width > 2000 || height > 2000) {
      maxScale = 6;
    } else if (width > 1500 || height > 1500) {
      maxScale = 5;
    } else if (width > 1000 || height > 1000) {
      maxScale = 4;
    } else if (width > 500 || height > 500) {
      maxScale = 3;
    } else {
      maxScale = 2;
    }
  }

  image.onload = function () {
    updateMaxScale();
  };

  imageContainer.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      scale = Math.min(scale + scaleFactor, maxScale);
    } else {
      scale = Math.max(scale - scaleFactor, minScale);
    }
    image.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
  });

  image.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    isDragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
    image.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (event) => {
    if (isDragging) {
      const moveX = event.clientX - startX;
      const moveY = event.clientY - startY;
      offsetX += (moveX - offsetX) * 0.03;
      offsetY += (moveY - offsetY) * 0.03;
      image.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    image.style.cursor = 'grab';
  });

  image.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  image.addEventListener('dragstart', (event) => {
    event.preventDefault();
  });

  imageContainer.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      isDragging = true;
      startX = event.touches[0].clientX - offsetX;
      startY = event.touches[0].clientY - offsetY;
      image.style.cursor = 'grabbing';
    }
  });

  imageContainer.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (isDragging && event.touches.length === 1) {
      const moveX = event.touches[0].clientX - startX;
      const moveY = event.touches[0].clientY - startY;
      offsetX += (moveX - offsetX) * 0.03;
      offsetY += (moveY - offsetY) * 0.03;
      image.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
    }
  });

  document.addEventListener('touchend', (event) => {
    if (event.touches.length === 0) {
      isDragging = false;
      image.style.cursor = 'grab';
    }
  });

  zoomInButton.addEventListener('click', () => {
    scale = Math.min(scale + scaleFactor * 2, maxScale);
    image.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
  });

  zoomOutButton.addEventListener('click', () => {
    scale = Math.max(scale - scaleFactor * 2, minScale);
    image.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
  });
}
