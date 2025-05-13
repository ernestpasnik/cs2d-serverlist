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
