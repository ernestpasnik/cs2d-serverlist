const searchInput = document.getElementById('search');
if (searchInput) {
  const svlst = document.getElementsByClassName('svlst')[0];
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const serversCountElement = document.getElementById('servers');

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

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('search');
      if (searchInput) searchInput.focus();
    }
  });

  const filterTable = (search) => {
    const visibleRows = [];
    svlst.querySelectorAll('tbody > tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const match = text.includes(search);
      row.style.display = match ? '' : 'none';
      if (match) visibleRows.push(row);
    });
    
    visibleRows.forEach((row, index) => {
      row.classList.toggle('odd', index % 2 === 0);
      row.classList.toggle('even', index % 2 === 1);
    });

    if (serversCountElement) {
      const serverCount = visibleRows.length;
      serversCountElement.innerHTML = `${serverCount} Server${serverCount !== 1 ? 's' : ''}`;
    }
  };

  if (searchQuery) {
    filterTable(searchQuery.toLowerCase());
  }

  searchInput.addEventListener('input', () => {
    const search = searchInput.value.toLowerCase();
    const newUrl = new URL(window.location);
    if (search) {
      newUrl.searchParams.set('q', search);
    } else {
      newUrl.searchParams.delete('q');
    }
    window.history.replaceState({}, '', newUrl);
    filterTable(search);
  });

  svlst.addEventListener('sort-end', function (e) {
    let visibleRows = [];
    e.target.querySelectorAll('tbody > tr').forEach(row => {
      if (row.style.display !== 'none') {
        visibleRows.push(row);
      }
    });
    visibleRows.forEach((row, index) => {
      row.classList.toggle('odd', index % 2 === 0);
      row.classList.toggle('even', index % 2 === 1);
    });
  });
}
